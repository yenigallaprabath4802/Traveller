const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Adaptive chat endpoint
router.post('/adaptive-chat', async (req, res) => {
  try {
    const { 
      message, 
      context, 
      userPreferences, 
      learningProgress, 
      sessionId, 
      prompt 
    } = req.body;

    // Generate adaptive response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: prompt || generateDefaultPrompt(context, userPreferences)
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0].message.content;

    // Generate contextual suggestions
    const suggestions = await generateContextualSuggestions(
      message, 
      context, 
      userPreferences
    );

    // Calculate personalization score
    const personalizedScore = calculatePersonalizationScore(
      userPreferences, 
      learningProgress
    );

    res.json({
      response,
      suggestions,
      personalizedScore,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in adaptive chat:', error);
    res.status(500).json({
      error: 'Failed to generate adaptive response',
      details: error.message
    });
  }
});

// Voice processing endpoint
router.post('/process-voice', async (req, res) => {
  try {
    const { audioData, context, userPreferences } = req.body;

    // Process voice input (implement with speech-to-text service)
    const transcript = await processVoiceInput(audioData);

    // Get adaptive response
    const adaptiveResponse = await getAdaptiveResponse(
      transcript, 
      context, 
      userPreferences
    );

    res.json({
      transcript,
      response: adaptiveResponse.response,
      suggestions: adaptiveResponse.suggestions,
      audioResponse: await generateVoiceResponse(adaptiveResponse.response)
    });

  } catch (error) {
    console.error('Error processing voice:', error);
    res.status(500).json({
      error: 'Failed to process voice input',
      details: error.message
    });
  }
});

// Learning mode endpoint
router.post('/learn-preferences', async (req, res) => {
  try {
    const { userId, interactionData, feedback } = req.body;

    // Update learning model based on interaction
    const updatedPreferences = await updateLearningModel(
      userId, 
      interactionData, 
      feedback
    );

    res.json({
      success: true,
      updatedPreferences,
      learningInsights: generateLearningInsights(updatedPreferences)
    });

  } catch (error) {
    console.error('Error in learning mode:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
      details: error.message
    });
  }
});

// Generate contextual suggestions
async function generateContextualSuggestions(message, context, userPreferences) {
  const suggestions = [];

  // Base suggestions by context
  const contextSuggestions = {
    solo: [
      "What's the safest solo travel destination for beginners?",
      "How do I meet other travelers while traveling alone?",
      "What are some budget-friendly solo travel tips?"
    ],
    family: [
      "What are the best family-friendly destinations?",
      "How do I keep kids entertained during long flights?",
      "What safety precautions should I take when traveling with children?"
    ],
    couple: [
      "What are the most romantic destinations for couples?",
      "How do we plan a surprise trip for my partner?",
      "What are some unique date ideas while traveling?"
    ],
    group: [
      "How do we coordinate travel plans for a large group?",
      "What are the best group accommodation options?",
      "How do we split travel expenses fairly?"
    ],
    business: [
      "How do I maximize productivity during business travel?",
      "What are the best business travel apps?",
      "How do I blend business travel with leisure time?"
    ]
  };

  // Add context-specific suggestions
  if (contextSuggestions[context]) {
    suggestions.push(...contextSuggestions[context].slice(0, 2));
  }

  // Add preference-based suggestions
  if (userPreferences && userPreferences.confidence > 0.3) {
    const topDestination = userPreferences.preferredDestinations[0];
    const topActivity = userPreferences.preferredActivities[0];

    if (topDestination) {
      suggestions.push(`Tell me more about ${topDestination.type} destinations`);
    }

    if (topActivity) {
      suggestions.push(`Plan activities around ${topActivity.activity}`);
    }

    // Budget-based suggestions
    const budgetLevel = userPreferences.travelStyle?.budgetPreference;
    if (budgetLevel > 0.7) {
      suggestions.push("Show me luxury travel options");
    } else if (budgetLevel < 0.3) {
      suggestions.push("Find budget-friendly alternatives");
    }
  }

  // Message-based suggestions
  const messageLower = message.toLowerCase();
  if (messageLower.includes('budget')) {
    suggestions.push("What's the average cost for this type of trip?");
  }
  if (messageLower.includes('weather')) {
    suggestions.push("What's the best time to visit weather-wise?");
  }
  if (messageLower.includes('food')) {
    suggestions.push("What are the must-try local dishes?");
  }

  // Return unique suggestions (max 4)
  return [...new Set(suggestions)].slice(0, 4);
}

// Calculate personalization score
function calculatePersonalizationScore(userPreferences, learningProgress) {
  if (!userPreferences || !learningProgress) {
    return 0.1; // Low personalization for new users
  }

  const confidence = userPreferences.confidence || 0;
  const interactions = learningProgress.totalInteractions || 0;
  const preferencesCount = userPreferences.preferredActivities?.length || 0;

  // Weighted score based on multiple factors
  const confidenceWeight = 0.5;
  const interactionWeight = 0.3;
  const preferencesWeight = 0.2;

  const interactionScore = Math.min(interactions / 50, 1.0); // Normalize to 50 interactions
  const preferencesScore = Math.min(preferencesCount / 10, 1.0); // Normalize to 10 preferences

  const personalizedScore = 
    (confidence * confidenceWeight) +
    (interactionScore * interactionWeight) +
    (preferencesScore * preferencesWeight);

  return Math.min(personalizedScore, 1.0);
}

// Generate default prompt when none provided
function generateDefaultPrompt(context, userPreferences) {
  let prompt = `You are an adaptive AI travel companion. Provide helpful, personalized travel advice. `;

  // Add context
  switch (context) {
    case 'solo':
      prompt += `The user is planning solo travel. Focus on safety and independence. `;
      break;
    case 'family':
      prompt += `The user is planning family travel. Focus on family-friendly options. `;
      break;
    case 'couple':
      prompt += `The user is planning romantic travel. Focus on couple experiences. `;
      break;
    case 'group':
      prompt += `The user is planning group travel. Focus on coordination and group activities. `;
      break;
    case 'business':
      prompt += `The user is planning business travel. Focus on efficiency and professional needs. `;
      break;
  }

  if (userPreferences && userPreferences.confidence > 0.3) {
    prompt += `Consider their preferences for personalized recommendations. `;
  } else {
    prompt += `Help them discover their travel preferences through questions. `;
  }

  prompt += `Be conversational, helpful, and encouraging.`;

  return prompt;
}

// Process voice input (placeholder - implement with actual speech-to-text)
async function processVoiceInput(audioData) {
  // This would integrate with a speech-to-text service like:
  // - Google Speech-to-Text
  // - Azure Speech Services
  // - AWS Transcribe
  // - OpenAI Whisper API
  
  try {
    // Placeholder implementation
    // In real implementation, you would:
    // 1. Convert audioData to proper format
    // 2. Send to speech-to-text service
    // 3. Return transcript
    
    return "Hello, I'm looking for travel recommendations"; // Placeholder
  } catch (error) {
    throw new Error('Voice processing failed: ' + error.message);
  }
}

// Get adaptive response
async function getAdaptiveResponse(message, context, userPreferences) {
  const prompt = generateDefaultPrompt(context, userPreferences);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: message }
    ],
    temperature: 0.7,
    max_tokens: 300,
  });

  const response = completion.choices[0].message.content;
  const suggestions = await generateContextualSuggestions(message, context, userPreferences);

  return { response, suggestions };
}

// Generate voice response (placeholder - implement with text-to-speech)
async function generateVoiceResponse(text) {
  // This would integrate with a text-to-speech service like:
  // - Google Text-to-Speech
  // - Azure Speech Services
  // - AWS Polly
  // - OpenAI TTS API
  
  try {
    // Placeholder implementation
    // In real implementation, you would:
    // 1. Send text to TTS service
    // 2. Get audio data back
    // 3. Return audio URL or base64 data
    
    return null; // Return audio data in real implementation
  } catch (error) {
    console.error('TTS generation failed:', error);
    return null;
  }
}

// Update learning model (integrate with behavior analytics)
async function updateLearningModel(userId, interactionData, feedback) {
  const { BehaviorAnalyticsService } = require('../services/behaviorAnalyticsService');
  const behaviorService = new BehaviorAnalyticsService();

  try {
    // Track the interaction
    await behaviorService.trackEvent(
      userId,
      'chat',
      {
        category: 'ai-companion',
        subcategory: 'adaptive-learning',
        message: interactionData.message,
        feedback: feedback
      },
      interactionData.context
    );

    // Get updated preferences
    const updatedPreferences = await behaviorService.getPersonalizedRecommendations(userId);
    
    return updatedPreferences;
  } catch (error) {
    throw new Error('Learning model update failed: ' + error.message);
  }
}

// Generate learning insights
function generateLearningInsights(preferences) {
  if (!preferences || preferences.confidence < 0.2) {
    return {
      stage: 'discovery',
      message: 'I am still learning about your travel preferences. Keep interacting with me!',
      recommendations: [
        'Tell me about your dream destination',
        'Share what type of activities you enjoy',
        'Describe your ideal trip budget'
      ]
    };
  }

  if (preferences.confidence < 0.6) {
    return {
      stage: 'learning',
      message: 'I am getting to know your travel style. Your preferences are becoming clearer!',
      recommendations: [
        'Share more about specific places you\'ve enjoyed',
        'Tell me about travel experiences you want to avoid',
        'Describe your ideal travel companion situation'
      ]
    };
  }

  return {
    stage: 'personalized',
    message: 'I have a good understanding of your travel preferences and can provide highly personalized recommendations!',
    recommendations: [
      'Ask me for specific destination recommendations',
      'Let me create a detailed itinerary for you',
      'Get personalized travel tips for your next trip'
    ]
  };
}

module.exports = router;