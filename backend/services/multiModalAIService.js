const OpenAI = require('openai');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Multi-Modal Session Schema
const MultiModalSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, unique: true, required: true },
  messages: [{
    id: String,
    type: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    modality: { type: String, enum: ['text', 'voice', 'image', 'document'], default: 'text' },
    timestamp: { type: Date, default: Date.now },
    metadata: {
      confidence: Number,
      processingTime: Number,
      recognized: Boolean,
      entities: [{
        type: String,
        value: String,
        confidence: Number,
        position: {
          x: Number,
          y: Number,
          width: Number,
          height: Number
        }
      }]
    },
    attachments: [{
      type: { type: String, enum: ['image', 'document', 'audio'] },
      url: String,
      name: String,
      size: Number,
      mimeType: String,
      analysis: mongoose.Schema.Types.Mixed
    }]
  }],
  context: {
    currentLocation: {
      latitude: Number,
      longitude: Number,
      address: String,
      country: String,
      timezone: String
    },
    travelPreferences: {
      budget: String,
      interests: [String],
      travelStyle: String,
      groupSize: Number,
      accessibility: [String]
    },
    activeTrip: {
      destination: String,
      startDate: Date,
      endDate: Date,
      status: String
    }
  },
  settings: {
    language: { type: String, default: 'en' },
    voiceEnabled: { type: Boolean, default: true },
    autoListen: { type: Boolean, default: false },
    imageAnalysis: { type: Boolean, default: true },
    documentOCR: { type: Boolean, default: true },
    realTimeTranslation: { type: Boolean, default: false },
    privacy: { type: String, enum: ['strict', 'balanced', 'permissive'], default: 'balanced' }
  },
  analytics: {
    totalMessages: { type: Number, default: 0 },
    modalityUsage: {
      text: { type: Number, default: 0 },
      voice: { type: Number, default: 0 },
      image: { type: Number, default: 0 },
      document: { type: Number, default: 0 }
    },
    averageResponseTime: { type: Number, default: 0 },
    satisfactionScore: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Document Analysis Schema
const DocumentAnalysisSchema = new mongoose.Schema({
  documentId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFile: {
    name: String,
    size: Number,
    mimeType: String,
    url: String
  },
  analysis: {
    documentType: { 
      type: String, 
      enum: ['passport', 'visa', 'ticket', 'boarding_pass', 'hotel_confirmation', 'receipt', 'menu', 'map', 'brochure', 'unknown'],
      default: 'unknown'
    },
    confidence: { type: Number, min: 0, max: 1 },
    extractedText: { type: String, default: '' },
    language: { type: String, default: 'unknown' },
    entities: [{
      type: { type: String, required: true }, // name, date, location, price, flight_number, etc.
      value: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1 },
      position: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      }
    }],
    structuredData: mongoose.Schema.Types.Mixed, // Parsed structured information
    suggestions: [String], // AI-generated suggestions based on document
    actionableItems: [{
      action: String, // "add_to_calendar", "set_reminder", "save_contact", etc.
      description: String,
      data: mongoose.Schema.Types.Mixed
    }]
  },
  processingStatus: {
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    startTime: Date,
    endTime: Date,
    errorMessage: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Image Analysis Schema
const ImageAnalysisSchema = new mongoose.Schema({
  imageId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalFile: {
    name: String,
    size: Number,
    mimeType: String,
    url: String,
    dimensions: {
      width: Number,
      height: Number
    }
  },
  analysis: {
    landmarks: [{
      name: String,
      confidence: Number,
      location: {
        latitude: Number,
        longitude: Number,
        address: String,
        country: String
      },
      description: String,
      category: String, // monument, building, natural, etc.
      historicalInfo: String,
      visitingInfo: {
        bestTimeToVisit: String,
        ticketInfo: String,
        nearbyAttractions: [String]
      }
    }],
    objects: [{
      name: String,
      confidence: Number,
      category: String,
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      }
    }],
    text: { type: String, default: '' }, // OCR extracted text
    faces: [{
      boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
      },
      emotions: mongoose.Schema.Types.Mixed,
      age: Number,
      gender: String
    }],
    scene: {
      description: String,
      categories: [String],
      weather: String,
      timeOfDay: String,
      season: String
    },
    colors: [{
      color: String,
      percentage: Number,
      hex: String
    }],
    travelContext: {
      destination: String,
      activity: String,
      recommendations: [String],
      safetyInfo: [String]
    }
  },
  processingStatus: {
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    startTime: Date,
    endTime: Date,
    errorMessage: String
  },
  createdAt: { type: Date, default: Date.now }
});

// Voice Interaction Schema
const VoiceInteractionSchema = new mongoose.Schema({
  interactionId: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: String,
  audio: {
    originalFile: {
      name: String,
      size: Number,
      duration: Number, // in seconds
      url: String
    },
    transcript: String,
    language: String,
    confidence: Number
  },
  processing: {
    intent: String,
    entities: [{
      type: String,
      value: String,
      confidence: Number
    }],
    sentiment: {
      overall: String, // positive, negative, neutral
      confidence: Number,
      emotions: mongoose.Schema.Types.Mixed
    },
    context: {
      previousMessages: Number,
      topicContinuation: Boolean,
      clarificationNeeded: Boolean
    }
  },
  response: {
    textResponse: String,
    speechFile: String, // URL to generated speech file
    speechDuration: Number,
    voiceSettings: {
      voice: String,
      speed: Number,
      pitch: Number,
      volume: Number
    }
  },
  metadata: {
    processingTime: Number,
    quality: String, // high, medium, low
    backgroundNoise: Boolean,
    multiSpeaker: Boolean
  },
  createdAt: { type: Date, default: Date.now }
});

// Create models
const MultiModalSession = mongoose.models.MultiModalSession || mongoose.model('MultiModalSession', MultiModalSessionSchema);
const DocumentAnalysis = mongoose.models.DocumentAnalysis || mongoose.model('DocumentAnalysis', DocumentAnalysisSchema);
const ImageAnalysis = mongoose.models.ImageAnalysis || mongoose.model('ImageAnalysis', ImageAnalysisSchema);
const VoiceInteraction = mongoose.models.VoiceInteraction || mongoose.model('VoiceInteraction', VoiceInteractionSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/multimodal');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp3|wav|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

class MultiModalAIService {
  // Initialize or get user session
  async initializeSession(userId, sessionId = null) {
    try {
      if (!sessionId) {
        sessionId = this.generateSessionId();
      }

      let session = await MultiModalSession.findOne({ userId, sessionId });
      
      if (!session) {
        session = new MultiModalSession({
          userId,
          sessionId,
          messages: [],
          context: {
            currentLocation: {},
            travelPreferences: {},
            activeTrip: {}
          },
          settings: {
            language: 'en',
            voiceEnabled: true,
            autoListen: false,
            imageAnalysis: true,
            documentOCR: true,
            realTimeTranslation: false,
            privacy: 'balanced'
          },
          analytics: {
            totalMessages: 0,
            modalityUsage: { text: 0, voice: 0, image: 0, document: 0 },
            averageResponseTime: 0,
            satisfactionScore: 0,
            lastActiveAt: new Date()
          }
        });

        await session.save();
      }

      return session;
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error;
    }
  }

  // Process multi-modal input
  async processMultiModalInput(userId, sessionId, input) {
    try {
      const session = await this.initializeSession(userId, sessionId);
      const startTime = Date.now();

      let response = {
        content: '',
        confidence: 0,
        processingTime: 0,
        entities: [],
        suggestions: []
      };

      // Determine processing based on modality
      switch (input.modality) {
        case 'image':
          response = await this.processImageInput(userId, input);
          break;
        case 'document':
          response = await this.processDocumentInput(userId, input);
          break;
        case 'voice':
          response = await this.processVoiceInput(userId, sessionId, input);
          break;
        default:
          response = await this.processTextInput(userId, sessionId, input);
      }

      // Add processing time
      response.processingTime = Date.now() - startTime;

      // Save message to session
      await this.saveMessageToSession(session, input, response);

      // Update analytics
      await this.updateSessionAnalytics(session, input.modality, response.processingTime);

      return response;

    } catch (error) {
      console.error('Error processing multi-modal input:', error);
      throw error;
    }
  }

  // Process image input with comprehensive analysis
  async processImageInput(userId, input) {
    try {
      const imageId = this.generateId();
      
      // Create image analysis record
      const imageAnalysis = new ImageAnalysis({
        imageId,
        userId,
        originalFile: {
          name: input.file?.name || 'camera-capture.jpg',
          size: input.file?.size || 0,
          mimeType: input.file?.mimeType || 'image/jpeg',
          url: input.file?.url || '',
          dimensions: { width: 1280, height: 720 }
        },
        processingStatus: {
          status: 'processing',
          startTime: new Date()
        }
      });

      await imageAnalysis.save();

      // Analyze image with OpenAI Vision
      const visionAnalysis = await this.analyzeImageWithAI(input.file?.url || input.content);
      
      // Detect landmarks and objects
      const landmarks = await this.detectLandmarks(input.file?.url);
      const objects = await this.detectObjects(input.file?.url);
      const extractedText = await this.extractTextFromImage(input.file?.url);

      // Update analysis with results
      imageAnalysis.analysis = {
        landmarks,
        objects,
        text: extractedText,
        scene: visionAnalysis.scene,
        colors: visionAnalysis.colors,
        travelContext: visionAnalysis.travelContext
      };

      imageAnalysis.processingStatus.status = 'completed';
      imageAnalysis.processingStatus.endTime = new Date();
      await imageAnalysis.save();

      // Generate comprehensive response
      const response = this.generateImageAnalysisResponse(imageAnalysis.analysis);

      return {
        content: response,
        confidence: 0.92,
        entities: this.extractEntitiesFromImageAnalysis(imageAnalysis.analysis),
        suggestions: this.generateImageSuggestions(imageAnalysis.analysis)
      };

    } catch (error) {
      console.error('Error processing image input:', error);
      throw error;
    }
  }

  // Analyze image using OpenAI Vision API
  async analyzeImageWithAI(imageUrl) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this travel image and provide detailed information:
                1. Identify landmarks, buildings, or points of interest
                2. Describe the scene, weather, and time of day
                3. Suggest travel activities or recommendations
                4. Identify any text or signs visible
                5. Provide cultural or historical context if applicable
                
                Format response as JSON with: landmarks, scene, activities, text, context`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content || '{}');

    } catch (error) {
      console.error('Error analyzing image with AI:', error);
      return {
        landmarks: [],
        scene: { description: 'Unable to analyze image', categories: [] },
        activities: [],
        text: '',
        context: ''
      };
    }
  }

  // Process document input with OCR and understanding
  async processDocumentInput(userId, input) {
    try {
      const documentId = this.generateId();
      
      // Create document analysis record
      const documentAnalysis = new DocumentAnalysis({
        documentId,
        userId,
        originalFile: {
          name: input.file?.name || 'document.pdf',
          size: input.file?.size || 0,
          mimeType: input.file?.mimeType || 'application/pdf',
          url: input.file?.url || ''
        },
        processingStatus: {
          status: 'processing',
          startTime: new Date()
        }
      });

      await documentAnalysis.save();

      // Extract text and analyze document
      const extractedText = await this.extractTextFromDocument(input.file?.url);
      const documentType = await this.classifyDocument(extractedText);
      const entities = await this.extractDocumentEntities(extractedText);
      const structuredData = await this.parseStructuredData(extractedText, documentType);

      // Update analysis with results
      documentAnalysis.analysis = {
        documentType: documentType.type,
        confidence: documentType.confidence,
        extractedText,
        language: 'en', // Could be detected
        entities,
        structuredData,
        suggestions: await this.generateDocumentSuggestions(documentType.type, structuredData),
        actionableItems: await this.generateActionableItems(documentType.type, entities)
      };

      documentAnalysis.processingStatus.status = 'completed';
      documentAnalysis.processingStatus.endTime = new Date();
      await documentAnalysis.save();

      // Generate comprehensive response
      const response = this.generateDocumentAnalysisResponse(documentAnalysis.analysis);

      return {
        content: response,
        confidence: documentAnalysis.analysis.confidence,
        entities: entities,
        suggestions: documentAnalysis.analysis.suggestions
      };

    } catch (error) {
      console.error('Error processing document input:', error);
      throw error;
    }
  }

  // Process voice input with speech recognition and NLU
  async processVoiceInput(userId, sessionId, input) {
    try {
      const interactionId = this.generateId();
      
      // Create voice interaction record
      const voiceInteraction = new VoiceInteraction({
        interactionId,
        userId,
        sessionId,
        audio: {
          originalFile: {
            name: input.file?.name || 'voice-input.wav',
            size: input.file?.size || 0,
            duration: input.duration || 0,
            url: input.file?.url || ''
          },
          transcript: input.transcript || input.content,
          language: 'en',
          confidence: input.confidence || 0.85
        }
      });

      await voiceInteraction.save();

      // Process natural language understanding
      const nluResults = await this.processNaturalLanguageUnderstanding(input.content || input.transcript);
      
      // Update interaction with processing results
      voiceInteraction.processing = {
        intent: nluResults.intent,
        entities: nluResults.entities,
        sentiment: nluResults.sentiment,
        context: nluResults.context
      };

      // Generate response based on intent
      const textResponse = await this.generateIntentBasedResponse(nluResults, userId);
      
      voiceInteraction.response = {
        textResponse,
        speechFile: '', // Would be URL to generated audio
        speechDuration: 0,
        voiceSettings: {
          voice: 'neutral',
          speed: 1.0,
          pitch: 1.0,
          volume: 1.0
        }
      };

      await voiceInteraction.save();

      return {
        content: textResponse,
        confidence: input.confidence || 0.85,
        entities: nluResults.entities,
        suggestions: await this.generateVoiceSuggestions(nluResults)
      };

    } catch (error) {
      console.error('Error processing voice input:', error);
      throw error;
    }
  }

  // Process natural language understanding
  async processNaturalLanguageUnderstanding(text) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a travel assistant NLU system. Analyze the user input and extract:
            1. Intent (travel_planning, booking, information, navigation, etc.)
            2. Entities (destinations, dates, budget, preferences, etc.)
            3. Sentiment (positive, negative, neutral)
            4. Context (continuation, clarification_needed, etc.)
            
            Return JSON format with: intent, entities, sentiment, context`
          },
          {
            role: "user",
            content: text
          }
        ],
        max_tokens: 500
      });

      return JSON.parse(response.choices[0].message.content || '{}');

    } catch (error) {
      console.error('Error in NLU processing:', error);
      return {
        intent: 'general',
        entities: [],
        sentiment: { overall: 'neutral', confidence: 0.5 },
        context: { clarificationNeeded: false }
      };
    }
  }

  // Generate intent-based response
  async generateIntentBasedResponse(nluResults, userId) {
    try {
      let prompt = `Based on the user's travel intent "${nluResults.intent}" and entities: ${JSON.stringify(nluResults.entities)}, generate a helpful travel assistant response.`;

      if (nluResults.intent === 'travel_planning') {
        prompt += ' Focus on itinerary planning, destinations, and recommendations.';
      } else if (nluResults.intent === 'booking') {
        prompt += ' Focus on flight, hotel, and activity booking assistance.';
      } else if (nluResults.intent === 'information') {
        prompt += ' Provide informative travel guidance and tips.';
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful travel assistant. Provide comprehensive, actionable travel advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800
      });

      return response.choices[0].message.content;

    } catch (error) {
      console.error('Error generating intent-based response:', error);
      return 'I understand your travel needs. Let me help you with comprehensive travel planning and recommendations.';
    }
  }

  // Process text input with enhanced understanding
  async processTextInput(userId, sessionId, input) {
    try {
      // Get session context for better understanding
      const session = await MultiModalSession.findOne({ userId, sessionId });
      const context = session ? this.buildConversationContext(session.messages) : '';

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an advanced multi-modal travel AI assistant with comprehensive travel intelligence. 
            
            You have access to:
            - Real-time travel data and recommendations
            - Image and document analysis capabilities
            - Voice interaction and natural language processing
            - Personalized travel planning and optimization
            - Social travel network and community insights
            - Predictive analytics for travel trends
            
            Provide helpful, detailed, and actionable travel assistance. Consider the conversation context: ${context}`
          },
          {
            role: "user",
            content: input.content
          }
        ],
        max_tokens: 1000
      });

      // Extract entities from the response
      const entities = await this.extractEntitiesFromText(input.content);

      return {
        content: response.choices[0].message.content,
        confidence: 0.88,
        entities,
        suggestions: await this.generateTextSuggestions(input.content, entities)
      };

    } catch (error) {
      console.error('Error processing text input:', error);
      throw error;
    }
  }

  // Helper methods
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  generateId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async saveMessageToSession(session, input, response) {
    const userMessage = {
      id: this.generateId(),
      type: 'user',
      content: input.content,
      modality: input.modality,
      timestamp: new Date(),
      attachments: input.attachments || []
    };

    const assistantMessage = {
      id: this.generateId(),
      type: 'assistant',
      content: response.content,
      modality: 'text',
      timestamp: new Date(),
      metadata: {
        confidence: response.confidence,
        processingTime: response.processingTime,
        entities: response.entities
      }
    };

    session.messages.push(userMessage, assistantMessage);
    session.analytics.totalMessages += 2;
    session.analytics.modalityUsage[input.modality] += 1;
    session.analytics.lastActiveAt = new Date();
    session.updatedAt = new Date();

    await session.save();
  }

  async updateSessionAnalytics(session, modality, processingTime) {
    const totalResponses = session.analytics.totalMessages / 2;
    const currentAvg = session.analytics.averageResponseTime;
    const newAvg = (currentAvg * (totalResponses - 1) + processingTime) / totalResponses;
    
    session.analytics.averageResponseTime = newAvg;
    await session.save();
  }

  buildConversationContext(messages) {
    return messages.slice(-6).map(m => `${m.type}: ${m.content}`).join('\n');
  }

  async extractEntitiesFromText(text) {
    // Simplified entity extraction - in production, use more sophisticated NER
    const entities = [];
    
    // Travel-related entity patterns
    const patterns = [
      { type: 'destination', regex: /(?:to|in|visiting|travel to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g },
      { type: 'date', regex: /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{1,2}-\d{1,2}-\d{4}\b/g },
      { type: 'budget', regex: /\$\d+(?:,\d{3})*(?:\.\d{2})?/g },
      { type: 'duration', regex: /\b\d+\s+(?:days?|weeks?|months?)\b/g }
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        entities.push({
          type: pattern.type,
          value: match[1] || match[0],
          confidence: 0.8
        });
      }
    });

    return entities;
  }

  // Mock implementations for advanced features
  async detectLandmarks(imageUrl) {
    const landmarks = [
      'Eiffel Tower', 'Big Ben', 'Statue of Liberty', 'Sydney Opera House',
      'Taj Mahal', 'Great Wall of China', 'Machu Picchu', 'Colosseum'
    ];
    
    return [{
      name: landmarks[Math.floor(Math.random() * landmarks.length)],
      confidence: 0.85 + Math.random() * 0.15,
      location: { latitude: 48.8584, longitude: 2.2945 },
      description: 'Historic landmark with cultural significance'
    }];
  }

  async detectObjects(imageUrl) {
    return [
      { name: 'building', confidence: 0.92, category: 'architecture' },
      { name: 'person', confidence: 0.78, category: 'human' },
      { name: 'sky', confidence: 0.95, category: 'nature' }
    ];
  }

  async extractTextFromImage(imageUrl) {
    return 'Welcome to Paris • Open Daily 9-6 • €15 Entry Fee';
  }

  async extractTextFromDocument(documentUrl) {
    return 'BOARDING PASS\nFlight: AA123\nFrom: JFK - New York\nTo: LAX - Los Angeles\nDate: 2025-12-15\nSeat: 14A\nGate: B12';
  }

  async classifyDocument(text) {
    if (text.includes('BOARDING PASS') || text.includes('FLIGHT')) {
      return { type: 'boarding_pass', confidence: 0.95 };
    } else if (text.includes('VISA') || text.includes('PASSPORT')) {
      return { type: 'visa', confidence: 0.90 };
    } else if (text.includes('HOTEL') || text.includes('RESERVATION')) {
      return { type: 'hotel_confirmation', confidence: 0.88 };
    }
    return { type: 'unknown', confidence: 0.5 };
  }

  async extractDocumentEntities(text) {
    return [
      { type: 'flight_number', value: 'AA123', confidence: 0.95 },
      { type: 'date', value: '2025-12-15', confidence: 0.92 },
      { type: 'seat', value: '14A', confidence: 0.88 }
    ];
  }

  async parseStructuredData(text, documentType) {
    return {
      flightNumber: 'AA123',
      departure: { airport: 'JFK', city: 'New York', time: '10:30' },
      arrival: { airport: 'LAX', city: 'Los Angeles', time: '13:45' },
      passenger: { seat: '14A', gate: 'B12' }
    };
  }

  generateImageAnalysisResponse(analysis) {
    return `🖼️ **Image Analysis Complete**

**Landmark Detected:** ${analysis.landmarks[0]?.name || 'Unknown location'}
**Confidence:** ${Math.round((analysis.landmarks[0]?.confidence || 0.8) * 100)}%

**Scene Description:**
${analysis.scene?.description || 'Beautiful travel destination with architectural and cultural significance'}

**Travel Recommendations:**
• Best visited during morning hours for optimal lighting
• Consider guided tours for historical context
• Check local weather conditions before visiting
• Nearby attractions and dining options available

**Smart Suggestions:**
• "Tell me more about this landmark"
• "Find nearby restaurants"
• "What's the best time to visit?"
• "Show me similar places"`;
  }

  generateDocumentAnalysisResponse(analysis) {
    return `📄 **Document Analysis Complete**

**Document Type:** ${analysis.documentType.toUpperCase()}
**Extraction Accuracy:** ${Math.round(analysis.confidence * 100)}%

**Key Information Extracted:**
${analysis.extractedText}

**Smart Actions Available:**
• Add to travel calendar
• Set reminder notifications  
• Save to trip documents
• Share with travel companions

**Next Steps:**
• "Add this to my itinerary"
• "Set a reminder for this flight"
• "Find hotel near destination"`;
  }

  async generateImageSuggestions(analysis) {
    return [
      'Get more information about this landmark',
      'Find nearby restaurants and attractions',
      'Check opening hours and ticket prices',
      'Get directions and transportation options'
    ];
  }

  async generateDocumentSuggestions(documentType, structuredData) {
    return [
      'Add to travel calendar',
      'Set boarding reminder',
      'Find airport information',
      'Check flight status'
    ];
  }

  async generateTextSuggestions(content, entities) {
    return [
      'Plan a detailed itinerary',
      'Find flights and accommodations',
      'Check weather conditions',
      'Get local recommendations'
    ];
  }

  async generateVoiceSuggestions(nluResults) {
    return [
      'Continue with voice commands',
      'Ask for more specific details',
      'Request visual information',
      'Get personalized recommendations'
    ];
  }

  async generateActionableItems(documentType, entities) {
    return [
      {
        action: 'add_to_calendar',
        description: 'Add flight to travel calendar',
        data: { type: 'flight', details: entities }
      }
    ];
  }

  extractEntitiesFromImageAnalysis(analysis) {
    return [
      ...(analysis.landmarks?.map(l => ({ type: 'landmark', value: l.name, confidence: l.confidence })) || []),
      ...(analysis.objects?.map(o => ({ type: 'object', value: o.name, confidence: o.confidence })) || [])
    ];
  }
}

module.exports = {
  MultiModalAIService: new MultiModalAIService(),
  upload
};