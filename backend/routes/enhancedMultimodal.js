const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { 
  EnhancedVoiceService, 
  ImageDestinationDiscovery, 
  EnhancedMultimodalTripPlanner 
} = require('../services/enhancedMultimodalService');

// Initialize services
const voiceService = new EnhancedVoiceService();
const imageService = new ImageDestinationDiscovery();
const tripPlanner = new EnhancedMultimodalTripPlanner();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow audio and image files
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio and image files are allowed'), false);
    }
  }
});

// Voice-based trip planning
router.post('/voice-trip-planning', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const userPreferences = req.body.preferences ? JSON.parse(req.body.preferences) : {};
    const language = req.body.language || 'en';

    // Process audio for trip planning
    const result = await tripPlanner.planTripByVoice(req.file.buffer, {
      ...userPreferences,
      language
    });

    res.json({
      success: true,
      result,
      processing: {
        fileSize: req.file.size,
        duration: result.transcription?.duration,
        processingTime: result.processingTime
      }
    });

  } catch (error) {
    console.error('Error in voice trip planning:', error);
    res.status(500).json({
      error: 'Voice trip planning failed',
      details: error.message
    });
  }
});

// Image-based destination discovery
router.post('/image-destination-discovery', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    const preferences = req.body.preferences ? JSON.parse(req.body.preferences) : {};

    // Discover destinations from image
    const result = await tripPlanner.planTripByImage(req.file.buffer, preferences);

    res.json({
      success: true,
      result,
      processing: {
        fileSize: req.file.size,
        imageFormat: req.file.mimetype,
        processingTime: result.processingTime
      }
    });

  } catch (error) {
    console.error('Error in image destination discovery:', error);
    res.status(500).json({
      error: 'Image destination discovery failed',
      details: error.message
    });
  }
});

// Combined voice + image trip planning
router.post('/multimodal-trip-planning', upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const inputs = {};
    
    if (req.files?.audio?.[0]) {
      inputs.audioBuffer = req.files.audio[0].buffer;
    }
    
    if (req.files?.image?.[0]) {
      inputs.imageBuffer = req.files.image[0].buffer;
    }

    if (!inputs.audioBuffer && !inputs.imageBuffer) {
      return res.status(400).json({
        error: 'No audio or image files provided'
      });
    }

    inputs.userPreferences = req.body.preferences ? JSON.parse(req.body.preferences) : {};
    inputs.preferences = inputs.userPreferences;

    // Process multimodal input
    const result = await tripPlanner.planTripMultimodal(inputs);

    res.json({
      success: true,
      result,
      inputs: {
        hasAudio: !!inputs.audioBuffer,
        hasImage: !!inputs.imageBuffer,
        audioSize: req.files?.audio?.[0]?.size,
        imageSize: req.files?.image?.[0]?.size
      }
    });

  } catch (error) {
    console.error('Error in multimodal trip planning:', error);
    res.status(500).json({
      error: 'Multimodal trip planning failed',
      details: error.message
    });
  }
});

// Advanced voice transcription
router.post('/transcribe-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const language = req.body.language || 'en';
    
    // Transcribe audio with travel context
    const transcription = await voiceService.transcribeAudioForTravel(
      req.file.buffer, 
      language
    );

    res.json({
      success: true,
      transcription,
      processing: {
        fileSize: req.file.size,
        duration: transcription.duration,
        confidence: transcription.confidence,
        language: transcription.language
      }
    });

  } catch (error) {
    console.error('Error transcribing audio:', error);
    res.status(500).json({
      error: 'Audio transcription failed',
      details: error.message
    });
  }
});

// Text-to-speech for travel responses
router.post('/generate-speech', async (req, res) => {
  try {
    const { text, voice, speed } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'No text provided for speech generation'
      });
    }

    // Generate travel-focused speech
    const speechResult = await voiceService.generateTravelSpeech(text, {
      voice: voice || 'alloy',
      speed: speed || 1.0
    });

    res.json({
      success: true,
      speech: speechResult
    });

  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({
      error: 'Speech generation failed',
      details: error.message
    });
  }
});

// Voice-controlled trip queries
router.post('/voice-trip-query', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No audio file provided'
      });
    }

    const userContext = req.body.context ? JSON.parse(req.body.context) : {};

    // Transcribe audio
    const transcription = await voiceService.transcribeAudioForTravel(req.file.buffer);
    
    // Process as trip planning command
    const tripQuery = await voiceService.processVoiceTripPlanning(transcription, userContext);
    
    // Generate voice response
    const voiceResponse = await voiceService.generateTravelSpeech(
      tripQuery.voiceSummary,
      { voice: userContext.preferredVoice }
    );

    res.json({
      success: true,
      transcription,
      tripQuery,
      voiceResponse,
      processing: {
        confidence: transcription.confidence,
        intent: tripQuery.interpretedRequest
      }
    });

  } catch (error) {
    console.error('Error processing voice trip query:', error);
    res.status(500).json({
      error: 'Voice trip query failed',
      details: error.message
    });
  }
});

// Advanced image analysis for destinations
router.post('/analyze-destination-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    // Analyze image for destination discovery
    const analysis = await imageService.analyzeDestinationImage(req.file.buffer);
    const locationFeatures = await imageService.extractLocationFeatures(analysis);
    const matchingDestinations = await imageService.findMatchingDestinations(locationFeatures);

    res.json({
      success: true,
      analysis,
      locationFeatures,
      matchingDestinations,
      processing: {
        fileSize: req.file.size,
        confidence: analysis.confidence,
        destinationsFound: matchingDestinations.length
      }
    });

  } catch (error) {
    console.error('Error analyzing destination image:', error);
    res.status(500).json({
      error: 'Image analysis failed',
      details: error.message
    });
  }
});

// Get voice commands help
router.get('/voice-commands-help', async (req, res) => {
  try {
    const voiceCommands = {
      tripPlanning: [
        "Plan a trip to Japan for two weeks",
        "I want to visit beaches in Thailand",
        "Find me a romantic getaway for under $2000",
        "Plan a family vacation with kids",
        "I need a business trip to New York"
      ],
      destinationSearch: [
        "Where should I go for adventure travel?",
        "Recommend mountain destinations",
        "Find me warm places to visit in winter",
        "What are good solo travel destinations?",
        "Suggest budget-friendly European cities"
      ],
      bookingQueries: [
        "Find flights to Paris",
        "Book a hotel in Rome",
        "What's the weather like in Bali?",
        "How much does a trip to Iceland cost?",
        "Find activities in Barcelona"
      ],
      generalAdvice: [
        "Give me travel tips for solo travelers",
        "What should I pack for a beach vacation?",
        "How do I plan a multi-city trip?",
        "What's the best time to visit Europe?",
        "Help me with travel insurance"
      ]
    };

    res.json({
      success: true,
      voiceCommands,
      tips: [
        "Speak clearly and mention specific destinations when possible",
        "Include budget information for better recommendations",
        "Mention travel dates or time preferences",
        "Specify group size (solo, couple, family, etc.)",
        "Ask follow-up questions for more detailed planning"
      ],
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
      availableVoices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
    });

  } catch (error) {
    console.error('Error getting voice commands help:', error);
    res.status(500).json({
      error: 'Failed to get help information'
    });
  }
});

// Serve audio files
router.get('/audio/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const audioPath = path.join(__dirname, '../uploads/audio', filename);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(audioPath);
  } catch (error) {
    console.error('Error serving audio file:', error);
    res.status(404).json({ error: 'Audio file not found' });
  }
});

// Get multimodal capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const capabilities = {
      voice: {
        transcription: {
          supported: true,
          model: 'whisper-1',
          languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'],
          maxFileSize: '25MB',
          supportedFormats: ['mp3', 'mp4', 'wav', 'webm']
        },
        textToSpeech: {
          supported: true,
          model: 'tts-1-hd',
          voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
          maxTextLength: 4096,
          outputFormat: 'mp3'
        },
        tripPlanning: {
          supported: true,
          features: ['intent detection', 'entity extraction', 'trip suggestions', 'voice responses']
        }
      },
      image: {
        analysis: {
          supported: true,
          model: 'gpt-4-vision-preview',
          maxFileSize: '20MB',
          supportedFormats: ['jpg', 'jpeg', 'png', 'webp']
        },
        destinationDiscovery: {
          supported: true,
          features: ['landmark detection', 'location identification', 'similar destinations', 'trip suggestions']
        }
      },
      multimodal: {
        voiceImageCombination: {
          supported: true,
          features: ['plan synthesis', 'preference reconciliation', 'unified recommendations']
        }
      }
    };

    res.json({
      success: true,
      capabilities,
      version: '2.0',
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting capabilities:', error);
    res.status(500).json({
      error: 'Failed to get capabilities information'
    });
  }
});

// Health check for enhanced services
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      services: {
        voiceService: 'operational',
        imageService: 'operational',
        tripPlanner: 'operational',
        openaiAPI: process.env.OPENAI_API_KEY ? 'configured' : 'missing'
      },
      timestamp: new Date().toISOString()
    };

    const statusCode = health.services.openaiAPI === 'missing' ? 503 : 200;
    res.status(statusCode).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;