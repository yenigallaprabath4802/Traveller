const express = require('express');
const router = express.Router();
const AIMoodStoryService = require('../services/aiMoodStoryService');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');

const aiMoodStoryService = new AIMoodStoryService();

// Configure multer for file uploads (images, audio)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed'), false);
    }
  }
});

// Analyze mood from travel experience
router.post('/analyze-mood', authMiddleware, async (req, res) => {
  try {
    const {
      text,
      description,
      location,
      activity,
      context,
      date
    } = req.body;

    if (!text && !description) {
      return res.status(400).json({
        success: false,
        message: 'Experience text or description is required'
      });
    }

    const experienceData = {
      text: text || description,
      location,
      activity,
      context,
      date,
      userId: req.user.id
    };

    const moodAnalysis = await aiMoodStoryService.analyzeMood(experienceData);

    res.json({
      success: true,
      data: moodAnalysis,
      message: 'Mood analysis completed successfully'
    });

  } catch (error) {
    console.error('Error analyzing mood:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze mood',
      error: error.message
    });
  }
});

// Generate personalized story
router.post('/generate-story', authMiddleware, async (req, res) => {
  try {
    const {
      location,
      activity,
      notes,
      description,
      date,
      companions,
      storyType,
      moodAnalysis
    } = req.body;

    if (!location && !description && !notes) {
      return res.status(400).json({
        success: false,
        message: 'Location, description, or notes are required to generate a story'
      });
    }

    const storyData = {
      location,
      activity,
      notes: notes || description,
      description: description || notes,
      date,
      companions,
      storyType,
      moodAnalysis,
      userId: req.user.id
    };

    const generatedStory = await aiMoodStoryService.generatePersonalizedStory(storyData);

    res.json({
      success: true,
      data: generatedStory,
      message: 'Personalized story generated successfully'
    });

  } catch (error) {
    console.error('Error generating story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate story',
      error: error.message
    });
  }
});

// Enhance memory with AI analysis
router.post('/enhance-memory', authMiddleware, async (req, res) => {
  try {
    const {
      description,
      location,
      date,
      context
    } = req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Memory description is required'
      });
    }

    const memoryData = {
      description,
      location,
      date,
      context
    };

    const enhancement = await aiMoodStoryService.enhanceMemory(memoryData);

    res.json({
      success: true,
      data: enhancement,
      message: 'Memory enhanced successfully'
    });

  } catch (error) {
    console.error('Error enhancing memory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enhance memory',
      error: error.message
    });
  }
});

// Get mood categories and information
router.get('/mood-categories', authMiddleware, async (req, res) => {
  try {
    const categories = aiMoodStoryService.moodCategories;

    res.json({
      success: true,
      data: categories,
      message: 'Mood categories retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting mood categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get mood categories',
      error: error.message
    });
  }
});

// Get story templates
router.get('/story-templates', authMiddleware, async (req, res) => {
  try {
    const templates = aiMoodStoryService.storyTemplates;

    res.json({
      success: true,
      data: templates,
      message: 'Story templates retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting story templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get story templates',
      error: error.message
    });
  }
});

// Generate mood-based music playlist
router.post('/generate-playlist', authMiddleware, async (req, res) => {
  try {
    const { mood, duration } = req.body;

    if (!mood) {
      return res.status(400).json({
        success: false,
        message: 'Mood is required to generate playlist'
      });
    }

    const playlist = aiMoodStoryService.generateMoodPlaylist(mood, duration);

    res.json({
      success: true,
      data: {
        mood,
        duration: duration || 60,
        playlist
      },
      message: 'Mood-based playlist generated successfully'
    });

  } catch (error) {
    console.error('Error generating playlist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate playlist',
      error: error.message
    });
  }
});

// Analyze multiple experiences for narrative themes
router.post('/analyze-themes', authMiddleware, async (req, res) => {
  try {
    const { experiences } = req.body;

    if (!experiences || !Array.isArray(experiences)) {
      return res.status(400).json({
        success: false,
        message: 'Array of experiences is required'
      });
    }

    const themes = aiMoodStoryService.generateNarrativeThemes(experiences);

    res.json({
      success: true,
      data: {
        themes,
        totalExperiences: experiences.length
      },
      message: 'Narrative themes analyzed successfully'
    });

  } catch (error) {
    console.error('Error analyzing themes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze themes',
      error: error.message
    });
  }
});

// Process multimedia content for story enhancement
router.post('/process-multimedia', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { storyContext, enhancementType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'File is required for multimedia processing'
      });
    }

    // Basic multimedia processing (could be enhanced with actual file analysis)
    const multimediaData = {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      context: storyContext,
      enhancementType: enhancementType || 'general'
    };

    res.json({
      success: true,
      data: {
        processed: true,
        multimediaData,
        suggestions: [
          'Consider adding timestamps to your story',
          'Include sensory details that complement the visual/audio',
          'Use this media as a memory anchor for emotional moments'
        ]
      },
      message: 'Multimedia content processed successfully'
    });

  } catch (error) {
    console.error('Error processing multimedia:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process multimedia content',
      error: error.message
    });
  }
});

// Get personalized insights for storytelling
router.post('/storytelling-insights', authMiddleware, async (req, res) => {
  try {
    const { travelHistory, preferences, currentMood } = req.body;
    const userId = req.user.id;

    // Generate insights based on user's travel patterns and preferences
    const insights = {
      writingStyle: preferences?.writingStyle || 'descriptive',
      favoriteThemes: preferences?.themes || ['adventure', 'discovery'],
      recommendedLength: preferences?.storyLength || 'medium',
      personalizedTips: [
        'Your travel stories often feature moments of discovery',
        'Consider including more dialogue in your narratives',
        'Your emotional journey is a strong theme in your stories',
        'Try experimenting with different story structures'
      ],
      moodPatterns: {
        dominant: currentMood || 'adventurous',
        secondary: ['curious', 'grateful'],
        suggestions: [
          'Your adventurous spirit shines through in your stories',
          'Balance action with moments of reflection',
          'Include specific details that capture the essence of each place'
        ]
      }
    };

    res.json({
      success: true,
      data: insights,
      message: 'Storytelling insights generated successfully'
    });

  } catch (error) {
    console.error('Error generating storytelling insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate storytelling insights',
      error: error.message
    });
  }
});

// Save story and mood data (mock implementation)
router.post('/save-story', authMiddleware, async (req, res) => {
  try {
    const {
      story,
      moodAnalysis,
      metadata,
      title,
      isPublic
    } = req.body;

    if (!story) {
      return res.status(400).json({
        success: false,
        message: 'Story content is required'
      });
    }

    // In a real implementation, this would save to database
    const savedStory = {
      id: Date.now().toString(),
      userId: req.user.id,
      title: title || `Travel Story - ${new Date().toLocaleDateString()}`,
      story,
      moodAnalysis,
      metadata,
      isPublic: isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: savedStory,
      message: 'Story saved successfully'
    });

  } catch (error) {
    console.error('Error saving story:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save story',
      error: error.message
    });
  }
});

// Get user's saved stories (mock implementation)
router.get('/stories', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, mood, dateRange } = req.query;
    const userId = req.user.id;

    // Mock data - in real implementation, would fetch from database
    const stories = [
      {
        id: '1',
        title: 'Mountain Adventure in Switzerland',
        preview: 'The crisp alpine air filled my lungs as I stepped out of the cable car...',
        mood: 'adventurous',
        location: 'Swiss Alps',
        date: '2024-10-15',
        readingTime: 5
      },
      {
        id: '2',
        title: 'Peaceful Moments in Kyoto',
        preview: 'The ancient temple gardens whispered stories of centuries past...',
        mood: 'peaceful',
        location: 'Kyoto, Japan',
        date: '2024-09-28',
        readingTime: 3
      }
    ];

    res.json({
      success: true,
      data: {
        stories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: stories.length,
          pages: Math.ceil(stories.length / parseInt(limit))
        }
      },
      message: 'Stories retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting stories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stories',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Mood & Story service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;