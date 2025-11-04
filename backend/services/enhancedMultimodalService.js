const OpenAI = require('openai');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced Voice Processing Service for Travel Planning
class EnhancedVoiceService {
  // Process audio using OpenAI Whisper for travel planning
  async transcribeAudioForTravel(audioBuffer, language = 'en') {
    try {
      // Save audio buffer to temporary file
      const tempFilePath = path.join(__dirname, '../uploads/temp', `travel_audio_${Date.now()}.webm`);
      await fs.writeFile(tempFilePath, audioBuffer);

      // Transcribe using Whisper with travel context
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: language,
        response_format: 'verbose_json',
        prompt: "This is a travel planning conversation about destinations, hotels, flights, activities, and trip planning."
      });

      // Clean up temp file
      await fs.unlink(tempFilePath).catch(console.error);

      // Extract travel-specific entities from transcription
      const travelEntities = await this.extractTravelEntities(transcription.text);

      return {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        words: transcription.words || [],
        segments: transcription.segments || [],
        confidence: this.calculateTranscriptionConfidence(transcription),
        travelEntities: travelEntities,
        intent: await this.analyzeTravelIntent(transcription.text)
      };
    } catch (error) {
      console.error('Error transcribing travel audio:', error);
      throw new Error('Travel audio transcription failed: ' + error.message);
    }
  }

  // Generate natural travel-focused speech
  async generateTravelSpeech(text, options = {}) {
    try {
      const voice = options.voice || 'alloy'; // alloy, echo, fable, onyx, nova, shimmer
      const speed = options.speed || 1.0;

      const mp3 = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: voice,
        input: text,
        speed: speed,
        response_format: 'mp3'
      });

      const audioBuffer = Buffer.from(await mp3.arrayBuffer());
      
      // Save to file and return URL
      const audioFileName = `travel_speech_${Date.now()}.mp3`;
      const audioFilePath = path.join(__dirname, '../uploads/audio', audioFileName);
      await fs.writeFile(audioFilePath, audioBuffer);

      return {
        audioUrl: `/api/multimodal/audio/${audioFileName}`,
        duration: this.estimateAudioDuration(text),
        voice: voice,
        speed: speed,
        text: text
      };
    } catch (error) {
      console.error('Error generating travel speech:', error);
      throw new Error('Travel speech generation failed: ' + error.message);
    }
  }

  // Voice-controlled trip planning
  async processVoiceTripPlanning(transcription, userPreferences = {}) {
    try {
      const prompt = `
        You are a voice-controlled travel AI assistant. Analyze this voice command and create a comprehensive travel plan.
        
        Voice Input: "${transcription.text}"
        Detected Travel Entities: ${JSON.stringify(transcription.travelEntities)}
        Travel Intent: ${JSON.stringify(transcription.intent)}
        User Preferences: ${JSON.stringify(userPreferences)}
        
        Create a detailed response that includes:
        1. Interpreted travel request
        2. Suggested destinations (if not specified)
        3. Recommended duration and timing
        4. Budget estimates
        5. Activity suggestions
        6. Accommodation recommendations
        7. Follow-up questions for clarification
        8. Voice-optimized summary (2-3 sentences for speech synthesis)
        
        Respond in JSON format with practical, actionable travel advice.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 1000,
      });

      const travelPlan = JSON.parse(completion.choices[0].message.content);
      
      return {
        originalTranscription: transcription,
        interpretedRequest: travelPlan.interpretedRequest,
        travelPlan: travelPlan,
        voiceSummary: travelPlan.voiceSummary,
        followUpQuestions: travelPlan.followUpQuestions,
        confidence: transcription.confidence,
        processingTime: Date.now()
      };
    } catch (error) {
      console.error('Error processing voice trip planning:', error);
      throw new Error('Voice trip planning failed: ' + error.message);
    }
  }

  // Extract travel-specific entities from text
  async extractTravelEntities(text) {
    const travelEntities = {
      destinations: [],
      dates: [],
      budgets: [],
      activities: [],
      accommodations: [],
      transportation: [],
      travelers: []
    };

    // Travel destination patterns
    const destinationPatterns = [
      /(?:to|visit|go to|traveling to|trip to)\s+([A-Z][a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/g,
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:vacation|trip|travel|visit)/g
    ];

    destinationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const destination = match[1].trim();
        if (destination.length > 2) {
          travelEntities.destinations.push(destination);
        }
      }
    });

    // Date patterns
    const datePatterns = [
      /\b(?:next|this)\s+(week|month|year|weekend|summer|winter|spring|fall)\b/g,
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g
    ];

    datePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        travelEntities.dates.push(match[0]);
      }
    });

    // Budget patterns
    const budgetPatterns = [
      /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
      /budget\s+of\s+(\d+)/g,
      /spend\s+(?:about|around)?\s*\$?(\d+)/g
    ];

    budgetPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        travelEntities.budgets.push(match[0]);
      }
    });

    // Activity patterns
    const activityKeywords = [
      'hiking', 'swimming', 'skiing', 'surfing', 'shopping', 'sightseeing',
      'museums', 'restaurants', 'nightlife', 'beaches', 'mountains',
      'adventure', 'relaxation', 'cultural', 'historical', 'nature'
    ];

    activityKeywords.forEach(activity => {
      if (text.toLowerCase().includes(activity)) {
        travelEntities.activities.push(activity);
      }
    });

    // Accommodation patterns
    const accommodationKeywords = [
      'hotel', 'resort', 'airbnb', 'hostel', 'bed and breakfast',
      'camping', 'villa', 'apartment', 'luxury', 'budget'
    ];

    accommodationKeywords.forEach(accommodation => {
      if (text.toLowerCase().includes(accommodation)) {
        travelEntities.accommodations.push(accommodation);
      }
    });

    // Transportation patterns
    const transportationKeywords = [
      'flight', 'plane', 'car', 'train', 'bus', 'cruise', 'driving', 'flying'
    ];

    transportationKeywords.forEach(transport => {
      if (text.toLowerCase().includes(transport)) {
        travelEntities.transportation.push(transport);
      }
    });

    // Traveler count patterns
    const travelerPatterns = [
      /(\d+)\s+people/g,
      /party\s+of\s+(\d+)/g,
      /(solo|alone|by myself)/g,
      /(couple|two people|my partner and I)/g,
      /(family|kids|children)/g
    ];

    travelerPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        travelEntities.travelers.push(match[1] || match[0]);
      }
    });

    return travelEntities;
  }

  // Analyze travel intent from voice input
  async analyzeTravelIntent(text) {
    const intents = {
      planTrip: /plan.*trip|planning.*vacation|want to travel|travel plans/i,
      searchDestination: /where.*go|destination|recommend.*place|suggest.*location/i,
      bookFlight: /book.*flight|find.*flight|flight.*booking|plane.*ticket/i,
      findHotel: /find.*hotel|book.*hotel|accommodation|place to stay/i,
      getWeather: /weather|temperature|climate|forecast/i,
      budgetPlanning: /budget|cost|price|how much|expensive|cheap/i,
      activitySearch: /activity|things to do|attractions|entertainment/i,
      travelAdvice: /advice|tips|recommend|suggest|help|guidance/i
    };

    const detectedIntents = [];
    
    Object.entries(intents).forEach(([intent, pattern]) => {
      if (pattern.test(text)) {
        detectedIntents.push(intent);
      }
    });

    return {
      primary: detectedIntents[0] || 'general',
      all: detectedIntents,
      confidence: detectedIntents.length > 0 ? 0.8 : 0.3
    };
  }

  // Calculate transcription confidence
  calculateTranscriptionConfidence(transcription) {
    if (!transcription.words || transcription.words.length === 0) {
      return 0.6; // Default confidence for basic transcription
    }

    // Calculate based on word confidence scores
    const wordConfidences = transcription.words
      .map(word => word.confidence || 0.8)
      .filter(conf => conf > 0);

    if (wordConfidences.length === 0) {
      return 0.7;
    }

    const avgConfidence = wordConfidences.reduce((sum, conf) => sum + conf, 0) / wordConfidences.length;
    
    // Boost confidence for travel-related words
    const travelWords = ['travel', 'trip', 'vacation', 'hotel', 'flight', 'destination'];
    const hasTravelWords = travelWords.some(word => 
      transcription.text.toLowerCase().includes(word)
    );

    return hasTravelWords ? Math.min(avgConfidence + 0.1, 1.0) : avgConfidence;
  }

  // Estimate audio duration
  estimateAudioDuration(text) {
    const wordsPerMinute = 150; // Average speaking rate
    const wordCount = text.split(' ').length;
    return Math.max((wordCount / wordsPerMinute) * 60, 1);
  }
}

// Enhanced Image-Based Destination Discovery
class ImageDestinationDiscovery {
  // Discover destinations from uploaded images
  async discoverDestinationsFromImage(imageBuffer) {
    try {
      // Analyze image with OpenAI Vision
      const imageAnalysis = await this.analyzeDestinationImage(imageBuffer);
      
      // Extract location clues and features
      const locationFeatures = await this.extractLocationFeatures(imageAnalysis);
      
      // Find matching destinations
      const matchingDestinations = await this.findMatchingDestinations(locationFeatures);
      
      // Generate trip suggestions based on image
      const tripSuggestions = await this.generateImageBasedTripSuggestions(
        matchingDestinations, 
        imageAnalysis
      );

      return {
        imageAnalysis,
        locationFeatures,
        matchingDestinations,
        tripSuggestions,
        confidence: imageAnalysis.confidence || 0.7
      };
    } catch (error) {
      console.error('Error discovering destinations from image:', error);
      throw new Error('Image destination discovery failed: ' + error.message);
    }
  }

  // Analyze destination image with OpenAI Vision
  async analyzeDestinationImage(imageBuffer) {
    try {
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this travel destination image as a travel expert. Provide detailed information about:

1. Location Type & Setting:
   - Geographic features (beach, mountains, city, countryside, etc.)
   - Climate indicators (tropical, temperate, arid, etc.)
   - Season and time of day clues

2. Architectural & Cultural Clues:
   - Building styles and architecture
   - Cultural markers and symbols
   - Language visible in signs
   - Local customs or dress visible

3. Tourist & Travel Elements:
   - Tourist activities visible
   - Accommodation types nearby
   - Transportation options
   - Crowd levels and tourism development

4. Identification Attempts:
   - Possible country or region
   - Similar famous destinations
   - Landmark recognition if applicable

5. Travel Recommendations:
   - Best time to visit
   - Recommended activities
   - Target traveler types
   - Budget level suggestions

Please provide a comprehensive JSON response with confidence scores for each identification.`
              },
              {
                type: "image_url",
                image_url: { 
                  url: dataUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      return {
        ...analysis,
        confidence: this.calculateImageAnalysisConfidence(analysis),
        analysisTimestamp: new Date().toISOString(),
        modelUsed: 'gpt-4-vision-preview'
      };
    } catch (error) {
      console.error('Error analyzing destination image:', error);
      throw new Error('Image analysis failed: ' + error.message);
    }
  }

  // Extract searchable location features
  async extractLocationFeatures(imageAnalysis) {
    return {
      primaryType: imageAnalysis.locationType || 'unknown',
      climate: imageAnalysis.climate || 'temperate',
      setting: imageAnalysis.setting || 'mixed',
      architecturalStyle: imageAnalysis.architecturalStyle || 'modern',
      activities: imageAnalysis.activities || [],
      culturalMarkers: imageAnalysis.culturalMarkers || [],
      landmarks: imageAnalysis.landmarks || [],
      estimatedRegion: imageAnalysis.estimatedRegion || null,
      timeOfYear: imageAnalysis.timeOfYear || null,
      developmentLevel: imageAnalysis.developmentLevel || 'medium',
      searchKeywords: this.generateSearchKeywords(imageAnalysis)
    };
  }

  // Generate search keywords from analysis
  generateSearchKeywords(analysis) {
    const keywords = [];
    
    if (analysis.locationType) keywords.push(analysis.locationType);
    if (analysis.climate) keywords.push(analysis.climate);
    if (analysis.activities) keywords.push(...analysis.activities);
    if (analysis.culturalMarkers) keywords.push(...analysis.culturalMarkers);
    if (analysis.architecturalStyle) keywords.push(analysis.architecturalStyle);
    
    return [...new Set(keywords)].filter(keyword => keyword && keyword !== 'unknown');
  }

  // Find destinations matching image features
  async findMatchingDestinations(locationFeatures) {
    try {
      const prompt = `
        Based on these visual features from a travel destination image, suggest 8-10 real travel destinations that match these characteristics:

        Primary Type: ${locationFeatures.primaryType}
        Climate: ${locationFeatures.climate}
        Setting: ${locationFeatures.setting}
        Architectural Style: ${locationFeatures.architecturalStyle}
        Activities: ${locationFeatures.activities.join(', ')}
        Cultural Markers: ${locationFeatures.culturalMarkers.join(', ')}
        Estimated Region: ${locationFeatures.estimatedRegion || 'unknown'}
        Development Level: ${locationFeatures.developmentLevel}

        For each destination, provide:
        - Destination name and country
        - Similarity score (0.0-1.0)
        - Matching features explanation
        - Best time to visit
        - Approximate budget level (budget/mid-range/luxury)
        - Main attractions and activities
        - Travel accessibility
        - Unique selling points

        Return as a JSON array of destinations, sorted by similarity score.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
      });

      const destinations = JSON.parse(completion.choices[0].message.content);
      
      return destinations
        .sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0))
        .slice(0, 8);
    } catch (error) {
      console.error('Error finding matching destinations:', error);
      return [];
    }
  }

  // Generate trip suggestions based on image analysis
  async generateImageBasedTripSuggestions(destinations, imageAnalysis) {
    return Promise.all(destinations.slice(0, 3).map(async (destination) => {
      try {
        const prompt = `
          Create a detailed trip suggestion for ${destination.name}, ${destination.country} based on this image analysis:

          Image Analysis: ${JSON.stringify(imageAnalysis, null, 2)}
          Destination Info: ${JSON.stringify(destination, null, 2)}

          Generate a comprehensive trip plan including:
          1. Trip duration recommendations (3-day, 1-week, 2-week options)
          2. Detailed daily itinerary suggestions
          3. Budget breakdown by category
          4. Accommodation recommendations matching the style seen in image
          5. Activities that match what's visible/implied in the image
          6. Transportation options
          7. Local experiences and cultural activities
          8. Photography spots similar to the image
          9. Seasonal considerations
          10. Packing recommendations

          Return detailed, practical suggestions in JSON format.
        `;

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 1200,
        });

        const tripSuggestion = JSON.parse(completion.choices[0].message.content);
        
        return {
          destination,
          tripPlan: tripSuggestion,
          imageMatch: true,
          similarity: destination.similarityScore,
          generated: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Error generating trip suggestion for ${destination.name}:`, error);
        return {
          destination,
          tripPlan: { error: 'Generation failed', basic: destination },
          imageMatch: false,
          similarity: destination.similarityScore
        };
      }
    }));
  }

  // Calculate image analysis confidence
  calculateImageAnalysisConfidence(analysis) {
    let confidence = 0.4; // Base confidence

    // Increase confidence based on detail level
    if (analysis.locationType && analysis.locationType !== 'unknown') confidence += 0.15;
    if (analysis.estimatedRegion && analysis.estimatedRegion !== 'unknown') confidence += 0.15;
    if (analysis.landmarks && analysis.landmarks.length > 0) confidence += 0.1;
    if (analysis.culturalMarkers && analysis.culturalMarkers.length > 0) confidence += 0.1;
    if (analysis.activities && analysis.activities.length > 0) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }
}

// Complete Enhanced Multimodal Trip Planner
class EnhancedMultimodalTripPlanner {
  constructor() {
    this.voiceService = new EnhancedVoiceService();
    this.imageService = new ImageDestinationDiscovery();
  }

  // Voice-only trip planning
  async planTripByVoice(audioBuffer, userPreferences = {}) {
    try {
      const startTime = Date.now();

      // Transcribe and analyze voice input
      const transcription = await this.voiceService.transcribeAudioForTravel(audioBuffer);
      
      // Process for trip planning
      const tripPlanning = await this.voiceService.processVoiceTripPlanning(
        transcription, 
        userPreferences
      );

      // Generate voice response
      const voiceResponse = await this.voiceService.generateTravelSpeech(
        tripPlanning.voiceSummary,
        { voice: userPreferences.preferredVoice }
      );

      return {
        inputType: 'voice',
        transcription,
        tripPlanning,
        voiceResponse,
        processingTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      console.error('Error in voice trip planning:', error);
      throw new Error('Voice trip planning failed: ' + error.message);
    }
  }

  // Image-only trip planning
  async planTripByImage(imageBuffer, preferences = {}) {
    try {
      const startTime = Date.now();

      // Discover destinations from image
      const destinationDiscovery = await this.imageService.discoverDestinationsFromImage(imageBuffer);

      return {
        inputType: 'image',
        destinationDiscovery,
        processingTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      console.error('Error in image trip planning:', error);
      throw new Error('Image trip planning failed: ' + error.message);
    }
  }

  // Combined voice + image trip planning
  async planTripMultimodal(inputs) {
    try {
      const startTime = Date.now();
      const results = {};

      // Process voice input if provided
      if (inputs.audioBuffer) {
        results.voiceResults = await this.planTripByVoice(
          inputs.audioBuffer, 
          inputs.userPreferences
        );
      }

      // Process image input if provided
      if (inputs.imageBuffer) {
        results.imageResults = await this.planTripByImage(
          inputs.imageBuffer, 
          inputs.preferences
        );
      }

      // Synthesize results if both inputs provided
      if (results.voiceResults && results.imageResults) {
        results.synthesizedPlan = await this.synthesizeVoiceImagePlan(
          results.voiceResults,
          results.imageResults,
          inputs.userPreferences
        );
      }

      return {
        inputTypes: Object.keys(inputs).filter(key => inputs[key]),
        results,
        totalProcessingTime: Date.now() - startTime,
        success: true
      };
    } catch (error) {
      console.error('Error in multimodal trip planning:', error);
      throw new Error('Multimodal trip planning failed: ' + error.message);
    }
  }

  // Synthesize voice and image planning results
  async synthesizeVoiceImagePlan(voiceResults, imageResults, userPreferences) {
    try {
      const prompt = `
        Synthesize these voice and image-based travel planning results into a cohesive, personalized trip plan:

        VOICE INPUT ANALYSIS:
        Transcription: "${voiceResults.transcription.text}"
        Travel Entities: ${JSON.stringify(voiceResults.transcription.travelEntities)}
        Travel Intent: ${JSON.stringify(voiceResults.transcription.intent)}
        Voice Trip Plan: ${JSON.stringify(voiceResults.tripPlanning.travelPlan)}

        IMAGE INPUT ANALYSIS:
        Image Features: ${JSON.stringify(imageResults.destinationDiscovery.locationFeatures)}
        Matching Destinations: ${JSON.stringify(imageResults.destinationDiscovery.matchingDestinations)}
        Trip Suggestions: ${JSON.stringify(imageResults.destinationDiscovery.tripSuggestions)}

        USER PREFERENCES:
        ${JSON.stringify(userPreferences)}

        Create a unified trip plan that:
        1. Reconciles voice requests with image-inspired destinations
        2. Prioritizes destinations that match both voice intent and image style
        3. Combines budget preferences from voice with destination costs from image analysis
        4. Merges activity preferences from both sources
        5. Provides a comprehensive itinerary that satisfies both inputs
        6. Explains how the voice input influenced the image-based recommendations
        7. Offers alternatives if voice and image preferences conflict

        Return a detailed, actionable trip plan in JSON format.
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const synthesizedPlan = JSON.parse(completion.choices[0].message.content);

      // Generate voice summary of synthesized plan
      const voiceSummary = await this.voiceService.generateTravelSpeech(
        synthesizedPlan.voiceSummary || "I've combined your voice request with the destination style from your image to create a personalized trip plan.",
        { voice: userPreferences.preferredVoice }
      );

      return {
        synthesizedPlan,
        voiceSummary,
        confidenceScore: this.calculateSynthesisConfidence(voiceResults, imageResults),
        synthesizedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error synthesizing voice and image plans:', error);
      return {
        error: 'Synthesis failed',
        fallback: 'Please review individual voice and image results',
        voiceResults: voiceResults.tripPlanning,
        imageResults: imageResults.destinationDiscovery
      };
    }
  }

  // Calculate synthesis confidence
  calculateSynthesisConfidence(voiceResults, imageResults) {
    const voiceConfidence = voiceResults.transcription.confidence || 0.5;
    const imageConfidence = imageResults.destinationDiscovery.confidence || 0.5;
    
    // Weighted average with slight bonus for multimodal input
    return Math.min((voiceConfidence * 0.5 + imageConfidence * 0.5) + 0.1, 1.0);
  }
}

module.exports = {
  EnhancedVoiceService,
  ImageDestinationDiscovery,
  EnhancedMultimodalTripPlanner
};