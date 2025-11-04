const { OpenAI } = require('openai');
const axios = require('axios');

class AICompanionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.conversationMemory = new Map(); // In-memory storage for conversation context
    this.userProfiles = new Map(); // User preference storage
  }

  // Main chat processing function
  async processChat(userId, message, context) {
    try {
      console.log(`🤖 Processing chat for user ${userId}: "${message}"`);

      // Get or create user conversation memory
      const userMemory = this.getUserMemory(userId);
      
      // Analyze user intent and extract entities
      const messageAnalysis = await this.analyzeMessage(message, context);
      
      // Update conversation memory with new information
      this.updateMemory(userId, message, messageAnalysis, context);
      
      // Generate contextual response
      const response = await this.generateResponse(userId, message, context, messageAnalysis);
      
      // Determine emotion and tone
      const emotion = this.determineEmotion(messageAnalysis, response);
      
      // Extract any context updates
      const contextUpdates = this.extractContextUpdates(messageAnalysis, response);
      
      return {
        message: response,
        emotion,
        context: contextUpdates,
        topics: messageAnalysis.topics || [],
        mainTopic: messageAnalysis.mainTopic,
        updatedContext: contextUpdates,
        conversationId: userMemory.conversationId
      };

    } catch (error) {
      console.error('Error processing chat:', error);
      return {
        message: "I apologize, but I'm having trouble processing your request right now. Could you please try rephrasing your question?",
        emotion: 'concerned',
        error: true
      };
    }
  }

  // Analyze incoming message for intent, entities, and topics
  async analyzeMessage(message, context) {
    const analysisPrompt = `
    You are an expert travel AI assistant. Analyze this message and provide structured information:

    Message: "${message}"
    Context: ${JSON.stringify(context)}

    Provide analysis in this JSON format:
    {
      "intent": "plan_trip|ask_question|get_recommendation|book_activity|weather_check|general_chat",
      "entities": {
        "destinations": ["destination1", "destination2"],
        "dates": ["date1", "date2"],
        "activities": ["activity1", "activity2"],
        "budget": "amount or range",
        "travelers": "number",
        "preferences": ["preference1", "preference2"]
      },
      "topics": ["topic1", "topic2"],
      "mainTopic": "primary topic",
      "sentiment": "positive|neutral|negative",
      "urgency": "low|medium|high",
      "requiresAction": true/false,
      "personalization": {
        "rememberedPreferences": ["pref1", "pref2"],
        "learningOpportunities": ["learn1", "learn2"]
      }
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing message:', error);
      return {
        intent: 'general_chat',
        topics: ['travel'],
        mainTopic: 'general',
        sentiment: 'neutral'
      };
    }
  }

  // Generate contextual response using conversation memory
  async generateResponse(userId, message, context, analysis) {
    const userMemory = this.getUserMemory(userId);
    
    const systemPrompt = `
    You are an advanced AI Travel Companion with the following characteristics:
    - Friendly, knowledgeable, and enthusiastic about travel
    - Remember previous conversations and user preferences
    - Provide personalized recommendations based on user history
    - Use natural, conversational language
    - Be helpful, empathetic, and engaging
    - Offer practical travel advice and tips
    - Can discuss destinations, activities, planning, budgets, and more

    User Profile:
    - Name: ${context.userContext?.name || 'Traveler'}
    - Current Location: ${context.userContext?.location || 'Unknown'}
    - Travel Style: ${context.userContext?.preferences?.travelStyle?.join(', ') || 'Not specified'}
    - Interests: ${context.userContext?.preferences?.interests?.join(', ') || 'Not specified'}
    - Budget Range: ${context.userContext?.preferences?.budgetRange || 'Not specified'}
    - Current Trip: ${context.userContext?.currentTrip?.destination || 'None planned'}

    Conversation Memory:
    - Previous topics: ${userMemory.topics.slice(-5).join(', ')}
    - Conversation count: ${userMemory.messageCount}
    - Last interaction: ${userMemory.lastInteraction}

    Recent Messages:
    ${context.recentMessages?.map(msg => `${msg.role}: ${msg.content}`).join('\n') || 'No recent messages'}

    Current Message Analysis:
    - Intent: ${analysis.intent}
    - Main Topic: ${analysis.mainTopic}
    - Sentiment: ${analysis.sentiment}
    - Entities: ${JSON.stringify(analysis.entities)}

    Guidelines:
    1. Reference previous conversations when relevant
    2. Use the user's name if known
    3. Provide specific, actionable advice
    4. Ask follow-up questions to better understand needs
    5. Suggest related topics or activities
    6. Be encouraging and supportive
    7. Offer multiple options when possible
    8. Include practical tips and insider knowledge
    9. Adapt your tone to match the user's energy level
    10. Remember and build upon user preferences

    Respond naturally and helpfully to: "${message}"
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.8,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return "I'd be happy to help you with your travel needs! Could you tell me more about what you're looking for?";
    }
  }

  // Get or create user memory
  getUserMemory(userId) {
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, {
        conversationId: `conv_${userId}_${Date.now()}`,
        topics: [],
        preferences: {},
        entities: {},
        messageCount: 0,
        lastInteraction: new Date(),
        personalContext: {}
      });
    }
    return this.conversationMemory.get(userId);
  }

  // Update conversation memory
  updateMemory(userId, message, analysis, context) {
    const memory = this.getUserMemory(userId);
    
    // Update topics
    if (analysis.topics) {
      memory.topics = [...new Set([...memory.topics, ...analysis.topics])];
      if (memory.topics.length > 50) {
        memory.topics = memory.topics.slice(-50); // Keep last 50 topics
      }
    }

    // Update entities
    if (analysis.entities) {
      Object.keys(analysis.entities).forEach(key => {
        if (analysis.entities[key] && analysis.entities[key].length > 0) {
          memory.entities[key] = memory.entities[key] || [];
          memory.entities[key] = [...new Set([...memory.entities[key], ...analysis.entities[key]])];
        }
      });
    }

    // Update preferences from learning opportunities
    if (analysis.personalization?.learningOpportunities) {
      analysis.personalization.learningOpportunities.forEach(opportunity => {
        memory.preferences[opportunity] = (memory.preferences[opportunity] || 0) + 1;
      });
    }

    // Update counters
    memory.messageCount++;
    memory.lastInteraction = new Date();

    this.conversationMemory.set(userId, memory);
  }

  // Determine emotional tone of response
  determineEmotion(analysis, response) {
    if (analysis.intent === 'plan_trip' || response.includes('exciting') || response.includes('amazing')) {
      return 'excited';
    } else if (analysis.sentiment === 'negative' || response.includes('sorry') || response.includes('unfortunately')) {
      return 'concerned';
    } else if (analysis.intent === 'get_recommendation' || response.includes('suggest') || response.includes('recommend')) {
      return 'helpful';
    } else if (response.includes('great') || response.includes('wonderful') || response.includes('perfect')) {
      return 'happy';
    } else {
      return 'neutral';
    }
  }

  // Extract context updates from conversation
  extractContextUpdates(analysis, response) {
    const updates = {};

    // Extract location mentions
    if (analysis.entities?.destinations?.length > 0) {
      updates.interestedDestinations = analysis.entities.destinations;
    }

    // Extract travel dates
    if (analysis.entities?.dates?.length > 0) {
      updates.travelDates = analysis.entities.dates;
    }

    // Extract budget information
    if (analysis.entities?.budget) {
      updates.budgetRange = analysis.entities.budget;
    }

    // Extract travel party size
    if (analysis.entities?.travelers) {
      updates.travelers = analysis.entities.travelers;
    }

    // Extract preferences
    if (analysis.entities?.preferences?.length > 0) {
      updates.preferences = {
        activities: analysis.entities.preferences
      };
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(userId, requestType, destination = null) {
    const memory = this.getUserMemory(userId);
    
    const prompt = `
    Based on user history and preferences, provide personalized travel recommendations:

    User Profile:
    - Previous destinations: ${memory.entities.destinations?.join(', ') || 'None'}
    - Preferred activities: ${memory.entities.activities?.join(', ') || 'None'}
    - Budget preferences: ${memory.entities.budget || 'Not specified'}
    - Topics of interest: ${memory.topics.slice(-10).join(', ')}

    Request Type: ${requestType}
    ${destination ? `Destination: ${destination}` : ''}

    Provide 5 personalized recommendations in JSON format:
    {
      "recommendations": [
        {
          "title": "Recommendation title",
          "description": "Detailed description",
          "reason": "Why this matches their preferences",
          "estimatedCost": "Cost range",
          "duration": "Time needed",
          "tips": ["tip1", "tip2"]
        }
      ]
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1200
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return { recommendations: [] };
    }
  }

  // Smart trip planning with context
  async planTripWithContext(userId, destination, preferences = {}) {
    const memory = this.getUserMemory(userId);
    
    const prompt = `
    Create a personalized trip plan based on user history and preferences:

    Destination: ${destination}
    User Preferences: ${JSON.stringify(preferences)}
    
    User History:
    - Previous interests: ${memory.topics.slice(-10).join(', ')}
    - Preferred activities: ${memory.entities.activities?.join(', ') || 'None'}
    - Budget range: ${memory.entities.budget || 'Medium'}
    - Past destinations: ${memory.entities.destinations?.slice(-5).join(', ') || 'None'}

    Create a detailed 5-day itinerary in JSON format:
    {
      "tripPlan": {
        "destination": "${destination}",
        "duration": "5 days",
        "overview": "Trip overview",
        "personalizedReasons": ["reason1", "reason2"],
        "days": [
          {
            "day": 1,
            "theme": "Day theme",
            "activities": [
              {
                "time": "09:00",
                "activity": "Activity name",
                "description": "Activity description",
                "whyPersonalized": "Why this matches their preferences",
                "cost": "Estimated cost",
                "duration": "Duration"
              }
            ],
            "tips": ["tip1", "tip2"]
          }
        ],
        "budgetBreakdown": {
          "accommodation": "Cost",
          "activities": "Cost",
          "food": "Cost",
          "transport": "Cost",
          "total": "Total cost"
        },
        "personalizedTips": ["tip1", "tip2", "tip3"]
      }
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error planning trip:', error);
      return { tripPlan: null };
    }
  }

  // Voice response optimization
  optimizeForVoice(text) {
    // Remove excessive punctuation and formatting for better TTS
    let voiceText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting
      .replace(/`(.*?)`/g, '$1') // Remove code formatting
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with just text
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Add natural pauses for better speech flow
    voiceText = voiceText
      .replace(/\. /g, '. ... ') // Add pause after sentences
      .replace(/: /g, ': ... ') // Add pause after colons
      .replace(/; /g, '; ... '); // Add pause after semicolons

    return voiceText;
  }

  // Get conversation summary
  getConversationSummary(userId) {
    const memory = this.getUserMemory(userId);
    
    return {
      conversationId: memory.conversationId,
      messageCount: memory.messageCount,
      topTopics: memory.topics.slice(-10),
      userPreferences: memory.preferences,
      lastInteraction: memory.lastInteraction,
      discoveredEntities: memory.entities
    };
  }

  // Clear user memory (for privacy)
  clearUserMemory(userId) {
    this.conversationMemory.delete(userId);
    return { success: true, message: 'Conversation memory cleared' };
  }
}

module.exports = new AICompanionService();