const express = require('express');
const router = express.Router();
const { BehaviorAnalyticsService } = require('../services/behaviorAnalyticsService');

const behaviorService = new BehaviorAnalyticsService();

// Track user behavior event
router.post('/track', async (req, res) => {
  try {
    const { eventType, eventData, context } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId || !eventType || !eventData) {
      return res.status(400).json({
        error: 'Missing required fields: userId, eventType, eventData'
      });
    }

    // Add device info from request headers
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      screenResolution: req.headers['x-screen-resolution']
    };

    const behaviorEvent = await behaviorService.trackEvent(
      userId,
      eventType,
      eventData,
      { ...context, deviceInfo, sessionId: req.sessionID }
    );

    res.status(201).json({
      success: true,
      eventId: behaviorEvent._id,
      message: 'Behavior tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking behavior:', error);
    res.status(500).json({
      error: 'Failed to track behavior',
      details: error.message
    });
  }
});

// Get personalized recommendations
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const context = req.query;

    const recommendations = await behaviorService.getPersonalizedRecommendations(
      userId,
      context
    );

    res.json({
      success: true,
      userId,
      recommendations,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
});

// Get user preferences and learning data
router.get('/preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const analytics = await behaviorService.getUserAnalytics(userId);

    res.json({
      success: true,
      userId,
      analytics,
      retrievedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({
      error: 'Failed to get user preferences',
      details: error.message
    });
  }
});

// Add trip feedback for learning
router.post('/feedback/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { tripData, satisfaction, feedback } = req.body;

    if (!tripData || !satisfaction) {
      return res.status(400).json({
        error: 'Missing required fields: tripData, satisfaction'
      });
    }

    const tripHistory = await behaviorService.addTripFeedback(
      userId,
      tripData,
      satisfaction,
      feedback
    );

    res.status(201).json({
      success: true,
      tripId: tripHistory.tripId,
      message: 'Trip feedback added successfully'
    });
  } catch (error) {
    console.error('Error adding trip feedback:', error);
    res.status(500).json({
      error: 'Failed to add trip feedback',
      details: error.message
    });
  }
});

// Get user's learning progress
router.get('/learning-progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const analytics = await behaviorService.getUserAnalytics(userId, '90d');
    
    // Calculate learning progress metrics
    const progressMetrics = {
      totalInteractions: analytics.totalInteractions,
      confidenceScore: analytics.confidence,
      learningStage: analytics.confidence < 0.2 ? 'beginner' :
                     analytics.confidence < 0.6 ? 'learning' : 'advanced',
      preferencesEstablished: analytics.preferences ? 
        Object.keys(analytics.preferences.preferredActivities || {}).length : 0,
      tripHistoryCount: analytics.recentTrips?.length || 0,
      lastActivity: analytics.behaviorSummary?.reduce((latest, behavior) => {
        return behavior.timestamp > latest ? behavior.timestamp : latest;
      }, new Date(0))
    };

    res.json({
      success: true,
      userId,
      progressMetrics,
      detailedAnalytics: analytics,
      recommendations: {
        nextSteps: generateLearningRecommendations(progressMetrics),
        dataNeeded: identifyMissingData(analytics.preferences)
      }
    });
  } catch (error) {
    console.error('Error getting learning progress:', error);
    res.status(500).json({
      error: 'Failed to get learning progress',
      details: error.message
    });
  }
});

// Bulk track multiple events (for efficiency)
router.post('/track-bulk', async (req, res) => {
  try {
    const { events } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId || !events || !Array.isArray(events)) {
      return res.status(400).json({
        error: 'Missing required fields: userId, events (array)'
      });
    }

    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.headers['sec-ch-ua-platform'],
      screenResolution: req.headers['x-screen-resolution']
    };

    const results = [];
    
    for (const event of events) {
      try {
        const behaviorEvent = await behaviorService.trackEvent(
          userId,
          event.eventType,
          event.eventData,
          { 
            ...event.context, 
            deviceInfo, 
            sessionId: req.sessionID 
          }
        );
        results.push({ success: true, eventId: behaviorEvent._id });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      processedEvents: results.length,
      successfulEvents: results.filter(r => r.success).length,
      results
    });
  } catch (error) {
    console.error('Error bulk tracking behavior:', error);
    res.status(500).json({
      error: 'Failed to bulk track behavior',
      details: error.message
    });
  }
});

// Get behavior insights for specific category
router.get('/insights/:userId/:category', async (req, res) => {
  try {
    const { userId, category } = req.params;
    const { timeframe = '30d' } = req.query;

    const insights = await getBehaviorInsights(userId, category, timeframe);

    res.json({
      success: true,
      userId,
      category,
      timeframe,
      insights,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting behavior insights:', error);
    res.status(500).json({
      error: 'Failed to get behavior insights',
      details: error.message
    });
  }
});

// Reset user learning data (for testing or user request)
router.delete('/reset/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { confirmReset } = req.body;

    if (confirmReset !== 'yes') {
      return res.status(400).json({
        error: 'Please confirm reset by sending { "confirmReset": "yes" }'
      });
    }

    // Delete user behavior data
    await UserBehavior.deleteMany({ userId });
    await UserPreference.deleteOne({ userId });
    await TripHistory.deleteMany({ userId });

    res.json({
      success: true,
      message: 'User learning data reset successfully',
      userId
    });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({
      error: 'Failed to reset user data',
      details: error.message
    });
  }
});

// Helper functions
function generateLearningRecommendations(progressMetrics) {
  const recommendations = [];

  if (progressMetrics.confidenceScore < 0.2) {
    recommendations.push({
      action: 'explore_destinations',
      message: 'Explore different destination types to help us learn your preferences',
      priority: 'high'
    });
    recommendations.push({
      action: 'use_search',
      message: 'Use the search feature to find places that interest you',
      priority: 'medium'
    });
  }

  if (progressMetrics.preferencesEstablished < 5) {
    recommendations.push({
      action: 'engage_content',
      message: 'Like and bookmark destinations that appeal to you',
      priority: 'high'
    });
  }

  if (progressMetrics.tripHistoryCount === 0) {
    recommendations.push({
      action: 'plan_trip',
      message: 'Plan your first trip to help us understand your travel style',
      priority: 'medium'
    });
  }

  return recommendations;
}

function identifyMissingData(preferences) {
  const missingData = [];

  if (!preferences) {
    return ['All preference data is missing - start by exploring destinations'];
  }

  if (!preferences.travelStyle || Object.keys(preferences.travelStyle).length === 0) {
    missingData.push('Travel style preferences');
  }

  if (!preferences.preferredDestinations || preferences.preferredDestinations.length === 0) {
    missingData.push('Destination preferences');
  }

  if (!preferences.preferredActivities || preferences.preferredActivities.length === 0) {
    missingData.push('Activity preferences');
  }

  if (!preferences.tripPatterns) {
    missingData.push('Trip planning patterns');
  }

  return missingData;
}

async function getBehaviorInsights(userId, category, timeframe) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeframe));

  const { UserBehavior } = require('../services/behaviorAnalyticsService');

  const insights = await UserBehavior.aggregate([
    {
      $match: {
        userId,
        'eventData.category': category,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          eventType: '$eventType',
          subcategory: '$eventData.subcategory'
        },
        count: { $sum: 1 },
        avgPrice: { $avg: '$eventData.price' },
        avgDuration: { $avg: '$eventData.duration' },
        locations: { $addToSet: '$eventData.location' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  return {
    topInteractions: insights.slice(0, 10),
    totalInteractions: insights.reduce((sum, item) => sum + item.count, 0),
    averageEngagement: insights.length > 0 ? 
      insights.reduce((sum, item) => sum + item.count, 0) / insights.length : 0,
    categoryTrends: generateCategoryTrends(insights),
    recommendations: generateCategoryRecommendations(category, insights)
  };
}

function generateCategoryTrends(insights) {
  return insights.map(insight => ({
    type: insight._id.eventType,
    subcategory: insight._id.subcategory,
    engagement: insight.count,
    trend: insight.count > 5 ? 'high' : insight.count > 2 ? 'medium' : 'low'
  }));
}

function generateCategoryRecommendations(category, insights) {
  const recommendations = [];
  
  const highEngagementItems = insights.filter(item => item.count > 3);
  
  if (highEngagementItems.length > 0) {
    recommendations.push({
      type: 'similar_exploration',
      message: `You show high interest in ${category}. Explore similar options.`,
      items: highEngagementItems.map(item => item._id.subcategory).slice(0, 3)
    });
  }

  return recommendations;
}

module.exports = router;