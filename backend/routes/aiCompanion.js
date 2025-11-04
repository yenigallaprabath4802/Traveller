const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiCompanionService = require('../services/aiCompanionService');

// Main chat endpoint
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, context, voiceEnabled = false } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    console.log(`💬 AI Companion chat request from user ${userId}`);

    // Process the chat message
    const response = await aiCompanionService.processChat(userId, message.trim(), context);

    // Optimize response for voice if enabled
    if (voiceEnabled && response.message) {
      response.voiceOptimizedMessage = aiCompanionService.optimizeForVoice(response.message);
    }

    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in AI companion chat:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

// Get personalized recommendations
router.post('/recommendations', auth, async (req, res) => {
  try {
    const { requestType, destination } = req.body;
    const userId = req.user.id;

    if (!requestType) {
      return res.status(400).json({ 
        error: 'Request type is required' 
      });
    }

    console.log(`🎯 Getting recommendations for user ${userId}: ${requestType}`);

    const recommendations = await aiCompanionService.getPersonalizedRecommendations(
      userId, 
      requestType, 
      destination
    );

    res.json({
      success: true,
      data: recommendations,
      message: `Generated ${recommendations.recommendations?.length || 0} personalized recommendations`
    });

  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      details: error.message 
    });
  }
});

// Smart trip planning
router.post('/plan-trip', auth, async (req, res) => {
  try {
    const { destination, preferences = {} } = req.body;
    const userId = req.user.id;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required' 
      });
    }

    console.log(`🗺️ Planning trip for user ${userId} to ${destination}`);

    const tripPlan = await aiCompanionService.planTripWithContext(
      userId, 
      destination, 
      preferences
    );

    res.json({
      success: true,
      data: tripPlan,
      message: `Created personalized trip plan for ${destination}`
    });

  } catch (error) {
    console.error('Error planning trip:', error);
    res.status(500).json({ 
      error: 'Failed to plan trip',
      details: error.message 
    });
  }
});

// Get conversation summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`📊 Getting conversation summary for user ${userId}`);

    const summary = aiCompanionService.getConversationSummary(userId);

    res.json({
      success: true,
      data: summary,
      message: 'Conversation summary retrieved'
    });

  } catch (error) {
    console.error('Error getting conversation summary:', error);
    res.status(500).json({ 
      error: 'Failed to get conversation summary',
      details: error.message 
    });
  }
});

// Clear conversation memory
router.delete('/memory', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`🗑️ Clearing conversation memory for user ${userId}`);

    const result = aiCompanionService.clearUserMemory(userId);

    res.json({
      success: true,
      data: result,
      message: 'Conversation memory cleared successfully'
    });

  } catch (error) {
    console.error('Error clearing memory:', error);
    res.status(500).json({ 
      error: 'Failed to clear conversation memory',
      details: error.message 
    });
  }
});

// Voice-specific endpoint for optimized responses
router.post('/voice-chat', auth, async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: 'Message is required' 
      });
    }

    console.log(`🎤 Voice chat request from user ${userId}`);

    // Process with voice optimization
    const response = await aiCompanionService.processChat(userId, message.trim(), context);
    
    // Always optimize for voice
    response.voiceOptimizedMessage = aiCompanionService.optimizeForVoice(response.message);
    
    // Add voice-specific metadata
    response.voiceMetadata = {
      estimatedDuration: Math.ceil(response.voiceOptimizedMessage.length / 150), // Rough seconds estimate
      pausePoints: response.voiceOptimizedMessage.split('...').length - 1,
      complexity: response.message.length > 500 ? 'high' : response.message.length > 200 ? 'medium' : 'low'
    };

    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in voice chat:', error);
    res.status(500).json({ 
      error: 'Failed to process voice message',
      details: error.message 
    });
  }
});

// Context update endpoint
router.put('/context', auth, async (req, res) => {
  try {
    const { contextUpdate } = req.body;
    const userId = req.user.id;

    if (!contextUpdate) {
      return res.status(400).json({ 
        error: 'Context update is required' 
      });
    }

    console.log(`🔄 Updating context for user ${userId}`);

    // Update user memory with new context
    const memory = aiCompanionService.getUserMemory(userId);
    
    // Merge context updates
    if (contextUpdate.preferences) {
      memory.personalContext = { ...memory.personalContext, ...contextUpdate.preferences };
    }
    
    if (contextUpdate.location) {
      memory.entities.locations = memory.entities.locations || [];
      memory.entities.locations.push(contextUpdate.location);
    }
    
    if (contextUpdate.currentTrip) {
      memory.personalContext.currentTrip = contextUpdate.currentTrip;
    }

    res.json({
      success: true,
      message: 'Context updated successfully',
      updatedContext: memory.personalContext
    });

  } catch (error) {
    console.error('Error updating context:', error);
    res.status(500).json({ 
      error: 'Failed to update context',
      details: error.message 
    });
  }
});

// Get user learning insights
router.get('/insights', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`💡 Getting insights for user ${userId}`);

    const memory = aiCompanionService.getUserMemory(userId);
    
    // Analyze user patterns
    const insights = {
      travelPersonality: analyzeTravelPersonality(memory),
      preferredTopics: getTopTopics(memory.topics),
      suggestedDestinations: getSuggestedDestinations(memory),
      conversationStats: {
        totalMessages: memory.messageCount,
        topicsDiscussed: memory.topics.length,
        lastActive: memory.lastInteraction
      },
      learningOpportunities: identifyLearningOpportunities(memory)
    };

    res.json({
      success: true,
      data: insights,
      message: 'User insights generated'
    });

  } catch (error) {
    console.error('Error getting insights:', error);
    res.status(500).json({ 
      error: 'Failed to get user insights',
      details: error.message 
    });
  }
});

// Helper functions
function analyzeTravelPersonality(memory) {
  const preferences = memory.preferences || {};
  const topics = memory.topics || [];
  
  // Simple personality analysis based on conversation patterns
  let personality = 'Explorer'; // Default
  
  if (topics.includes('budget') || topics.includes('cheap') || topics.includes('affordable')) {
    personality = 'Budget Traveler';
  } else if (topics.includes('luxury') || topics.includes('premium') || topics.includes('exclusive')) {
    personality = 'Luxury Traveler';
  } else if (topics.includes('adventure') || topics.includes('hiking') || topics.includes('extreme')) {
    personality = 'Adventure Seeker';
  } else if (topics.includes('culture') || topics.includes('history') || topics.includes('museum')) {
    personality = 'Cultural Explorer';
  } else if (topics.includes('food') || topics.includes('restaurant') || topics.includes('cuisine')) {
    personality = 'Food Enthusiast';
  }
  
  return personality;
}

function getTopTopics(topics) {
  const topicCount = {};
  topics.forEach(topic => {
    topicCount[topic] = (topicCount[topic] || 0) + 1;
  });
  
  return Object.entries(topicCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([topic, count]) => ({ topic, count }));
}

function getSuggestedDestinations(memory) {
  const entities = memory.entities || {};
  const discussedDestinations = entities.destinations || [];
  
  // Simple suggestion logic - in real implementation, this would be more sophisticated
  const suggestions = [
    'Japan - For cultural experiences',
    'Iceland - For adventure activities',
    'Italy - For food and history',
    'Thailand - For budget-friendly travel',
    'New Zealand - For outdoor adventures'
  ];
  
  return suggestions.filter(dest => 
    !discussedDestinations.some(discussed => 
      dest.toLowerCase().includes(discussed.toLowerCase())
    )
  ).slice(0, 3);
}

function identifyLearningOpportunities(memory) {
  const opportunities = [];
  
  if (!memory.topics.includes('visa')) {
    opportunities.push('Learn about visa requirements');
  }
  
  if (!memory.topics.includes('insurance')) {
    opportunities.push('Explore travel insurance options');
  }
  
  if (!memory.topics.includes('packing')) {
    opportunities.push('Get packing tips and advice');
  }
  
  if (!memory.topics.includes('culture')) {
    opportunities.push('Discover cultural customs and etiquette');
  }
  
  return opportunities.slice(0, 3);
}

module.exports = router;