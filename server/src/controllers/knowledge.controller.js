const pdf = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const prisma = require('../config/database');
const logger = require('../utils/logger');
const { generateEmbedding } = require('../services/embedding.service');
const { WebCrawler } = require('../services/crawler.service');
const redisCache = require('../services/cache.service');
const { summarizeText } = require('../services/summarizer.service');

// --- Helper Functions ---

function chunkText(text, maxWords = 400, overlap = 50) {
  if (!text || typeof text !== 'string') return [];
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  let start = 0;
  while (start < words.length) {
    const end = Math.min(start + maxWords, words.length);
    const chunk = words.slice(start, end).join(' ');
    chunks.push(chunk);
    if (end === words.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

async function resolveBusinessId(req) {
  let businessId = req.user && req.user.businessId;
  try {
    if (!businessId && req.user && (req.user.userId || req.user.email)) {
      let dbUser = null;
      if (req.user.userId) {
        dbUser = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { businesses: true } });
      } else if (req.user.email) {
        dbUser = await prisma.user.findUnique({ where: { email: req.user.email }, include: { businesses: true } });
      }
      if (dbUser && dbUser.businesses && dbUser.businesses.length > 0) {
        businessId = dbUser.businesses[0].id;
      }
    }

    if (!businessId) return null;

    // Verify business exists
    const business = await prisma.business.findUnique({ where: { id: businessId } });
    if (!business) return null;

    return businessId;
  } catch (err) {
    logger.warn('resolveBusinessId error:', { error: err?.message || err });
    return null;
  }
}

function classifyChunk(content) {
  const txt = (content || '').toLowerCase();
  if (txt.match(/\b(menu|menu\s+items|dish|price|pricing|menu\b)/)) return 'MENU';
  if (txt.match(/\b(contact|phone|email|address|location)\b/)) return 'CONTACT';
  if (txt.match(/\b(service|services|what we do|offer|offers)\b/)) return 'SERVICE';
  if (txt.match(/\b(promo|promotion|discount|sale|offer)\b/)) return 'PROMOTION';
  return 'OTHER';
}

async function createChunksForKB(kb) {
  try {
    if (!kb || !kb.content) return;
    const raw = kb.content;
    const normalized = raw.replace(/\s+/g, ' ').trim();
    const pieces = chunkText(normalized, 300, 50);

    if (pieces.length === 0) return;

    const data = pieces.map((p, idx) => ({
      knowledgeBaseId: kb.id,
      businessId: kb.businessId,
      content: p,
      metadata: { source: kb.type || 'UNKNOWN', kbId: kb.id, index: idx }
    }));

    // Defensive: ensure `data` is an array before passing to Prisma
    if (!Array.isArray(data) || data.length === 0) {
      logger.warn('No chunk data to create for KB', { kbId: kb.id, piecesLength: pieces.length });
    } else {
      try {
        await prisma.knowledgeChunk.createMany({ data });
        logger.info(`Created ${data.length} chunks for KB ${kb.id}`);
      } catch (e) {
        logger.error('Prisma createMany failed when creating KB chunks', { kbId: kb.id, error: e && e.message, sample: data.slice(0,3) });
        throw e; // rethrow so upstream handlers can catch and respond
      }
    }

    try {
      const pending = await prisma.knowledgeChunk.findMany({ where: { knowledgeBaseId: kb.id, businessId: kb.businessId }, orderBy: { createdAt: 'asc' } });

      const hasRedis = !!process.env.REDIS_URL;
      let chunkQueue = null;
      if (hasRedis) {
        try { chunkQueue = require('../queue/queue').chunkQueue; } catch (e) { chunkQueue = null; }
      }

      for (const chunk of pending) {
        if (chunk.embedding) continue;

        if (chunkQueue) {
          await chunkQueue.add('process', { chunkId: chunk.id }, { attempts: 3, backoff: { type: 'exponential', delay: 200 } });
        } else {
          try {
            const summary = await summarizeText(chunk.content, 160);
            const type = classifyChunk(chunk.content);
            let embedding = null;
            try { embedding = await generateEmbedding(chunk.content); } catch (err) { logger.warn('Embedding failed (sync fallback)', { error: err.message || err }); }
            await prisma.knowledgeChunk.update({ where: { id: chunk.id }, data: { embedding, metadata: { ...(chunk.metadata || {}), summary, type } } });
            await new Promise(r => setTimeout(r, 150));
          } catch (err) {
            logger.error('Sync post-chunk processing error:', err);
          }
        }
      }
    } catch (err) {
      logger.error('Post-chunk processing error:', err);
    }
  } catch (err) {
    logger.error('Chunk creation error:', err);
  }
}

// --- Controller Methods ---

exports.uploadKnowledge = async (req, res) => {
  logger.info('POST /upload called');
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      try { fs.unlinkSync(req.file.path); } catch (e) { logger.warn('File cleanup failed', { path: req.file.path, error: e.message }); }
      // Log auth header and user for debugging why businessId could not be resolved
      logger.warn('uploadKnowledge: businessId missing', { authHeader: req.headers && req.headers.authorization, user: req.user });
      return res.status(400).json({ error: 'Business ID missing or invalid. Please re-login or contact support.' });
    }

    let content = '';
    let type = 'TEXT';
    let pageCount = 1;
    
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdf(dataBuffer);
      content = (data.text || '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      pageCount = data.numpages || 1;
      type = 'PDF';
      
      if (!content || content.length < 10) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'PDF appears to be empty or unreadable' });
      }
    } else {
      content = fs.readFileSync(req.file.path, 'utf8');
    }

    const kb = await prisma.knowledgeBase.create({
      data: {
        businessId,
        type,
        content,
        metadata: {
          filename: req.file.originalname,
          size: req.file.size,
          pageCount: pageCount,
          uploadedAt: new Date().toISOString(),
          status: 'active'
        }
      }
    });

    try { await createChunksForKB(kb); } catch (e) { logger.error('createChunksForKB failed:', e); }
    await redisCache.invalidate(businessId);
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Knowledge base updated', id: kb.id });

  } catch (error) {
    logger.error('Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process file' });
  }
};

exports.addTextKnowledge = async (req, res) => {
  logger.info('POST /text called', { body: req.body, user: req.user });
  try {
    let { text, title } = req.body || {};

    // Defensive normalization: accept arrays or objects from client and coerce to string
    if (Array.isArray(text)) {
      logger.warn('addTextKnowledge: received text as array, joining to single string', { user: req.user && req.user.id, length: text.length });
      text = text.join('\n\n');
    } else if (text && typeof text === 'object') {
      logger.warn('addTextKnowledge: received text as object, coercing to string', { user: req.user && req.user.id });
      try { text = JSON.stringify(text); } catch (e) { text = String(text); }
    }

    logger.debug('addTextKnowledge payload summary', { textType: typeof text, textLength: text ? text.length : 0, titleType: typeof title });
    const businessId = await resolveBusinessId(req);
    logger.info('Resolved businessId:', { businessId });
    
    if (!businessId) {
      logger.warn('addTextKnowledge: businessId missing', { authHeader: req.headers && req.headers.authorization, user: req.user });
      return res.status(400).json({ error: 'Business ID missing or invalid. Please re-login.' });
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      logger.warn('addTextKnowledge: invalid text payload', { user: req.user && req.user.id, textSample: (text || '').substring(0, 100) });
      return res.status(400).json({ error: 'Text is required' });
    }

    let kb;
    try {
      kb = await prisma.knowledgeBase.create({
        data: {
          businessId,
          type: 'TEXT',
          content: text,
          metadata: {
            title: title || 'Untitled Text',
            source: 'manual',
            uploadedAt: new Date().toISOString(),
            status: 'active',
            wordCount: (text || '').split(/\s+/).filter(Boolean).length
          }
        }
      });
    } catch (e) {
      logger.error('Prisma create failed in addTextKnowledge', { error: e && e.message, stack: e && e.stack, user: req.user && req.user.id });
      return res.status(500).json({ error: 'Failed to create knowledge base entry' });
    }

    try {
      await createChunksForKB(kb);
    } catch (e) {
      logger.error('createChunksForKB failed after creating KB', { kbId: kb && kb.id, error: e && e.message, stack: e && e.stack });
    }
    await redisCache.invalidate(businessId);

    res.json({ message: 'Text added successfully', id: kb.id });
  } catch (error) {
    logger.error('Text Add Error:', error);
    res.status(500).json({ error: 'Failed to add text: ' + error.message });
  }
};

exports.addUrlKnowledge = async (req, res) => {
  logger.info('POST /url called');
  try {
    let { url, deepCrawl = false } = req.body;
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      logger.warn('addUrlKnowledge: businessId missing', { authHeader: req.headers && req.headers.authorization, user: req.user });
      return res.status(400).json({ error: 'Business ID missing or invalid. Please re-login.' });
    }

    if (!url) return res.status(400).json({ error: 'URL is required' });

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    if (deepCrawl) {
      const crawler = new WebCrawler({ maxPages: 10, maxDepth: 2, timeout: 15000 });
      const crawlResult = await crawler.start(url);
      
      if (crawlResult.pages.length === 0) {
        return res.status(400).json({ error: 'Could not crawl any pages from this URL' });
      }

      const savedPages = [];
      for (const page of crawlResult.pages) {
        const kb = await prisma.knowledgeBase.create({
          data: {
            businessId,
            type: 'URL',
            content: page.content,
            metadata: {
              url: page.url,
              title: page.title,
              description: page.description,
              wordCount: page.wordCount,
              depth: page.depth,
              uploadedAt: new Date().toISOString(),
              status: 'active',
              crawlType: 'deep'
            }
          }
        });
        await createChunksForKB(kb).catch(e => logger.error('Chunk creation failed:', e));
        savedPages.push(kb.id);
      }
      
      return res.json({
        message: 'Website crawled successfully',
        pagesCount: crawlResult.totalPages,
        totalWords: crawlResult.totalWords,
        ids: savedPages
      });
    }

    let response;
    try {
      response = await axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
        timeout: 15000
      });
    } catch (err) {
      logger.error('Axios GET failed for URL:', { url, message: err.message, status: err.response?.status, data: err.response?.data });
      const statusCode = err.response?.status || 502;
      return res.status(statusCode).json({ error: 'Failed to fetch URL', detail: err.message, status: err.response?.status });
    }

    const html = response.data;
    if (typeof html !== 'string') {
      logger.warn('Non-string response received from URL', { url, type: typeof html });
      return res.status(400).json({ error: 'Invalid content type received from URL' });
    }

    const $ = cheerio.load(html);
    $('script, style, nav, footer, iframe, noscript, svg').remove();

    const title = $('title').text().trim() || url;
    const description = $('meta[name="description"]').attr('content') || '';
    
    let content = '';
    const mainContent = $('main, article, [role="main"]').text();
    if (mainContent.trim().length > 200) {
      content = mainContent;
    } else {
      const containerContent = $('.content, #content, .main-content, #main-content, .post-content, .entry-content, .article-content').text();
      if (containerContent.trim().length > 200) {
        content = containerContent;
      } else {
        $('header, footer, aside, nav, .sidebar, .header, .footer, .navigation').remove();
        content = $('body').text();
      }
    }

    let textContent = content.replace(/\s+/g, ' ').trim();
    const boilerplatePatterns = [
      /cookie(s)?\s*(policy|notice|settings)?/gi,
      /privacy\s*policy/gi,
      /terms\s*(of\s*service|and\s*conditions)?/gi,
      /(sign\s*in|log\s*in|register|subscribe\s*now)/gi,
      /(©|copyright)\s*\d{4}/gi,
      /all\s*rights\s*reserved/gi
    ];
    boilerplatePatterns.forEach(pattern => { textContent = textContent.replace(pattern, ''); });
    textContent = textContent.replace(/\s+/g, ' ').trim();

    const domain = new URL(url).hostname.replace(/^www\./, '');
    const pageTypeGuess = (title + ' ' + description).toLowerCase();
    let pageType = 'OTHER';
    if (pageTypeGuess.match(/menu|dishes|menu items|breakfast|lunch|dinner/)) pageType = 'MENU';
    else if (pageTypeGuess.match(/contact|email|phone|address|location/)) pageType = 'CONTACT';
    else if (pageTypeGuess.match(/service|our services|what we do|solutions/)) pageType = 'SERVICE';
    else if (pageTypeGuess.match(/promo|promotion|discount|offer|sale/)) pageType = 'PROMOTION';

    const fullContent = `Title: ${title}\nDescription: ${description}\nURL: ${url}\nDomain: ${domain}\nPageType: ${pageType}\n\nContent:\n${textContent}`;

    if (textContent.length < 50) {
        return res.status(400).json({ 
          error: 'Could not extract enough text from this URL.',
          suggestion: 'Enable deep crawl option or manually copy-paste the content as text instead.'
        });
    }

    const kb = await prisma.knowledgeBase.create({
      data: {
        businessId,
        type: 'URL',
        content: fullContent,
        metadata: { url, title, domain, pageType, description: description.substring(0, 200) }
      }
    });

    try { await createChunksForKB(kb); } catch (e) { logger.error('createChunksForKB failed:', e); }
    await redisCache.invalidate(businessId);

    res.json({ message: 'URL scraped successfully', id: kb.id });
  } catch (error) {
    logger.error('URL Scrape Error:', error?.stack || error);
    res.status(500).json({ error: `Failed to scrape URL: ${error.message || 'unknown error'}` });
  }
};

exports.getKnowledge = async (req, res) => {
  try {
    const businessId = req.user && req.user.businessId;
    if (!businessId) {
      logger.warn('getKnowledge: missing businessId on request', { user: req.user });
      return res.status(400).json({ error: 'Business ID missing from token.' });
    }

    const rawKbList = await prisma.knowledgeBase.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    const kbList = Array.isArray(rawKbList) ? rawKbList : [];
    const parsedList = kbList.map(kb => {
      let metadata = kb.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          logger.warn('getKnowledge: failed to parse metadata JSON', { id: kb.id, error: e.message });
          metadata = {};
        }
      }
      return {
        ...kb,
        metadata
      };
    });

    res.json(parsedList);
  } catch (error) {
    logger.error("Fetch Knowledge Error:", error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
};

exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title } = req.body;
    const businessId = req.user.businessId;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    const existing = await prisma.knowledgeBase.findFirst({ where: { id, businessId } });
    if (!existing) return res.status(404).json({ error: 'Knowledge base entry not found' });
    if (existing.type !== 'TEXT') return res.status(400).json({ error: 'Only TEXT entries can be edited.' });

    const updated = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        content,
        metadata: {
          ...existing.metadata,
          title: title || existing.metadata?.title || 'Untitled Text',
          editedAt: new Date().toISOString(),
          wordCount: content.split(/\s+/).length
        }
      }
    });

    await prisma.knowledgeChunk.deleteMany({ where: { knowledgeBaseId: id } });
    await createChunksForKB(updated).catch(e => logger.error('Chunk creation failed:', e));
    await redisCache.invalidate(businessId);

    res.json({ message: 'Knowledge base updated successfully', id: updated.id });
  } catch (error) {
    logger.error("Update Knowledge Error:", error);
    res.status(500).json({ error: 'Failed to update knowledge base' });
  }
};

exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    
    await prisma.knowledgeBase.deleteMany({ where: { id: id, businessId } });
    await redisCache.invalidate(businessId);
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    logger.error("Delete Knowledge Error:", error);
    res.status(500).json({ error: 'Failed to delete' });
  }
};

exports.embedChunks = async (req, res) => {
  try {
    const tokenBusinessId = req.user.businessId;
    const { knowledgeBaseId, limit = 50 } = req.body;

    if (!tokenBusinessId) return res.status(400).json({ error: 'Business ID missing from token.' });

    const where = { businessId: tokenBusinessId, embedding: null };
    if (knowledgeBaseId) where.knowledgeBaseId = knowledgeBaseId;

    const chunks = await prisma.knowledgeChunk.findMany({ where, take: Number(limit) });
    if (!chunks || chunks.length === 0) return res.json({ message: 'No unembedded chunks found', processed: 0 });

    const hasRedis = !!process.env.REDIS_URL;
    let chunkQueue = null;
    if (hasRedis) {
      try { chunkQueue = require('../queue/queue').chunkQueue; } catch (e) { chunkQueue = null; }
    }

    if (chunkQueue) {
      let enqueued = 0;
      for (const c of chunks) {
        await chunkQueue.add('process', { chunkId: c.id }, { attempts: 3, backoff: { type: 'exponential', delay: 200 } });
        enqueued++;
      }
      return res.json({ message: 'Chunks enqueued for processing', enqueued });
    }

    let processed = 0;
    for (const c of chunks) {
      try {
        const emb = await generateEmbedding(c.content);
        if (emb && Array.isArray(emb)) {
          await prisma.knowledgeChunk.update({ where: { id: c.id }, data: { embedding: emb } });
          processed++;
        }
        await new Promise(r => setTimeout(r, 150));
      } catch (err) {
        logger.error(`Embedding failed for chunk ${c.id}:`, err.message || err);
      }
    }

    res.json({ message: 'Embedding process completed', processed });
  } catch (error) {
    logger.error('Chunks embed error:', error);
    res.status(500).json({ error: 'Failed to embed chunks', details: error.message });
  }
};
