const express = require('express');
const router = express.Router();
const SmartPackingService = require('../services/smartPackingService');
const authMiddleware = require('../middleware/auth');

const smartPackingService = new SmartPackingService();

// Generate comprehensive packing list
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const {
      destination,
      dates,
      activities,
      accommodation,
      transport,
      budget,
      travelerType,
      userPreferences
    } = req.body;

    if (!destination || !dates) {
      return res.status(400).json({
        success: false,
        message: 'Destination and dates are required'
      });
    }

    const tripData = {
      destination,
      dates,
      activities: activities || [],
      accommodation: accommodation || 'hotel',
      transport: transport || 'flight',
      budget: budget || 'medium',
      travelerType: travelerType || 'leisure',
      userPreferences: userPreferences || {}
    };

    const packingList = await smartPackingService.generatePackingList(tripData);

    res.json({
      success: true,
      data: packingList,
      message: 'Packing list generated successfully'
    });

  } catch (error) {
    console.error('Error generating packing list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate packing list',
      error: error.message
    });
  }
});

// Get personalized packing insights
router.post('/insights', authMiddleware, async (req, res) => {
  try {
    const { destination, duration, activities, climate } = req.body;
    const userId = req.user.id;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }

    const tripData = {
      destination,
      duration: duration || 7,
      activities: activities || [],
      climate: climate || 'temperate'
    };

    const insights = await smartPackingService.getPersonalizedInsights(userId, tripData);

    res.json({
      success: true,
      data: insights,
      message: 'Personalized insights generated successfully'
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate insights',
      error: error.message
    });
  }
});

// Validate packing list completeness
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    const { packingList, tripAnalysis } = req.body;

    if (!packingList || !tripAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Packing list and trip analysis are required'
      });
    }

    const validation = smartPackingService.validatePackingList(packingList, tripAnalysis);

    res.json({
      success: true,
      data: validation,
      message: 'Packing list validated successfully'
    });

  } catch (error) {
    console.error('Error validating packing list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate packing list',
      error: error.message
    });
  }
});

// Get weather-based packing recommendations
router.get('/weather-recommendations/:destination', authMiddleware, async (req, res) => {
  try {
    const { destination } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const dates = { start: startDate, end: endDate };
    const weatherData = await smartPackingService.getWeatherPredictions(destination, dates);

    res.json({
      success: true,
      data: {
        weather: weatherData,
        recommendations: weatherData.recommendations || []
      },
      message: 'Weather recommendations retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting weather recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather recommendations',
      error: error.message
    });
  }
});

// Get activity-specific packing requirements
router.get('/activity-requirements/:activity', authMiddleware, async (req, res) => {
  try {
    const { activity } = req.params;
    
    const requirements = smartPackingService.activityRequirements[activity.toLowerCase()];
    
    if (!requirements) {
      return res.status(404).json({
        success: false,
        message: 'Activity requirements not found'
      });
    }

    res.json({
      success: true,
      data: {
        activity,
        requirements
      },
      message: 'Activity requirements retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting activity requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activity requirements',
      error: error.message
    });
  }
});

// Get climate-specific recommendations
router.get('/climate-recommendations/:climate', authMiddleware, async (req, res) => {
  try {
    const { climate } = req.params;
    
    const recommendations = smartPackingService.climateRequirements[climate.toLowerCase()];
    
    if (!recommendations) {
      return res.status(404).json({
        success: false,
        message: 'Climate recommendations not found'
      });
    }

    res.json({
      success: true,
      data: {
        climate,
        recommendations
      },
      message: 'Climate recommendations retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting climate recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get climate recommendations',
      error: error.message
    });
  }
});

// Generate packing timeline
router.post('/timeline', authMiddleware, async (req, res) => {
  try {
    const { dates } = req.body;

    if (!dates || !dates.start) {
      return res.status(400).json({
        success: false,
        message: 'Travel dates are required'
      });
    }

    const timeline = smartPackingService.generatePackingTimeline(dates);

    res.json({
      success: true,
      data: timeline,
      message: 'Packing timeline generated successfully'
    });

  } catch (error) {
    console.error('Error generating timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate timeline',
      error: error.message
    });
  }
});

// Get smart packing tips
router.post('/tips', authMiddleware, async (req, res) => {
  try {
    const { tripAnalysis } = req.body;

    if (!tripAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Trip analysis is required'
      });
    }

    const tips = await smartPackingService.generateSmartPackingTips(tripAnalysis);

    res.json({
      success: true,
      data: tips,
      message: 'Smart packing tips generated successfully'
    });

  } catch (error) {
    console.error('Error generating tips:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tips',
      error: error.message
    });
  }
});

// Optimize existing packing list
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const { packingList, tripAnalysis, weatherData } = req.body;

    if (!packingList || !tripAnalysis) {
      return res.status(400).json({
        success: false,
        message: 'Packing list and trip analysis are required'
      });
    }

    const optimizedList = await smartPackingService.optimizePackingWithAI(
      packingList,
      tripAnalysis,
      weatherData || {}
    );

    res.json({
      success: true,
      data: optimizedList,
      message: 'Packing list optimized successfully'
    });

  } catch (error) {
    console.error('Error optimizing packing list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize packing list',
      error: error.message
    });
  }
});

// Get packing categories and templates
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = smartPackingService.packingCategories;

    res.json({
      success: true,
      data: categories,
      message: 'Packing categories retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories',
      error: error.message
    });
  }
});

// Save user packing preferences
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    // In a real implementation, this would save to database
    // For now, we'll just acknowledge the save
    
    res.json({
      success: true,
      data: { userId, preferences },
      message: 'Packing preferences saved successfully'
    });

  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save preferences',
      error: error.message
    });
  }
});

// Get user packing history and analytics
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // In a real implementation, this would fetch from database
    // For now, return mock data
    const history = {
      totalTrips: 12,
      packingSuccessRate: 85,
      mostForgottenItems: ['phone_charger', 'sunscreen', 'umbrella'],
      favoriteItems: ['packing_cubes', 'portable_battery', 'comfortable_shoes'],
      packingImprovement: 15, // percentage improvement over time
      recentTrips: [
        {
          destination: 'Paris',
          date: '2024-09-15',
          packingScore: 90,
          itemsUsed: 45,
          itemsPacked: 50
        },
        {
          destination: 'Tokyo',
          date: '2024-08-01',
          packingScore: 85,
          itemsUsed: 38,
          itemsPacked: 48
        }
      ]
    };

    res.json({
      success: true,
      data: history,
      message: 'Packing history retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get history',
      error: error.message
    });
  }
});

// Generate minimal packing list (for carry-on only)
router.post('/minimal', authMiddleware, async (req, res) => {
  try {
    const { destination, duration, activities } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Destination and duration are required'
      });
    }

    // Generate base list and then minimize it
    const tripData = {
      destination,
      dates: { 
        start: new Date().toISOString(),
        end: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
      },
      activities: activities || [],
      travelerType: 'minimalist'
    };

    const fullList = await smartPackingService.generatePackingList(tripData);
    
    // Filter to only essential and high-priority items
    const minimalList = {};
    Object.keys(fullList.packingList).forEach(category => {
      minimalList[category] = fullList.packingList[category]
        .filter(item => item.priority === 'essential')
        .map(item => ({
          ...item,
          quantity: Math.min(item.quantity, Math.ceil(duration / 3)) // Reduce quantities
        }));
    });

    res.json({
      success: true,
      data: {
        packingList: minimalList,
        stats: smartPackingService.calculatePackingStats(minimalList),
        tips: [
          'Focus on versatile pieces that work for multiple occasions',
          'Wear your heaviest items while traveling',
          'Choose quick-dry fabrics for easy washing',
          'Limit yourself to 2 pairs of shoes maximum'
        ]
      },
      message: 'Minimal packing list generated successfully'
    });

  } catch (error) {
    console.error('Error generating minimal list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate minimal list',
      error: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Packing service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;