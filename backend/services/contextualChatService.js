const mongoose = require('mongoose');

// Conversation Memory Schema for LangChain-style memory
const conversationMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  conversationSummary: {
    shortTerm: { type: String, default: '' }, // Last few exchanges
    mediumTerm: { type: String, default: '' }, // Session summary
    longTerm: { type: String, default: '' }, // User profile summary
  },
  keyTopics: [{
    topic: String,
    importance: { type: Number, min: 0, max: 1 },
    mentions: Number,
    lastMentioned: { type: Date, default: Date.now }
  }],
  userPreferences: {
    destinations: [String],
    activities: [String],
    budgetRange: { min: Number, max: Number },
    travelStyle: String,
    groupPreference: String
  },
  contextHistory: [{
    context: { type: String, enum: ['solo', 'family', 'couple', 'group', 'business'] },
    frequency: Number,
    lastUsed: { type: Date, default: Date.now }
  }],
  messageHistory: [{
    message: String,
    response: String,
    context: String,
    timestamp: { type: Date, default: Date.now },
    topics: [String],
    sentiment: String,
    importance: { type: Number, min: 0, max: 1 }
  }],
  lastUpdated: { type: Date, default: Date.now },
  conversationStats: {
    totalMessages: { type: Number, default: 0 },
    avgSessionLength: Number,
    preferredResponseStyle: String,
    commonQuestions: [String]
  }
});

// Context Templates for different travel modes
const contextTemplateSchema = new mongoose.Schema({
  contextType: { 
    type: String, 
    enum: ['solo', 'family', 'couple', 'group', 'business'],
    required: true,
    unique: true
  },
  systemPrompt: { type: String, required: true },
  responseStyle: {
    tone: { type: String, enum: ['friendly', 'professional', 'enthusiastic', 'calm'] },
    length: { type: String, enum: ['concise', 'detailed', 'comprehensive'] },
    focusAreas: [String],
    avoidTopics: [String]
  },
  suggestedQuestions: [String],
  conversationStarters: [String],
  commonConcerns: [String],
  recommendationFilters: {
    priceRange: { min: Number, max: Number },
    ageAppropriate: Boolean,
    groupSize: { min: Number, max: Number },
    safetyLevel: { type: String, enum: ['low', 'medium', 'high'] }
  }
});

const ConversationMemory = mongoose.models.ConversationMemory || mongoose.model('ConversationMemory', conversationMemorySchema);
const ContextTemplate = mongoose.models.ContextTemplate || mongoose.model('ContextTemplate', contextTemplateSchema);

class ContextualChatService {
  constructor() {
    this.initializeContextTemplates();
  }

  // Initialize default context templates
  async initializeContextTemplates() {
    try {
      const existingTemplates = await ContextTemplate.countDocuments();
      if (existingTemplates === 0) {
        await this.createDefaultTemplates();
      }
    } catch (error) {
      console.error('Error initializing context templates:', error);
    }
  }

  // Create default context templates
  async createDefaultTemplates() {
    const templates = [
      {
        contextType: 'solo',
        systemPrompt: `You are an AI travel companion for solo travelers. Focus on safety, independence, personal growth, and unique experiences. Emphasize solo-friendly activities, safety tips, meeting other travelers, and building confidence. Be encouraging and supportive while being practical about solo travel challenges.`,
        responseStyle: {
          tone: 'friendly',
          length: 'detailed',
          focusAreas: ['safety', 'independence', 'personal_growth', 'solo_activities', 'meeting_people'],
          avoidTopics: ['romantic_activities', 'large_group_requirements']
        },
        suggestedQuestions: [
          "What are the safest solo travel destinations for beginners?",
          "How can I meet other travelers while traveling alone?",
          "What safety precautions should I take as a solo traveler?",
          "Which activities are best for solo travelers?",
          "How do I overcome loneliness while traveling alone?"
        ],
        conversationStarters: [
          "Planning your first solo adventure? I can help you choose the perfect destination!",
          "Solo travel can be incredibly rewarding - let's find experiences that match your comfort level.",
          "Looking to step out of your comfort zone? I have some amazing solo travel ideas."
        ],
        commonConcerns: ['safety', 'loneliness', 'navigation', 'language_barriers', 'emergency_situations'],
        recommendationFilters: {
          priceRange: { min: 50, max: 300 },
          ageAppropriate: false,
          groupSize: { min: 1, max: 1 },
          safetyLevel: 'high'
        }
      },
      {
        contextType: 'family',
        systemPrompt: `You are an AI travel companion for families. Focus on family-friendly activities, safety for children, educational experiences, and creating lasting memories. Consider different age groups, attention spans, and family dynamics. Emphasize practicality, convenience, and activities that everyone can enjoy together.`,
        responseStyle: {
          tone: 'enthusiastic',
          length: 'comprehensive',
          focusAreas: ['family_activities', 'child_safety', 'educational_value', 'convenience', 'group_accommodation'],
          avoidTopics: ['adult_only_activities', 'late_night_entertainment', 'extreme_sports']
        },
        suggestedQuestions: [
          "What are the best family-friendly destinations?",
          "How do I keep kids entertained during long flights?",
          "What safety considerations should I have when traveling with children?",
          "Which activities are suitable for different age groups?",
          "How do I plan a trip that everyone in the family will enjoy?"
        ],
        conversationStarters: [
          "Planning a family adventure? Let's find destinations that will create magical memories for everyone!",
          "Family travel can be amazing with the right planning - I'll help you make it smooth and fun.",
          "Looking for activities the whole family will love? I have some fantastic suggestions!"
        ],
        commonConcerns: ['child_safety', 'entertainment', 'logistics', 'budget_for_multiple_people', 'accommodation_space'],
        recommendationFilters: {
          priceRange: { min: 100, max: 500 },
          ageAppropriate: true,
          groupSize: { min: 3, max: 8 },
          safetyLevel: 'high'
        }
      },
      {
        contextType: 'couple',
        systemPrompt: `You are an AI travel companion for couples. Focus on romantic experiences, intimate settings, shared adventures, and relationship bonding. Suggest romantic activities, couple-friendly accommodations, and experiences that strengthen relationships. Balance adventure with relaxation and consider both partners' interests.`,
        responseStyle: {
          tone: 'calm',
          length: 'detailed',
          focusAreas: ['romance', 'intimacy', 'shared_experiences', 'relationship_bonding', 'private_moments'],
          avoidTopics: ['large_group_activities', 'family_focused_content', 'solo_adventures']
        },
        suggestedQuestions: [
          "What are the most romantic destinations for couples?",
          "How do we plan a surprise trip for my partner?",
          "What unique couple activities can we try while traveling?",
          "Which destinations are perfect for honeymoons or anniversaries?",
          "How do we balance adventure and relaxation on a couple's trip?"
        ],
        conversationStarters: [
          "Planning a romantic getaway? I'll help you create unforgettable moments together!",
          "Looking to surprise your partner? Let's plan something truly special.",
          "Couple's travel is about connection - let me suggest experiences you'll both treasure."
        ],
        commonConcerns: ['romance', 'privacy', 'shared_interests', 'surprise_planning', 'intimate_experiences'],
        recommendationFilters: {
          priceRange: { min: 150, max: 600 },
          ageAppropriate: false,
          groupSize: { min: 2, max: 2 },
          safetyLevel: 'medium'
        }
      },
      {
        contextType: 'group',
        systemPrompt: `You are an AI travel companion for group travel. Focus on coordination, group activities, shared accommodations, and logistics management. Consider group dynamics, varying interests, budget coordination, and activities that work for multiple people. Emphasize planning tools and communication strategies.`,
        responseStyle: {
          tone: 'professional',
          length: 'comprehensive',
          focusAreas: ['coordination', 'group_activities', 'logistics', 'budget_management', 'communication'],
          avoidTopics: ['intimate_experiences', 'solo_activities', 'couple_focused_content']
        },
        suggestedQuestions: [
          "How do we coordinate travel plans for a large group?",
          "What are the best group accommodation options?",
          "How do we split travel expenses fairly among group members?",
          "Which activities work well for groups of different sizes?",
          "How do we handle different preferences within the group?"
        ],
        conversationStarters: [
          "Group travel planning? I'll help you coordinate everything smoothly!",
          "Managing a group trip can be complex - let me simplify the process for you.",
          "Group adventures are amazing with proper planning - let's get organized!"
        ],
        commonConcerns: ['coordination', 'budget_splitting', 'varying_preferences', 'logistics', 'group_accommodation'],
        recommendationFilters: {
          priceRange: { min: 80, max: 400 },
          ageAppropriate: false,
          groupSize: { min: 4, max: 15 },
          safetyLevel: 'medium'
        }
      },
      {
        contextType: 'business',
        systemPrompt: `You are an AI travel companion for business travelers. Focus on efficiency, productivity, professional accommodations, and networking opportunities. Consider time constraints, business requirements, expense management, and opportunities to blend business with leisure. Emphasize practical solutions and professional services.`,
        responseStyle: {
          tone: 'professional',
          length: 'concise',
          focusAreas: ['efficiency', 'productivity', 'networking', 'expense_management', 'professional_services'],
          avoidTopics: ['leisure_focused_activities', 'romantic_content', 'family_activities']
        },
        suggestedQuestions: [
          "How do I maximize productivity during business travel?",
          "What are the best business-friendly hotels and amenities?",
          "How can I network effectively while traveling for business?",
          "What tools help manage business travel expenses?",
          "How do I blend business travel with some leisure time?"
        ],
        conversationStarters: [
          "Business travel doesn't have to be stressful - let me optimize your trip!",
          "Traveling for work? I'll help you stay productive and maybe add some enjoyment too.",
          "Professional travel made easy - let's focus on efficiency and success."
        ],
        commonConcerns: ['time_efficiency', 'expense_management', 'productivity', 'professional_image', 'work_life_balance'],
        recommendationFilters: {
          priceRange: { min: 200, max: 800 },
          ageAppropriate: false,
          groupSize: { min: 1, max: 3 },
          safetyLevel: 'medium'
        }
      }
    ];

    await ContextTemplate.insertMany(templates);
    console.log('Default context templates created successfully');
  }

  // Get or create conversation memory
  async getConversationMemory(userId, sessionId) {
    try {
      let memory = await ConversationMemory.findOne({ userId, sessionId });
      
      if (!memory) {
        memory = new ConversationMemory({
          userId,
          sessionId,
          conversationSummary: {
            shortTerm: '',
            mediumTerm: '',
            longTerm: ''
          },
          keyTopics: [],
          userPreferences: {
            destinations: [],
            activities: [],
            budgetRange: {},
            travelStyle: '',
            groupPreference: ''
          },
          contextHistory: [],
          messageHistory: [],
          conversationStats: {
            totalMessages: 0,
            avgSessionLength: 0,
            preferredResponseStyle: '',
            commonQuestions: []
          }
        });
        await memory.save();
      }

      return memory;
    } catch (error) {
      console.error('Error getting conversation memory:', error);
      throw error;
    }
  }

  // Update conversation memory with new message
  async updateConversationMemory(userId, sessionId, message, response, context, topics = []) {
    try {
      const memory = await this.getConversationMemory(userId, sessionId);

      // Add message to history
      const messageEntry = {
        message,
        response,
        context,
        timestamp: new Date(),
        topics,
        sentiment: await this.analyzeSentiment(message),
        importance: this.calculateMessageImportance(message, topics)
      };

      memory.messageHistory.push(messageEntry);
      memory.conversationStats.totalMessages += 1;

      // Update key topics
      await this.updateKeyTopics(memory, topics);

      // Update context history
      await this.updateContextHistory(memory, context);

      // Update conversation summaries
      await this.updateConversationSummaries(memory);

      // Update user preferences
      await this.updateUserPreferences(memory, message, topics);

      memory.lastUpdated = new Date();
      await memory.save();

      return memory;
    } catch (error) {
      console.error('Error updating conversation memory:', error);
      throw error;
    }
  }

  // Generate contextual response
  async generateContextualResponse(userId, message, context, sessionId) {
    try {
      // Get conversation memory
      const memory = await this.getConversationMemory(userId, sessionId);
      
      // Get context template
      const template = await ContextTemplate.findOne({ contextType: context });
      
      // Extract topics from message
      const topics = await this.extractTopics(message);
      
      // Build contextual prompt
      const contextualPrompt = await this.buildContextualPrompt(
        template, 
        memory, 
        message, 
        context
      );

      // Generate response using AI (OpenAI integration)
      const response = await this.generateAIResponse(contextualPrompt, message);

      // Update memory
      await this.updateConversationMemory(
        userId, 
        sessionId, 
        message, 
        response.content, 
        context, 
        topics
      );

      return {
        response: response.content,
        suggestions: await this.generateContextualSuggestions(template, memory, topics),
        conversationContext: {
          totalMessages: memory.conversationStats.totalMessages + 1,
          keyTopics: memory.keyTopics.slice(0, 5),
          preferredContext: this.getPreferredContext(memory),
          memoryConfidence: this.calculateMemoryConfidence(memory)
        }
      };

    } catch (error) {
      console.error('Error generating contextual response:', error);
      throw error;
    }
  }

  // Build contextual prompt
  async buildContextualPrompt(template, memory, message, context) {
    let prompt = template.systemPrompt + '\n\n';

    // Add conversation history context
    if (memory.conversationSummary.longTerm) {
      prompt += `User Background: ${memory.conversationSummary.longTerm}\n\n`;
    }

    if (memory.conversationSummary.mediumTerm) {
      prompt += `Session Context: ${memory.conversationSummary.mediumTerm}\n\n`;
    }

    // Add user preferences
    if (memory.userPreferences.destinations.length > 0) {
      prompt += `User's Preferred Destinations: ${memory.userPreferences.destinations.join(', ')}\n`;
    }

    if (memory.userPreferences.activities.length > 0) {
      prompt += `User's Preferred Activities: ${memory.userPreferences.activities.join(', ')}\n`;
    }

    if (memory.userPreferences.travelStyle) {
      prompt += `User's Travel Style: ${memory.userPreferences.travelStyle}\n`;
    }

    // Add recent conversation context
    const recentMessages = memory.messageHistory.slice(-3);
    if (recentMessages.length > 0) {
      prompt += '\nRecent Conversation:\n';
      recentMessages.forEach(msg => {
        prompt += `User: ${msg.message}\nAssistant: ${msg.response}\n`;
      });
    }

    // Add response style guidance
    prompt += `\nResponse Style:
- Tone: ${template.responseStyle.tone}
- Length: ${template.responseStyle.length}
- Focus on: ${template.responseStyle.focusAreas.join(', ')}
- Avoid: ${template.responseStyle.avoidTopics.join(', ')}\n`;

    // Add context-specific guidance
    prompt += `\nCurrent Context: ${context} travel mode
Remember to tailor your response specifically for ${context} travelers.\n`;

    prompt += `\nUser's Current Message: "${message}"\n`;
    prompt += `\nProvide a helpful, contextual response that builds on previous conversations and matches the ${context} travel context:`;

    return prompt;
  }

  // Generate AI response using OpenAI
  async generateAIResponse(prompt, message) {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return {
        content: completion.choices[0].message.content,
        usage: completion.usage
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      return {
        content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
        usage: null
      };
    }
  }

  // Extract topics from message
  async extractTopics(message) {
    const commonTopics = [
      'destination', 'activity', 'budget', 'accommodation', 'food', 'transport',
      'safety', 'weather', 'culture', 'adventure', 'relaxation', 'family',
      'romance', 'business', 'solo', 'group', 'planning', 'booking'
    ];

    const messageLower = message.toLowerCase();
    const extractedTopics = commonTopics.filter(topic => 
      messageLower.includes(topic) || messageLower.includes(topic + 's')
    );

    return extractedTopics;
  }

  // Analyze sentiment of message
  async analyzeSentiment(message) {
    // Simple sentiment analysis - could be enhanced with ML models
    const positiveWords = ['great', 'amazing', 'love', 'excited', 'wonderful', 'fantastic'];
    const negativeWords = ['bad', 'terrible', 'hate', 'worried', 'concerned', 'difficult'];

    const messageLower = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => messageLower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => messageLower.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  // Calculate message importance
  calculateMessageImportance(message, topics) {
    let importance = 0.5; // Base importance

    // Questions are more important
    if (message.includes('?')) importance += 0.2;

    // Messages with specific topics are more important
    importance += topics.length * 0.1;

    // Booking or planning related messages are high importance
    const highImportanceKeywords = ['book', 'plan', 'reserve', 'budget', 'decide'];
    const hasHighImportanceKeyword = highImportanceKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    if (hasHighImportanceKeyword) importance += 0.3;

    return Math.min(importance, 1.0);
  }

  // Update key topics
  async updateKeyTopics(memory, newTopics) {
    newTopics.forEach(topic => {
      const existingTopic = memory.keyTopics.find(kt => kt.topic === topic);
      
      if (existingTopic) {
        existingTopic.mentions += 1;
        existingTopic.lastMentioned = new Date();
        existingTopic.importance = Math.min(existingTopic.importance + 0.1, 1.0);
      } else {
        memory.keyTopics.push({
          topic,
          importance: 0.3,
          mentions: 1,
          lastMentioned: new Date()
        });
      }
    });

    // Sort by importance and keep top 20
    memory.keyTopics.sort((a, b) => b.importance - a.importance);
    memory.keyTopics = memory.keyTopics.slice(0, 20);
  }

  // Update context history
  async updateContextHistory(memory, context) {
    const existingContext = memory.contextHistory.find(ch => ch.context === context);
    
    if (existingContext) {
      existingContext.frequency += 1;
      existingContext.lastUsed = new Date();
    } else {
      memory.contextHistory.push({
        context,
        frequency: 1,
        lastUsed: new Date()
      });
    }

    // Sort by frequency
    memory.contextHistory.sort((a, b) => b.frequency - a.frequency);
  }

  // Update conversation summaries
  async updateConversationSummaries(memory) {
    const recentMessages = memory.messageHistory.slice(-5);
    
    // Update short-term summary (last 5 messages)
    if (recentMessages.length > 0) {
      const shortTermTopics = [...new Set(recentMessages.flatMap(msg => msg.topics))];
      memory.conversationSummary.shortTerm = `Recent discussion about: ${shortTermTopics.join(', ')}`;
    }

    // Update medium-term summary (session summary)
    const sessionTopics = [...new Set(memory.messageHistory.flatMap(msg => msg.topics))];
    const topSessionTopics = sessionTopics.slice(0, 10);
    memory.conversationSummary.mediumTerm = `Session topics: ${topSessionTopics.join(', ')}`;

    // Update long-term summary (user profile)
    const topTopics = memory.keyTopics.slice(0, 5).map(kt => kt.topic);
    const preferredContext = this.getPreferredContext(memory);
    memory.conversationSummary.longTerm = `User primarily interested in ${topTopics.join(', ')} and prefers ${preferredContext} travel`;
  }

  // Update user preferences based on conversation
  async updateUserPreferences(memory, message, topics) {
    const messageLower = message.toLowerCase();

    // Extract destinations mentioned
    const destinations = this.extractDestinations(messageLower);
    destinations.forEach(dest => {
      if (!memory.userPreferences.destinations.includes(dest)) {
        memory.userPreferences.destinations.push(dest);
      }
    });

    // Extract activities mentioned
    const activities = this.extractActivities(messageLower);
    activities.forEach(activity => {
      if (!memory.userPreferences.activities.includes(activity)) {
        memory.userPreferences.activities.push(activity);
      }
    });

    // Extract budget information
    const budgetInfo = this.extractBudgetInfo(messageLower);
    if (budgetInfo) {
      memory.userPreferences.budgetRange = budgetInfo;
    }

    // Determine travel style
    const travelStyle = this.determineTravelStyle(messageLower, topics);
    if (travelStyle && travelStyle !== memory.userPreferences.travelStyle) {
      memory.userPreferences.travelStyle = travelStyle;
    }

    // Keep arrays manageable
    memory.userPreferences.destinations = memory.userPreferences.destinations.slice(-10);
    memory.userPreferences.activities = memory.userPreferences.activities.slice(-15);
  }

  // Generate contextual suggestions
  async generateContextualSuggestions(template, memory, topics) {
    const suggestions = [];

    // Add template suggestions
    suggestions.push(...template.suggestedQuestions.slice(0, 2));

    // Add memory-based suggestions
    const topTopics = memory.keyTopics.slice(0, 3);
    topTopics.forEach(topic => {
      suggestions.push(`Tell me more about ${topic.topic} options`);
    });

    // Add preference-based suggestions
    if (memory.userPreferences.destinations.length > 0) {
      const recentDest = memory.userPreferences.destinations.slice(-1)[0];
      suggestions.push(`Plan activities for ${recentDest}`);
    }

    return [...new Set(suggestions)].slice(0, 4);
  }

  // Helper methods
  getPreferredContext(memory) {
    if (memory.contextHistory.length === 0) return 'general';
    return memory.contextHistory[0].context;
  }

  calculateMemoryConfidence(memory) {
    const messageCount = memory.conversationStats.totalMessages;
    const topicCount = memory.keyTopics.length;
    const preferenceCount = memory.userPreferences.destinations.length + 
                          memory.userPreferences.activities.length;

    const confidence = Math.min(
      (messageCount / 20) * 0.4 +
      (topicCount / 10) * 0.3 +
      (preferenceCount / 15) * 0.3,
      1.0
    );

    return confidence;
  }

  extractDestinations(message) {
    const destinations = ['paris', 'london', 'tokyo', 'new york', 'rome', 'barcelona', 'thailand', 'bali', 'iceland', 'norway'];
    return destinations.filter(dest => message.includes(dest));
  }

  extractActivities(message) {
    const activities = ['hiking', 'beach', 'museum', 'food', 'shopping', 'nightlife', 'adventure', 'culture', 'relaxation', 'sports'];
    return activities.filter(activity => message.includes(activity));
  }

  extractBudgetInfo(message) {
    const budgetMatch = message.match(/\$?(\d+).*budget|budget.*\$?(\d+)/i);
    if (budgetMatch) {
      const amount = parseInt(budgetMatch[1] || budgetMatch[2]);
      return { min: amount * 0.8, max: amount * 1.2 };
    }
    
    if (message.includes('budget') || message.includes('cheap')) {
      return { min: 20, max: 100 };
    }
    if (message.includes('luxury') || message.includes('expensive')) {
      return { min: 200, max: 1000 };
    }
    
    return null;
  }

  determineTravelStyle(message, topics) {
    if (message.includes('adventure') || message.includes('extreme')) return 'adventurous';
    if (message.includes('relax') || message.includes('peaceful')) return 'relaxed';
    if (message.includes('culture') || message.includes('history')) return 'cultural';
    if (message.includes('luxury') || message.includes('high-end')) return 'luxury';
    if (message.includes('budget') || message.includes('cheap')) return 'budget';
    
    return null;
  }
}

module.exports = {
  ContextualChatService,
  ConversationMemory,
  ContextTemplate
};