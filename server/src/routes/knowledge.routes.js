const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const prisma = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { generateEmbedding } = require('../services/embedding.service');
const { WebCrawler, scrapeSinglePage } = require('../services/crawler.service');
const redisCache = require('../services/redis-cache.service');

// Simple text chunking utility: split into overlapping word chunks
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

const { summarizeText } = require('../services/summarizer.service');

// Resolve and validate businessId from req.user or DB; returns businessId string or null
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
    console.warn('resolveBusinessId error:', err?.message || err);
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
    // Basic normalization: collapse whitespace
    const normalized = raw.replace(/\s+/g, ' ').trim();
    const pieces = chunkText(normalized, 300, 50);

    if (pieces.length === 0) return;

    const data = pieces.map((p, idx) => ({
      knowledgeBaseId: kb.id,
      businessId: kb.businessId,
      content: p,
      metadata: { source: kb.type || 'UNKNOWN', kbId: kb.id, index: idx }
    }));

    // Use createMany for performance
    await prisma.knowledgeChunk.createMany({ data });
    console.log(`Created ${data.length} chunks for KB ${kb.id}`);

      // AFTER creation: enqueue or process created chunks
      try {
        const pending = await prisma.knowledgeChunk.findMany({ where: { knowledgeBaseId: kb.id, businessId: kb.businessId }, orderBy: { createdAt: 'asc' } });

        // If Redis queue available, push jobs to background worker
        const hasRedis = !!process.env.REDIS_URL;
        let chunkQueue = null;
        if (hasRedis) {
          try { chunkQueue = require('../queue/queue').chunkQueue; } catch (e) { chunkQueue = null; }
        }

        for (const chunk of pending) {
          if (chunk.embedding) continue; // skip already processed

          if (chunkQueue) {
            // Enqueue job for background processing
            await chunkQueue.add('process', { chunkId: chunk.id }, { attempts: 3, backoff: { type: 'exponential', delay: 200 } });
          } else {
            // Fallback synchronous processing (best-effort) — summarise + embed
            try {
              const summary = await summarizeText(chunk.content, 160);
              const type = classifyChunk(chunk.content);
              let embedding = null;
              try { embedding = await generateEmbedding(chunk.content); } catch (err) { console.warn('Embedding failed (sync fallback)', err.message || err); }
              await prisma.knowledgeChunk.update({ where: { id: chunk.id }, data: { embedding, metadata: { ...(chunk.metadata || {}), summary, type } } });
              // polite throttle
              await new Promise(r => setTimeout(r, 150));
            } catch (err) {
              console.error('Sync post-chunk processing error:', err);
            }
          }
        }
      } catch (err) {
        console.error('Post-chunk processing error:', err);
      }
  } catch (err) {
    console.error('Chunk creation error:', err);
  }
}

// Configure Multer with security limits
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Strict file type validation
    const allowedMimes = ['application/pdf', 'text/plain'];
    const allowedExts = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and TXT files are allowed.'));
    }
  }
});

// Upload Knowledge Base (PDF)
router.post('/upload', authenticateToken, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  console.log("POST /upload called");
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Resolve and validate businessId
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      // Clean up file if auth fails
      try { fs.unlinkSync(req.file.path); } catch (e) {}
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

    // Save to DB
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

    // Create chunks for search and retrieval
    try { await createChunksForKB(kb); } catch (e) { console.error('createChunksForKB failed:', e); }

    // Invalidate Redis cache since knowledge base changed
    await redisCache.invalidate(businessId);

    // Cleanup
    fs.unlinkSync(req.file.path);

    res.json({ message: 'Knowledge base updated', id: kb.id });

  } catch (error) {
    console.error('Upload Error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process file' });
  }
});

// Add Text Knowledge
router.post('/text', authenticateToken, async (req, res) => {
  console.log("POST /text called");
  console.log("User:", req.user);
  console.log("Body:", req.body);

  try {
    const { text, title } = req.body;
    // Resolve and validate businessId
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      console.error("Missing or invalid businessId in token");
      // Provide helpful debug info in development to speed up fixing client tokens
      if (process.env.NODE_ENV !== 'production') {
        const authHeader = req.headers['authorization'] || null;
        const decoded = (() => { try { const jwt = require('jsonwebtoken'); return jwt.decode((authHeader||'').split(' ')[1]||null); } catch(e){ return null } })();
        return res.status(400).json({ error: 'Business ID missing or invalid. Please re-login.', debug: { authHeader: !!authHeader, decoded } });
      }
      return res.status(400).json({ error: 'Business ID missing or invalid. Please re-login.' });
    }

    if (!text) {
      console.error("Missing text in body");
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log("Creating KnowledgeBase entry...");
    const kb = await prisma.knowledgeBase.create({
      data: {
        businessId,
        type: 'TEXT',
        content: text,
        metadata: {
          title: title || 'Untitled Text',
          source: 'manual',
          uploadedAt: new Date().toISOString(),
          status: 'active',
          wordCount: text.split(/\s+/).length
        }
      }
    });
    // Create chunks for the saved text
    try { await createChunksForKB(kb); } catch (e) { console.error('createChunksForKB failed:', e); }
    console.log("Created KB:", kb.id);

    // Invalidate Redis cache since knowledge base changed
    await redisCache.invalidate(businessId);

    res.json({ message: 'Text added successfully', id: kb.id });
  } catch (error) {
    console.error('Text Add Error:', error);
    // Send the actual error message to the client for debugging
    res.status(500).json({ error: 'Failed to add text: ' + error.message, details: error.toString() });
  }
});

// Add URL Knowledge with Deep Crawling
router.post('/url', authenticateToken, async (req, res) => {
  console.log("POST /url called");
  try {
    let { url, deepCrawl = false } = req.body;
    // Resolve and validate businessId
    const businessId = await resolveBusinessId(req);
    if (!businessId) {
      return res.status(400).json({ error: 'Business ID missing or invalid. Please re-login.' });
    }

    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Ensure protocol
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    // Use advanced crawler if deepCrawl is enabled
    if (deepCrawl) {
      console.log("Starting deep crawl of:", url);
      const crawler = new WebCrawler({
        maxPages: 10,
        maxDepth: 2,
        timeout: 15000
      });

      const crawlResult = await crawler.start(url);
      
      if (crawlResult.pages.length === 0) {
        return res.status(400).json({ error: 'Could not crawl any pages from this URL' });
      }

      // Save each page as separate knowledge base entry
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

        await createChunksForKB(kb).catch(e => console.error('Chunk creation failed:', e));
        savedPages.push(kb.id);
      }

      console.log(`✅ Deep crawl complete: ${crawlResult.totalPages} pages, ${crawlResult.totalWords} words`);
      
      return res.json({
        message: 'Website crawled successfully',
        pagesCount: crawlResult.totalPages,
        totalWords: crawlResult.totalWords,
        ids: savedPages
      });
    }

    console.log("Fetching URL:", url);
    // Fetch URL content with headers to mimic a browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 15000 // 15 second timeout
    });
    
    const html = response.data;
    
    if (typeof html !== 'string') {
       return res.status(400).json({ error: 'Invalid content type received from URL' });
    }

    // Use Cheerio for intelligent parsing
    const $ = cheerio.load(html);

    // Remove scripts, styles, and other non-content elements
    $('script, style, nav, footer, iframe, noscript, svg').remove();

    // Extract meaningful content
    const title = $('title').text().trim() || url;
    const description = $('meta[name="description"]').attr('content') || '';
    
    // Get main content - prioritize main, article, or body
    let $content = $('main');
    if ($content.length === 0) $content = $('article');
    if ($content.length === 0) $content = $('body');

    // Clean up text
    let textContent = $content.text()
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .trim();

    // Remove common boilerplate lines, nav items and cookie/privacy notices
    const boilerplatePatterns = [/(cookie(s)?)/i, /privacy policy/i, /terms( of service)?/i, /(sign in|log in|register|subscribe)/i, /(©|copyright)/i];
    let lines = textContent.split(/[\.\?!]\s+/).map(s => s.trim()).filter(Boolean);
    lines = lines.filter(l => !boilerplatePatterns.some(p => p.test(l)));
    // Reassemble but keep longer sentences and drop tiny ones
    textContent = lines.filter(l => l.length > 20).join('. ');

    // Fallback: If main content is empty, try body
    if (textContent.length < 50) {
        textContent = $('body').text().replace(/\s+/g, ' ').trim();
    }

    // Combine title, description, and content for better context
    // Prepare metadata and full content
    const domain = new URL(url).hostname.replace(/^www\./, '');
    const pageTypeGuess = (title + ' ' + description).toLowerCase();
    let pageType = 'OTHER';
    if (pageTypeGuess.match(/menu|dishes|menu items|breakfast|lunch|dinner/)) pageType = 'MENU';
    else if (pageTypeGuess.match(/contact|email|phone|address|location/)) pageType = 'CONTACT';
    else if (pageTypeGuess.match(/service|our services|what we do|solutions/)) pageType = 'SERVICE';
    else if (pageTypeGuess.match(/promo|promotion|discount|offer|sale/)) pageType = 'PROMOTION';

    const fullContent = `Title: ${title}\nDescription: ${description}\nURL: ${url}\nDomain: ${domain}\nPageType: ${pageType}\n\nContent:\n${textContent}`;

    // Relaxed limit: 10 chars instead of 50 to allow small pages
    if (textContent.length < 10) {
        return res.status(400).json({ error: 'Could not extract enough text from this URL. It might be a Single Page App or protected.' });
    }

    console.log("Saving URL content...");
    const kb = await prisma.knowledgeBase.create({
      data: {
        businessId,
        type: 'URL',
        content: fullContent,
        metadata: JSON.stringify({
          url: url,
          title: title,
          domain,
          pageType,
          description: description.substring(0, 200)
        })
      }
    });

    // Create chunks for the scraped URL content
    try { await createChunksForKB(kb); } catch (e) { console.error('createChunksForKB failed:', e); }

    // Invalidate Redis cache since knowledge base changed
    await redisCache.invalidate(businessId);

    res.json({ message: 'URL scraped successfully', id: kb.id });
  } catch (error) {
    console.error('URL Scrape Error:', error.message);
    res.status(500).json({ error: `Failed to scrape URL: ${error.message}`, details: error.toString() });
  }
});

// Get All Knowledge
router.get('/', authenticateToken, async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const kbList = await prisma.knowledgeBase.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });
    // Parse metadata JSON strings
    const parsedList = kbList.map(kb => ({
      ...kb,
      metadata: typeof kb.metadata === 'string' ? JSON.parse(kb.metadata) : kb.metadata
    }));
    res.json(parsedList);
  } catch (error) {
    console.error("Fetch Knowledge Error:", error);
    res.status(500).json({ error: 'Failed to fetch knowledge base' });
  }
});

// Delete Knowledge
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user.businessId;
    
    // id comes as string from params, but Prisma might expect string (cuid) or int depending on schema.
    // Schema says id is String @id @default(cuid()). So we should NOT parse int.
    
    await prisma.knowledgeBase.deleteMany({
      where: { 
        id: id, // Removed parseInt
        businessId 
      }
    });
    
    // Invalidate Redis cache since knowledge base changed
    await redisCache.invalidate(businessId);
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error("Delete Knowledge Error:", error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// Embed unembedded chunks for a business or specific knowledgeBase
router.post('/chunks/embed', authenticateToken, async (req, res) => {
  try {
    const tokenBusinessId = req.user.businessId;
    const { knowledgeBaseId, limit = 50 } = req.body;

    if (!tokenBusinessId) return res.status(400).json({ error: 'Business ID missing from token.' });

    const where = { businessId: tokenBusinessId, embedding: null };
    if (knowledgeBaseId) where.knowledgeBaseId = knowledgeBaseId;

    const chunks = await prisma.knowledgeChunk.findMany({ where, take: Number(limit) });
    if (!chunks || chunks.length === 0) return res.json({ message: 'No unembedded chunks found', processed: 0 });

    // Prefer background enqueue if Redis is configured
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

    // Fallback synchronous embedding when no queue is available
    let processed = 0;
    for (const c of chunks) {
      try {
        const emb = await generateEmbedding(c.content);
        if (emb && Array.isArray(emb)) {
          await prisma.knowledgeChunk.update({ where: { id: c.id }, data: { embedding: emb } });
          processed++;
        } else {
          console.warn(`No embedding returned for chunk ${c.id}`);
        }
        await new Promise(r => setTimeout(r, 150));
      } catch (err) {
        console.error(`Embedding failed for chunk ${c.id}:`, err.message || err);
      }
    }

    res.json({ message: 'Embedding process completed', processed });
  } catch (error) {
    console.error('Chunks embed error:', error);
    res.status(500).json({ error: 'Failed to embed chunks', details: error.message });
  }
});

module.exports = router;
