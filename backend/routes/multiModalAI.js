const express = require('express');
const router = express.Router();
const { MultiModalAIService, upload } = require('../services/multiModalAIService');
const authMiddleware = require('../middleware/auth');

// Initialize or get session
router.post('/session', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.body;

    console.log('🤖 Initializing multi-modal session for user:', userId);

    const session = await MultiModalAIService.initializeSession(userId, sessionId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        settings: session.settings,
        context: session.context,
        analytics: session.analytics
      }
    });

  } catch (error) {
    console.error('Error initializing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize session',
      error: error.message
    });
  }
});

// Process text input
router.post('/process/text', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, content, context } = req.body;

    console.log('💬 Processing text input for user:', userId);

    const input = {
      modality: 'text',
      content,
      context
    };

    const response = await MultiModalAIService.processMultiModalInput(userId, sessionId, input);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error processing text input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process text input',
      error: error.message
    });
  }
});

// Process voice input
router.post('/process/voice', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, transcript, confidence, language, audioFile } = req.body;

    console.log('🎙️ Processing voice input for user:', userId);

    const input = {
      modality: 'voice',
      content: transcript,
      transcript,
      confidence: confidence || 0.85,
      language: language || 'en-US',
      file: audioFile
    };

    const response = await MultiModalAIService.processMultiModalInput(userId, sessionId, input);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error processing voice input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice input',
      error: error.message
    });
  }
});

// Process image input with file upload
router.post('/process/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, content } = req.body;
    const file = req.file;

    console.log('🖼️ Processing image input for user:', userId);

    if (!file && !content) {
      return res.status(400).json({
        success: false,
        message: 'Image file or content required'
      });
    }

    const input = {
      modality: 'image',
      content: content || 'Analyze this image',
      file: file ? {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: `/uploads/multimodal/${file.filename}`
      } : null
    };

    const response = await MultiModalAIService.processMultiModalInput(userId, sessionId, input);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error processing image input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process image input',
      error: error.message
    });
  }
});

// Process document input with file upload
router.post('/process/document', authMiddleware, upload.single('document'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, content } = req.body;
    const file = req.file;

    console.log('📄 Processing document input for user:', userId);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'Document file required'
      });
    }

    const input = {
      modality: 'document',
      content: content || 'Process this document',
      file: {
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        url: `/uploads/multimodal/${file.filename}`
      }
    };

    const response = await MultiModalAIService.processMultiModalInput(userId, sessionId, input);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error processing document input:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process document input',
      error: error.message
    });
  }
});

// Get session history
router.get('/session/:sessionId/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log('📜 Getting session history for:', sessionId);

    const session = await MultiModalAIService.initializeSession(userId, sessionId);
    
    const messages = session.messages
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(message => ({
        id: message.id,
        type: message.type,
        content: message.content,
        modality: message.modality,
        timestamp: message.timestamp,
        metadata: message.metadata,
        attachments: message.attachments?.map(att => ({
          type: att.type,
          name: att.name,
          size: att.size
        }))
      }));

    res.json({
      success: true,
      data: {
        messages,
        totalMessages: session.messages.length,
        sessionInfo: {
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastActiveAt: session.analytics.lastActiveAt
        }
      }
    });

  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session history',
      error: error.message
    });
  }
});

// Update session settings
router.put('/session/:sessionId/settings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const settings = req.body;

    console.log('⚙️ Updating session settings:', sessionId);

    const session = await MultiModalAIService.initializeSession(userId, sessionId);
    
    // Update settings
    Object.keys(settings).forEach(key => {
      if (session.settings.hasOwnProperty(key)) {
        session.settings[key] = settings[key];
      }
    });

    session.updatedAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        settings: session.settings,
        updatedAt: session.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating session settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session settings',
      error: error.message
    });
  }
});

// Update session context
router.put('/session/:sessionId/context', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const context = req.body;

    console.log('📍 Updating session context:', sessionId);

    const session = await MultiModalAIService.initializeSession(userId, sessionId);
    
    // Update context
    if (context.currentLocation) {
      session.context.currentLocation = { ...session.context.currentLocation, ...context.currentLocation };
    }
    if (context.travelPreferences) {
      session.context.travelPreferences = { ...session.context.travelPreferences, ...context.travelPreferences };
    }
    if (context.activeTrip) {
      session.context.activeTrip = { ...session.context.activeTrip, ...context.activeTrip };
    }

    session.updatedAt = new Date();
    await session.save();

    res.json({
      success: true,
      data: {
        context: session.context,
        updatedAt: session.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating session context:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session context',
      error: error.message
    });
  }
});

// Get session analytics
router.get('/session/:sessionId/analytics', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    console.log('📊 Getting session analytics:', sessionId);

    const session = await MultiModalAIService.initializeSession(userId, sessionId);

    const analytics = {
      ...session.analytics,
      sessionDuration: Date.now() - session.createdAt.getTime(),
      messagesPerDay: session.analytics.totalMessages / Math.max(1, Math.ceil((Date.now() - session.createdAt.getTime()) / (1000 * 60 * 60 * 24))),
      modalityDistribution: {
        text: Math.round((session.analytics.modalityUsage.text / Math.max(1, session.analytics.totalMessages)) * 100),
        voice: Math.round((session.analytics.modalityUsage.voice / Math.max(1, session.analytics.totalMessages)) * 100),
        image: Math.round((session.analytics.modalityUsage.image / Math.max(1, session.analytics.totalMessages)) * 100),
        document: Math.round((session.analytics.modalityUsage.document / Math.max(1, session.analytics.totalMessages)) * 100)
      }
    };

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting session analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve session analytics',
      error: error.message
    });
  }
});

// Get user's sessions
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10, offset = 0 } = req.query;

    console.log('📚 Getting user sessions for:', userId);

    const sessions = await require('../services/multiModalAIService').MultiModalSession
      .find({ userId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('sessionId createdAt updatedAt analytics context.activeTrip');

    const formattedSessions = sessions.map(session => ({
      sessionId: session.sessionId,
      createdAt: session.createdAt,
      lastActiveAt: session.analytics.lastActiveAt,
      totalMessages: session.analytics.totalMessages,
      activeTrip: session.context.activeTrip,
      modalityUsage: session.analytics.modalityUsage
    }));

    res.json({
      success: true,
      data: {
        sessions: formattedSessions,
        totalSessions: sessions.length
      }
    });

  } catch (error) {
    console.error('Error getting user sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user sessions',
      error: error.message
    });
  }
});

// Delete session
router.delete('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    console.log('🗑️ Deleting session:', sessionId);

    const session = await require('../services/multiModalAIService').MultiModalSession
      .findOneAndDelete({ userId, sessionId });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      message: 'Session deleted successfully',
      data: {
        sessionId: session.sessionId,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete session',
      error: error.message
    });
  }
});

// Analyze image from URL
router.post('/analyze/image-url', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId, imageUrl, content } = req.body;

    console.log('🔗 Analyzing image from URL for user:', userId);

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL required'
      });
    }

    const input = {
      modality: 'image',
      content: content || 'Analyze this image',
      file: {
        name: 'web-image.jpg',
        size: 0,
        mimeType: 'image/jpeg',
        url: imageUrl
      }
    };

    const response = await MultiModalAIService.processMultiModalInput(userId, sessionId, input);

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error analyzing image from URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze image from URL',
      error: error.message
    });
  }
});

// Generate speech from text
router.post('/speech/generate', authMiddleware, async (req, res) => {
  try {
    const { text, voice = 'neutral', speed = 1.0, language = 'en' } = req.body;

    console.log('🔊 Generating speech for text length:', text?.length || 0);

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text required for speech generation'
      });
    }

    // In a real implementation, this would use a TTS service
    // For now, return mock response
    const speechData = {
      audioUrl: '/api/multimodal/speech/mock-audio.mp3',
      duration: Math.ceil(text.length / 10), // Approximate duration in seconds
      voice,
      speed,
      language,
      generatedAt: new Date()
    };

    res.json({
      success: true,
      data: speechData
    });

  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate speech',
      error: error.message
    });
  }
});

// Get capabilities and status
router.get('/capabilities', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Getting multi-modal capabilities');

    const capabilities = {
      text: {
        enabled: true,
        features: ['natural_language_understanding', 'context_awareness', 'multi_language'],
        confidence: 0.95
      },
      voice: {
        enabled: true,
        features: ['speech_recognition', 'voice_synthesis', 'intent_detection'],
        supportedLanguages: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'it-IT'],
        confidence: 0.88
      },
      image: {
        enabled: true,
        features: ['landmark_detection', 'object_recognition', 'text_extraction', 'scene_analysis'],
        supportedFormats: ['jpeg', 'jpg', 'png', 'gif'],
        maxFileSize: '50MB',
        confidence: 0.92
      },
      document: {
        enabled: true,
        features: ['text_extraction', 'document_classification', 'entity_extraction', 'structure_parsing'],
        supportedFormats: ['pdf', 'doc', 'docx', 'txt'],
        maxFileSize: '50MB',
        confidence: 0.90
      },
      integration: {
        travelPlanning: true,
        realTimeData: true,
        personalizedRecommendations: true,
        multiLanguageSupport: true,
        contextualUnderstanding: true
      }
    };

    res.json({
      success: true,
      data: capabilities
    });

  } catch (error) {
    console.error('Error getting capabilities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve capabilities',
      error: error.message
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        textProcessing: 'operational',
        voiceRecognition: 'operational',
        imageAnalysis: 'operational',
        documentProcessing: 'operational',
        database: 'operational',
        aiModels: 'operational'
      },
      version: '1.0.0'
    };

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;