const express = require('express');
const router = express.Router();
const { ContextualChatService } = require('../services/contextualChatService');

const contextualChatService = new ContextualChatService();

// Generate contextual response
router.post('/contextual-response', async (req, res) => {
  try {
    const { userId, message, context, sessionId } = req.body;

    if (!userId || !message || !context || !sessionId) {
      return res.status(400).json({
        error: 'Missing required fields: userId, message, context, sessionId'
      });
    }

    const response = await contextualChatService.generateContextualResponse(
      userId,
      message,
      context,
      sessionId
    );

    res.json({
      success: true,
      ...response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating contextual response:', error);
    res.status(500).json({
      error: 'Failed to generate contextual response',
      details: error.message
    });
  }
});

// Get conversation memory
router.get('/memory/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const memory = await contextualChatService.getConversationMemory(userId, sessionId);

    res.json({
      success: true,
      memory: {
        conversationSummary: memory.conversationSummary,
        keyTopics: memory.keyTopics.slice(0, 10),
        userPreferences: memory.userPreferences,
        contextHistory: memory.contextHistory,
        conversationStats: memory.conversationStats,
        memoryConfidence: contextualChatService.calculateMemoryConfidence(memory)
      }
    });

  } catch (error) {
    console.error('Error getting conversation memory:', error);
    res.status(500).json({
      error: 'Failed to get conversation memory',
      details: error.message
    });
  }
});

// Get context templates
router.get('/context-templates', async (req, res) => {
  try {
    const { ContextTemplate } = require('../services/contextualChatService');
    const templates = await ContextTemplate.find({}, {
      contextType: 1,
      responseStyle: 1,
      suggestedQuestions: 1,
      conversationStarters: 1,
      recommendationFilters: 1
    });

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    console.error('Error getting context templates:', error);
    res.status(500).json({
      error: 'Failed to get context templates',
      details: error.message
    });
  }
});

// Get conversation starters for context
router.get('/conversation-starters/:context', async (req, res) => {
  try {
    const { context } = req.params;
    const { ContextTemplate } = require('../services/contextualChatService');
    
    const template = await ContextTemplate.findOne({ contextType: context });
    
    if (!template) {
      return res.status(404).json({
        error: 'Context template not found'
      });
    }

    res.json({
      success: true,
      context,
      conversationStarters: template.conversationStarters,
      suggestedQuestions: template.suggestedQuestions,
      responseStyle: template.responseStyle
    });

  } catch (error) {
    console.error('Error getting conversation starters:', error);
    res.status(500).json({
      error: 'Failed to get conversation starters',
      details: error.message
    });
  }
});

// Get conversation history
router.get('/history/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const memory = await contextualChatService.getConversationMemory(userId, sessionId);
    
    const totalMessages = memory.messageHistory.length;
    const messages = memory.messageHistory
      .slice(-limit - offset, -offset || undefined)
      .reverse();

    res.json({
      success: true,
      messages,
      pagination: {
        total: totalMessages,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: totalMessages > limit + offset
      },
      conversationStats: memory.conversationStats
    });

  } catch (error) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      error: 'Failed to get conversation history',
      details: error.message
    });
  }
});

// Update user preferences
router.post('/update-preferences', async (req, res) => {
  try {
    const { userId, sessionId, preferences } = req.body;

    if (!userId || !sessionId || !preferences) {
      return res.status(400).json({
        error: 'Missing required fields: userId, sessionId, preferences'
      });
    }

    const memory = await contextualChatService.getConversationMemory(userId, sessionId);
    
    // Update preferences
    if (preferences.destinations) {
      memory.userPreferences.destinations = [...new Set([
        ...memory.userPreferences.destinations,
        ...preferences.destinations
      ])].slice(-10);
    }

    if (preferences.activities) {
      memory.userPreferences.activities = [...new Set([
        ...memory.userPreferences.activities,
        ...preferences.activities
      ])].slice(-15);
    }

    if (preferences.budgetRange) {
      memory.userPreferences.budgetRange = preferences.budgetRange;
    }

    if (preferences.travelStyle) {
      memory.userPreferences.travelStyle = preferences.travelStyle;
    }

    if (preferences.groupPreference) {
      memory.userPreferences.groupPreference = preferences.groupPreference;
    }

    memory.lastUpdated = new Date();
    await memory.save();

    res.json({
      success: true,
      updatedPreferences: memory.userPreferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      details: error.message
    });
  }
});

// Analyze conversation patterns
router.get('/analysis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;

    const analysis = await analyzeConversationPatterns(userId, timeframe);

    res.json({
      success: true,
      userId,
      timeframe,
      analysis,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error analyzing conversation patterns:', error);
    res.status(500).json({
      error: 'Failed to analyze conversation patterns',
      details: error.message
    });
  }
});

// Get smart suggestions based on context and history
router.post('/smart-suggestions', async (req, res) => {
  try {
    const { userId, sessionId, context, currentMessage } = req.body;

    if (!userId || !sessionId || !context) {
      return res.status(400).json({
        error: 'Missing required fields: userId, sessionId, context'
      });
    }

    const suggestions = await generateSmartSuggestions(
      userId, 
      sessionId, 
      context, 
      currentMessage
    );

    res.json({
      success: true,
      suggestions,
      context,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating smart suggestions:', error);
    res.status(500).json({
      error: 'Failed to generate smart suggestions',
      details: error.message
    });
  }
});

// Reset conversation memory (for testing or user request)
router.delete('/memory/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { confirmReset } = req.body;

    if (confirmReset !== 'yes') {
      return res.status(400).json({
        error: 'Please confirm reset by sending { "confirmReset": "yes" }'
      });
    }

    const { ConversationMemory } = require('../services/contextualChatService');
    await ConversationMemory.deleteOne({ userId, sessionId });

    res.json({
      success: true,
      message: 'Conversation memory reset successfully',
      userId,
      sessionId
    });

  } catch (error) {
    console.error('Error resetting conversation memory:', error);
    res.status(500).json({
      error: 'Failed to reset conversation memory',
      details: error.message
    });
  }
});

// Export conversation data
router.get('/export/:userId/:sessionId', async (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const { format = 'json' } = req.query;

    const memory = await contextualChatService.getConversationMemory(userId, sessionId);
    
    const exportData = {
      userId,
      sessionId,
      exportDate: new Date().toISOString(),
      conversationSummary: memory.conversationSummary,
      messageHistory: memory.messageHistory,
      userPreferences: memory.userPreferences,
      keyTopics: memory.keyTopics,
      contextHistory: memory.contextHistory,
      conversationStats: memory.conversationStats
    };

    if (format === 'csv') {
      // Convert to CSV format for message history
      const csv = convertToCSV(memory.messageHistory);
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="conversation_${userId}_${sessionId}.csv"`
      });
      res.send(csv);
    } else {
      res.set({
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="conversation_${userId}_${sessionId}.json"`
      });
      res.json(exportData);
    }

  } catch (error) {
    console.error('Error exporting conversation data:', error);
    res.status(500).json({
      error: 'Failed to export conversation data',
      details: error.message
    });
  }
});

// Helper functions

async function analyzeConversationPatterns(userId, timeframe) {
  const { ConversationMemory } = require('../services/contextualChatService');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(timeframe));

  const memories = await ConversationMemory.find({
    userId,
    lastUpdated: { $gte: startDate }
  });

  const analysis = {
    totalSessions: memories.length,
    totalMessages: memories.reduce((sum, mem) => sum + mem.conversationStats.totalMessages, 0),
    averageMessagesPerSession: 0,
    mostDiscussedTopics: {},
    contextPreferences: {},
    sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
    conversationGrowth: [],
    engagementScore: 0
  };

  if (analysis.totalSessions > 0) {
    analysis.averageMessagesPerSession = analysis.totalMessages / analysis.totalSessions;
  }

  // Analyze topics
  memories.forEach(memory => {
    memory.keyTopics.forEach(topic => {
      analysis.mostDiscussedTopics[topic.topic] = 
        (analysis.mostDiscussedTopics[topic.topic] || 0) + topic.mentions;
    });

    // Analyze context preferences
    memory.contextHistory.forEach(context => {
      analysis.contextPreferences[context.context] = 
        (analysis.contextPreferences[context.context] || 0) + context.frequency;
    });

    // Analyze sentiment
    memory.messageHistory.forEach(msg => {
      analysis.sentimentDistribution[msg.sentiment]++;
    });
  });

  // Calculate engagement score
  const avgTopicsPerSession = memories.reduce((sum, mem) => sum + mem.keyTopics.length, 0) / memories.length;
  const avgPreferencesPerSession = memories.reduce((sum, mem) => 
    sum + mem.userPreferences.destinations.length + mem.userPreferences.activities.length, 0) / memories.length;
  
  analysis.engagementScore = Math.min(
    (analysis.averageMessagesPerSession / 10) * 0.4 +
    (avgTopicsPerSession / 5) * 0.3 +
    (avgPreferencesPerSession / 10) * 0.3,
    1.0
  );

  return analysis;
}

async function generateSmartSuggestions(userId, sessionId, context, currentMessage) {
  const memory = await contextualChatService.getConversationMemory(userId, sessionId);
  const { ContextTemplate } = require('../services/contextualChatService');
  const template = await ContextTemplate.findOne({ contextType: context });

  const suggestions = [];

  // Add context-specific suggestions
  if (template) {
    suggestions.push(...template.suggestedQuestions.slice(0, 2));
  }

  // Add personalized suggestions based on memory
  if (memory.userPreferences.destinations.length > 0) {
    const recentDest = memory.userPreferences.destinations.slice(-1)[0];
    suggestions.push(`What should I know about traveling to ${recentDest}?`);
  }

  if (memory.userPreferences.activities.length > 0) {
    const topActivity = memory.userPreferences.activities[0];
    suggestions.push(`Find ${topActivity} activities for my trip`);
  }

  // Add suggestions based on current message
  if (currentMessage) {
    const messageLower = currentMessage.toLowerCase();
    
    if (messageLower.includes('budget')) {
      suggestions.push('Help me create a detailed budget breakdown');
    }
    
    if (messageLower.includes('where') || messageLower.includes('destination')) {
      suggestions.push('Compare different destination options for me');
    }
    
    if (messageLower.includes('when') || messageLower.includes('time')) {
      suggestions.push('What\'s the best time to visit for weather and prices?');
    }
  }

  // Add trending suggestions based on key topics
  const topTopics = memory.keyTopics.slice(0, 3);
  topTopics.forEach(topic => {
    suggestions.push(`Tell me more about ${topic.topic} recommendations`);
  });

  return [...new Set(suggestions)].slice(0, 6);
}

function convertToCSV(messageHistory) {
  const headers = ['Timestamp', 'Message', 'Response', 'Context', 'Topics', 'Sentiment', 'Importance'];
  const rows = messageHistory.map(msg => [
    msg.timestamp.toISOString(),
    `"${msg.message.replace(/"/g, '""')}"`,
    `"${msg.response.replace(/"/g, '""')}"`,
    msg.context,
    msg.topics.join(';'),
    msg.sentiment,
    msg.importance
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

module.exports = router;