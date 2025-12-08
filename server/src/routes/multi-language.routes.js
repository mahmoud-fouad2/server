const express = require('express');
const router = express.Router();
// const { authenticateToken } = require('../middleware/auth');
const MultiLanguageService = require('../services/multi-language.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/multi-language/dialects
 * @desc Get all supported dialects
 * @access Private (Business Owner/Admin)
 */
router.get('/dialects', async (req, res) => {
  try {
    const dialects = MultiLanguageService.getSupportedDialects();
    res.json({
      success: true,
      data: dialects
    });
  } catch (error) {
    logger.error('Multi-language dialects endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to get supported dialects',
      error: error.message
    });
  }
});

/**
 * @route POST /api/multi-language/detect
 * @desc Detect language and dialect from text
 * @access Private
 */
router.post('/detect', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string'
      });
    }

    const detection = MultiLanguageService.detectLanguage(text);
    res.json({
      success: true,
      data: detection
    });
  } catch (error) {
    logger.error('Multi-language detect endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to detect language',
      error: error.message
    });
  }
});

/**
 * @route POST /api/multi-language/translate
 * @desc Translate between dialects
 * @access Private
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, fromDialect, toDialect } = req.body;

    if (!text || !fromDialect || !toDialect) {
      return res.status(400).json({
        success: false,
        message: 'Text, fromDialect, and toDialect are required'
      });
    }

    const translated = await MultiLanguageService.translateBetweenDialects(text, fromDialect, toDialect);
    res.json({
      success: true,
      data: {
        original: text,
        translated,
        fromDialect,
        toDialect
      }
    });
  } catch (error) {
    logger.error('Multi-language translate endpoint error', { fromDialect, toDialect, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to translate text',
      error: error.message
    });
  }
});

/**
 * @route POST /api/multi-language/process
 * @desc Process message with language detection and normalization
 * @access Private
 */
// router.post('/process', async (req, res) => {
//   try {
//     const { message, language } = req.body;

//     if (!message) {
//       return res.status(400).json({
//         success: false,
//         message: 'Message is required'
//       });
//     }

//     const processed = MultiLanguageService.processMessage(message);
//     res.json({
//       success: true,
//       data: processed
//     });
//   } catch (error) {
//     console.error('[MultiLanguage Routes] Process message error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process message',
//       error: error.message
//     });
//   }
// });
router.post('/process', async (req, res) => {
  try {
    const { message, language } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const processed = MultiLanguageService.processMessage(message);
    res.json({
      success: true,
      data: processed
    });
  } catch (error) {
    logger.error('Multi-language process endpoint error', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to process message',
      error: error.message
    });
  }
});

/**
 * @route POST /api/multi-language/generate-response
 * @desc Generate response in appropriate dialect
 * @access Private
 */
// router.post('/generate-response', async (req, res) => {
//   try {
//     const { response, targetDialect } = req.body;

//     if (!response || !targetDialect) {
//       return res.status(400).json({
//         success: false,
//         message: 'Response and targetDialect are required'
//       });
//     }

//     const dialectResponse = MultiLanguageService.generateDialectResponse(response, targetDialect);
//     res.json({
//       success: true,
//       data: {
//         original: response,
//         dialectResponse,
//         targetDialect
//       }
//     });
//   } catch (error) {
//     console.error('[MultiLanguage Routes] Generate response error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to generate dialect response',
//       error: error.message
//     });
//   }
// });
router.post('/generate-response', async (req, res) => {
  try {
    const { response, targetDialect } = req.body;

    if (!response || !targetDialect) {
      return res.status(400).json({
        success: false,
        message: 'Response and targetDialect are required'
      });
    }

    const dialectResponse = MultiLanguageService.generateDialectResponse(response, targetDialect);
    res.json({
      success: true,
      data: {
        original: response,
        dialectResponse,
        targetDialect
      }
    });
  } catch (error) {
    logger.error('Multi-language generate endpoint error', { targetDialect, error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to generate dialect response',
      error: error.message
    });
  }
});

// router.get('/dialect/:code', async (req, res) => {
//   try {
//     const { code } = req.params;
//     const dialect = MultiLanguageService.getDialectInfo(code);

//     if (!dialect) {
//       return res.status(404).json({
//         success: false,
//         message: 'Dialect not found'
//       });
//     }

//     res.json({
//       success: true,
//       data: dialect
//     });
//   } catch (error) {
//     console.error('[MultiLanguage Routes] Get dialect error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to get dialect information',
//       error: error.message
//     });
//   }
// });
router.get('/dialect/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const dialect = MultiLanguageService.getDialectInfo(code);

    if (!dialect) {
      return res.status(404).json({
        success: false,
        message: 'Dialect not found'
      });
    }

    res.json({
      success: true,
      data: dialect
    });
  } catch (error) {
    console.error('[MultiLanguage Routes] Get dialect error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dialect information',
      error: error.message
    });
  }
});

module.exports = router;
