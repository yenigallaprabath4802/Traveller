const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIMoodStoryService {
  constructor() {
    this.moodCache = new Map();
    this.storyCache = new Map();
    this.memoryCache = new Map();

    // Mood categories and their descriptors
    this.moodCategories = {
      adventurous: {
        keywords: ['exciting', 'thrilling', 'bold', 'daring', 'exploration'],
        colors: ['#FF6B35', '#F7931E', '#FFD23F'],
        storyThemes: ['discovery', 'challenge', 'breakthrough', 'conquest'],
        emotionalTone: 'energetic and bold'
      },
      peaceful: {
        keywords: ['calm', 'serene', 'tranquil', 'relaxing', 'mindful'],
        colors: ['#4CAF50', '#81C784', '#A5D6A7'],
        storyThemes: ['reflection', 'harmony', 'balance', 'inner peace'],
        emotionalTone: 'gentle and contemplative'
      },
      excited: {
        keywords: ['enthusiastic', 'joyful', 'energetic', 'vibrant', 'euphoric'],
        colors: ['#FF5722', '#FF9800', '#FFC107'],
        storyThemes: ['celebration', 'achievement', 'surprise', 'wonder'],
        emotionalTone: 'upbeat and enthusiastic'
      },
      nostalgic: {
        keywords: ['reminiscent', 'wistful', 'sentimental', 'reflective', 'bittersweet'],
        colors: ['#9C27B0', '#673AB7', '#3F51B5'],
        storyThemes: ['memory', 'connection', 'heritage', 'timelessness'],
        emotionalTone: 'warm and reflective'
      },
      grateful: {
        keywords: ['thankful', 'appreciative', 'blessed', 'content', 'fulfilled'],
        colors: ['#2196F3', '#03A9F4', '#00BCD4'],
        storyThemes: ['gratitude', 'abundance', 'connection', 'appreciation'],
        emotionalTone: 'heartfelt and sincere'
      },
      curious: {
        keywords: ['inquisitive', 'wondering', 'exploring', 'learning', 'discovering'],
        colors: ['#607D8B', '#795548', '#8BC34A'],
        storyThemes: ['mystery', 'learning', 'culture', 'understanding'],
        emotionalTone: 'thoughtful and inquisitive'
      },
      inspired: {
        keywords: ['motivated', 'uplifted', 'creative', 'enlightened', 'empowered'],
        colors: ['#E91E63', '#9C27B0', '#673AB7'],
        storyThemes: ['transformation', 'growth', 'inspiration', 'creativity'],
        emotionalTone: 'uplifting and motivational'
      },
      contemplative: {
        keywords: ['thoughtful', 'meditative', 'introspective', 'philosophical', 'deep'],
        colors: ['#37474F', '#455A64', '#546E7A'],
        storyThemes: ['wisdom', 'insight', 'understanding', 'depth'],
        emotionalTone: 'profound and thoughtful'
      }
    };

    // Story generation templates
    this.storyTemplates = {
      travel_journal: {
        structure: ['setting', 'experience', 'challenge', 'insight', 'resolution'],
        style: 'personal and descriptive',
        length: 'medium'
      },
      adventure_tale: {
        structure: ['departure', 'journey', 'climax', 'transformation', 'return'],
        style: 'narrative and engaging',
        length: 'long'
      },
      memory_snapshot: {
        structure: ['moment', 'sensory_details', 'emotions', 'significance'],
        style: 'poetic and evocative',
        length: 'short'
      },
      cultural_reflection: {
        structure: ['observation', 'interaction', 'learning', 'perspective_change'],
        style: 'analytical and thoughtful',
        length: 'medium'
      },
      gratitude_letter: {
        structure: ['appreciation', 'specific_moments', 'impact', 'future_intentions'],
        style: 'heartfelt and sincere',
        length: 'medium'
      }
    };

    // Sentiment analysis patterns
    this.sentimentPatterns = {
      positive: {
        words: ['amazing', 'beautiful', 'wonderful', 'incredible', 'fantastic', 'perfect', 'love', 'joy'],
        intensity_multipliers: { 'very': 1.5, 'extremely': 2.0, 'absolutely': 1.8, 'completely': 1.7 }
      },
      negative: {
        words: ['disappointing', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'sad', 'frustrated'],
        intensity_multipliers: { 'very': 1.5, 'extremely': 2.0, 'absolutely': 1.8, 'completely': 1.7 }
      },
      neutral: {
        words: ['okay', 'fine', 'normal', 'average', 'standard', 'typical', 'regular', 'decent']
      }
    };
  }

  // Analyze mood from travel experience input
  async analyzeMood(experienceData) {
    try {
      const cacheKey = this.generateMoodCacheKey(experienceData);
      
      if (this.moodCache.has(cacheKey)) {
        return this.moodCache.get(cacheKey);
      }

      // Perform sentiment analysis
      const sentimentAnalysis = this.performSentimentAnalysis(experienceData.text || experienceData.description);
      
      // Use AI to determine mood
      const moodAnalysis = await this.performAIMoodAnalysis(experienceData);
      
      // Combine AI analysis with sentiment analysis
      const combinedAnalysis = this.combineMoodAnalyses(sentimentAnalysis, moodAnalysis);
      
      // Generate mood insights
      const moodInsights = await this.generateMoodInsights(combinedAnalysis, experienceData);

      const result = {
        primaryMood: combinedAnalysis.primaryMood,
        secondaryMoods: combinedAnalysis.secondaryMoods,
        sentiment: sentimentAnalysis,
        confidence: combinedAnalysis.confidence,
        emotionalIntensity: combinedAnalysis.intensity,
        insights: moodInsights,
        recommendations: await this.generateMoodBasedRecommendations(combinedAnalysis),
        moodJourney: this.trackMoodJourney(combinedAnalysis, experienceData.userId)
      };

      // Cache result
      this.moodCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error analyzing mood:', error);
      throw new Error('Failed to analyze mood');
    }
  }

  // Perform AI-powered mood analysis
  async performAIMoodAnalysis(experienceData) {
    try {
      const prompt = `Analyze the emotional mood and sentiment of this travel experience:

Experience: ${experienceData.text || experienceData.description}
Location: ${experienceData.location || 'Unknown'}
Activity: ${experienceData.activity || 'General travel'}
Context: ${experienceData.context || ''}

Analyze the emotional tone and categorize the primary mood. Consider:
1. Overall emotional state
2. Intensity of emotions
3. Secondary emotional undertones
4. Cultural or travel-specific emotional aspects

Available mood categories: ${Object.keys(this.moodCategories).join(', ')}

Provide analysis in JSON format:
{
  "primaryMood": "category",
  "secondaryMoods": ["category1", "category2"],
  "confidence": 0.85,
  "intensity": 0.75,
  "emotionalNuances": ["nuance1", "nuance2"],
  "reasoning": "explanation of mood determination"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in emotional analysis and psychology, specializing in travel experiences and mood detection."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('AI mood analysis error:', error);
      // Return fallback analysis
      return {
        primaryMood: 'curious',
        secondaryMoods: ['grateful'],
        confidence: 0.5,
        intensity: 0.6,
        emotionalNuances: ['travel excitement'],
        reasoning: 'Default analysis due to processing error'
      };
    }
  }

  // Perform basic sentiment analysis
  performSentimentAnalysis(text) {
    if (!text) return { score: 0, magnitude: 0, label: 'neutral' };

    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    words.forEach(word => {
      // Check for intensity multipliers
      const nextWordIndex = words.indexOf(word) + 1;
      const intensifier = nextWordIndex < words.length ? words[nextWordIndex] : null;
      let multiplier = 1;

      if (intensifier && this.sentimentPatterns.positive.intensity_multipliers[intensifier]) {
        multiplier = this.sentimentPatterns.positive.intensity_multipliers[intensifier];
      }

      // Score words
      if (this.sentimentPatterns.positive.words.includes(word)) {
        positiveScore += 1 * multiplier;
      } else if (this.sentimentPatterns.negative.words.includes(word)) {
        negativeScore += 1 * multiplier;
      } else if (this.sentimentPatterns.neutral.words.includes(word)) {
        neutralScore += 1;
      }
    });

    const totalScore = positiveScore - negativeScore;
    const magnitude = Math.abs(totalScore) + neutralScore;
    const normalizedScore = totalScore / Math.max(1, words.length);

    let label = 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    else if (normalizedScore < -0.1) label = 'negative';

    return {
      score: normalizedScore,
      magnitude: magnitude / words.length,
      label,
      breakdown: { positive: positiveScore, negative: negativeScore, neutral: neutralScore }
    };
  }

  // Combine different mood analyses
  combineMoodAnalyses(sentimentAnalysis, aiAnalysis) {
    // Weight AI analysis more heavily but consider sentiment
    let primaryMood = aiAnalysis.primaryMood;
    
    // Adjust mood based on sentiment if there's strong contradiction
    if (sentimentAnalysis.label === 'negative' && aiAnalysis.confidence < 0.7) {
      if (['excited', 'grateful', 'inspired'].includes(primaryMood)) {
        primaryMood = 'contemplative';
      }
    }

    return {
      primaryMood,
      secondaryMoods: aiAnalysis.secondaryMoods || [],
      confidence: Math.min(aiAnalysis.confidence, sentimentAnalysis.magnitude),
      intensity: (aiAnalysis.intensity + Math.abs(sentimentAnalysis.score)) / 2,
      emotionalNuances: aiAnalysis.emotionalNuances || [],
      reasoning: aiAnalysis.reasoning
    };
  }

  // Generate personalized story
  async generatePersonalizedStory(storyData) {
    try {
      const cacheKey = this.generateStoryCacheKey(storyData);
      
      if (this.storyCache.has(cacheKey)) {
        return this.storyCache.get(cacheKey);
      }

      // Analyze mood if not provided
      let moodAnalysis = storyData.moodAnalysis;
      if (!moodAnalysis) {
        moodAnalysis = await this.analyzeMood(storyData);
      }

      // Select appropriate story template
      const template = this.selectStoryTemplate(storyData.storyType, moodAnalysis);
      
      // Generate story using AI
      const generatedStory = await this.generateAIStory(storyData, moodAnalysis, template);
      
      // Enhance story with multimedia suggestions
      const multimediaEnhancements = await this.generateMultimediaEnhancements(generatedStory, storyData);
      
      // Create memory connections
      const memoryConnections = await this.createMemoryConnections(generatedStory, storyData);

      const result = {
        story: generatedStory,
        metadata: {
          mood: moodAnalysis.primaryMood,
          template: template.type,
          length: generatedStory.split(' ').length,
          readingTime: Math.ceil(generatedStory.split(' ').length / 200), // words per minute
          emotionalTone: this.moodCategories[moodAnalysis.primaryMood]?.emotionalTone
        },
        enhancements: multimediaEnhancements,
        memoryConnections,
        recommendations: await this.generateStoryRecommendations(generatedStory, moodAnalysis),
        reflectionPrompts: this.generateReflectionPrompts(moodAnalysis, storyData)
      };

      // Cache result
      this.storyCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error generating story:', error);
      throw new Error('Failed to generate personalized story');
    }
  }

  // Generate AI-powered story
  async generateAIStory(storyData, moodAnalysis, template) {
    try {
      const moodInfo = this.moodCategories[moodAnalysis.primaryMood];
      
      const prompt = `Create a personalized travel story based on this experience:

Experience Details:
- Location: ${storyData.location}
- Activity: ${storyData.activity || 'Travel experience'}
- Date: ${storyData.date || 'Recent'}
- Personal notes: ${storyData.notes || storyData.description}
- Companions: ${storyData.companions || 'Solo travel'}

Mood Analysis:
- Primary mood: ${moodAnalysis.primaryMood} (${moodInfo?.emotionalTone})
- Emotional intensity: ${(moodAnalysis.intensity * 100).toFixed(0)}%
- Key themes: ${moodInfo?.storyThemes.join(', ')}

Story Requirements:
- Template: ${template.type}
- Style: ${template.style}
- Structure: ${template.structure.join(' → ')}
- Length: ${template.length}
- Tone: ${moodInfo?.emotionalTone}

Create a compelling, personal narrative that:
1. Captures the emotional essence of the experience
2. Uses vivid, sensory details
3. Follows the specified structure
4. Maintains the emotional tone throughout
5. Makes the reader feel the mood and atmosphere
6. Includes personal insights and reflections

Write in first person perspective as if the traveler is telling their own story.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a master storyteller specializing in personal travel narratives. Create emotionally resonant stories that capture the essence of travel experiences."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: template.length === 'long' ? 1500 : template.length === 'medium' ? 800 : 400
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('AI story generation error:', error);
      return this.generateFallbackStory(storyData, moodAnalysis);
    }
  }

  // Generate fallback story
  generateFallbackStory(storyData, moodAnalysis) {
    const moodInfo = this.moodCategories[moodAnalysis.primaryMood];
    return `My journey to ${storyData.location} was filled with ${moodInfo?.keywords[0] || 'meaningful'} moments. ${storyData.description || 'The experience left a lasting impression on me.'}

This adventure reminded me that travel is not just about the places we visit, but about the emotions and memories we create along the way. Every moment was a chance to grow, learn, and discover something new about myself and the world around me.

The ${moodAnalysis.primaryMood} feelings I experienced during this trip will stay with me long after I've returned home, serving as a reminder of the transformative power of travel.`;
  }

  // Select appropriate story template
  selectStoryTemplate(storyType, moodAnalysis) {
    if (storyType && this.storyTemplates[storyType]) {
      return { type: storyType, ...this.storyTemplates[storyType] };
    }

    // Select based on mood
    const mood = moodAnalysis.primaryMood;
    if (['adventurous', 'excited'].includes(mood)) {
      return { type: 'adventure_tale', ...this.storyTemplates.adventure_tale };
    } else if (['peaceful', 'contemplative'].includes(mood)) {
      return { type: 'memory_snapshot', ...this.storyTemplates.memory_snapshot };
    } else if (['grateful', 'inspired'].includes(mood)) {
      return { type: 'gratitude_letter', ...this.storyTemplates.gratitude_letter };
    } else if (['curious', 'nostalgic'].includes(mood)) {
      return { type: 'cultural_reflection', ...this.storyTemplates.cultural_reflection };
    }

    // Default
    return { type: 'travel_journal', ...this.storyTemplates.travel_journal };
  }

  // Generate multimedia enhancements
  async generateMultimediaEnhancements(story, storyData) {
    try {
      const enhancements = {
        imagePrompts: [],
        musicSuggestions: [],
        voiceNarrationTips: [],
        visualElements: []
      };

      // Generate image prompts for key story moments
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Generate creative prompts for travel photography and visual storytelling."
          },
          {
            role: "user",
            content: `Based on this travel story, suggest 3-5 image prompts that would visually enhance the narrative:

${story}

Provide creative, specific prompts for:
1. Key visual moments
2. Atmospheric shots
3. Emotional captures
4. Detail shots

Format as JSON: {"imagePrompts": ["prompt1", "prompt2", ...], "visualElements": ["element1", "element2", ...]}`
          }
        ],
        temperature: 0.6
      });

      const aiEnhancements = JSON.parse(response.choices[0].message.content);
      enhancements.imagePrompts = aiEnhancements.imagePrompts || [];
      enhancements.visualElements = aiEnhancements.visualElements || [];

      // Add music suggestions based on mood
      if (storyData.moodAnalysis) {
        enhancements.musicSuggestions = this.generateMusicSuggestions(storyData.moodAnalysis.primaryMood);
      }

      // Add voice narration tips
      enhancements.voiceNarrationTips = [
        'Read slowly and emphasize emotional words',
        'Pause at natural story breaks',
        'Vary your tone to match the mood',
        'Use descriptive intonation for scenic moments'
      ];

      return enhancements;
    } catch (error) {
      console.error('Error generating multimedia enhancements:', error);
      return {
        imagePrompts: ['Beautiful landscape shot', 'Candid moment capture', 'Atmospheric detail'],
        musicSuggestions: ['Ambient travel music', 'Cultural local sounds'],
        voiceNarrationTips: ['Read with emotion', 'Pace naturally'],
        visualElements: ['Scenic backgrounds', 'Cultural elements']
      };
    }
  }

  // Generate music suggestions based on mood
  generateMusicSuggestions(mood) {
    const musicMap = {
      adventurous: ['Epic orchestral music', 'Upbeat world music', 'Energetic indie folk'],
      peaceful: ['Ambient nature sounds', 'Soft acoustic guitar', 'Meditative piano'],
      excited: ['Uplifting pop music', 'Celebration songs', 'Joyful folk tunes'],
      nostalgic: ['Classic oldies', 'Vintage jazz', 'Emotional piano ballads'],
      grateful: ['Inspiring instrumental', 'Heartfelt acoustic', 'Spiritual music'],
      curious: ['World music fusion', 'Cultural traditional music', 'Experimental sounds'],
      inspired: ['Motivational orchestral', 'Uplifting ambient', 'Creative soundscapes'],
      contemplative: ['Deep ambient music', 'Philosophical instrumental', 'Quiet reflection sounds']
    };

    return musicMap[mood] || ['General travel music', 'Atmospheric background'];
  }

  // Create memory connections
  async createMemoryConnections(story, storyData) {
    try {
      // This would typically connect to a user's travel history database
      const connections = {
        similarExperiences: [],
        emotionalPatterns: [],
        locationConnections: [],
        temporalConnections: []
      };

      // Use AI to identify potential connections
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Analyze travel experiences to identify meaningful connections and patterns."
          },
          {
            role: "user",
            content: `Analyze this travel story and identify potential connections to other travel experiences:

Story: ${story}
Location: ${storyData.location}
Activity: ${storyData.activity}

Suggest:
1. Types of similar experiences that might resonate
2. Emotional patterns that could be tracked
3. Location-based connections
4. Seasonal or temporal connections

Format as JSON with arrays for each connection type.`
          }
        ],
        temperature: 0.4
      });

      const aiConnections = JSON.parse(response.choices[0].message.content);
      Object.assign(connections, aiConnections);

      return connections;
    } catch (error) {
      console.error('Error creating memory connections:', error);
      return {
        similarExperiences: ['Other cultural experiences', 'Similar destinations'],
        emotionalPatterns: ['Mood progression during travel'],
        locationConnections: ['Regional experiences', 'Climate similarities'],
        temporalConnections: ['Seasonal patterns', 'Anniversary connections']
      };
    }
  }

  // Generate mood insights
  async generateMoodInsights(moodAnalysis, experienceData) {
    const insights = [];
    const mood = moodAnalysis.primaryMood;
    const moodInfo = this.moodCategories[mood];

    // Base insights
    insights.push(`Your ${mood} mood suggests you're experiencing ${moodInfo?.emotionalTone} emotions during this travel experience.`);
    
    if (moodAnalysis.intensity > 0.7) {
      insights.push('The high emotional intensity indicates this experience is particularly meaningful to you.');
    }

    if (moodAnalysis.secondaryMoods.length > 0) {
      insights.push(`You're also experiencing undertones of ${moodAnalysis.secondaryMoods.join(' and ')}, creating a rich emotional landscape.`);
    }

    // Add contextual insights based on activity or location
    if (experienceData.activity) {
      insights.push(`${experienceData.activity} activities often evoke ${mood} feelings, suggesting good alignment with your travel preferences.`);
    }

    return insights;
  }

  // Generate mood-based recommendations
  async generateMoodBasedRecommendations(moodAnalysis) {
    const mood = moodAnalysis.primaryMood;
    const recommendations = [];

    switch (mood) {
      case 'adventurous':
        recommendations.push('Consider documenting this energy for future adventure planning');
        recommendations.push('Look for similar adrenaline-filled activities at your next destination');
        break;
      case 'peaceful':
        recommendations.push('Take time to journal about these calm moments');
        recommendations.push('Seek out quiet, reflective spaces in future travels');
        break;
      case 'excited':
        recommendations.push('Share this joy with fellow travelers or friends');
        recommendations.push('Capture video content to preserve the energy');
        break;
      case 'grateful':
        recommendations.push('Write a gratitude letter to someone who made this possible');
        recommendations.push('Consider giving back to the local community');
        break;
      default:
        recommendations.push('Embrace these feelings and let them guide your travel choices');
        recommendations.push('Document this emotional state for personal growth tracking');
    }

    return recommendations;
  }

  // Generate reflection prompts
  generateReflectionPrompts(moodAnalysis, storyData) {
    const mood = moodAnalysis.primaryMood;
    const prompts = [];

    // General prompts
    prompts.push('What aspect of this experience surprised you the most?');
    prompts.push('How has this experience changed your perspective?');

    // Mood-specific prompts
    switch (mood) {
      case 'adventurous':
        prompts.push('What fears did you overcome during this adventure?');
        prompts.push('What new capabilities did you discover in yourself?');
        break;
      case 'peaceful':
        prompts.push('What inner peace did you find in this moment?');
        prompts.push('How can you carry this tranquility into your daily life?');
        break;
      case 'grateful':
        prompts.push('Who or what are you most grateful for in this experience?');
        prompts.push('How can you express this gratitude meaningfully?');
        break;
      case 'curious':
        prompts.push('What new questions has this experience raised for you?');
        prompts.push('What cultural insights did you gain?');
        break;
      default:
        prompts.push('What emotions does this memory evoke?');
        prompts.push('How will you remember this experience in years to come?');
    }

    return prompts;
  }

  // Track mood journey over time
  trackMoodJourney(moodAnalysis, userId) {
    // This would typically integrate with a database to track mood patterns
    return {
      currentMood: moodAnalysis.primaryMood,
      moodTrend: 'stable', // This would be calculated from historical data
      emotionalGrowth: ['increased self-awareness', 'expanded comfort zone'],
      moodFrequency: {
        [moodAnalysis.primaryMood]: 1 // This would be actual frequency data
      }
    };
  }

  // Generate story recommendations
  async generateStoryRecommendations(story, moodAnalysis) {
    return [
      'Consider adding more sensory details to enhance the narrative',
      'Include dialogue or conversations for more engagement',
      'Add timestamps or specific moments for better memory anchoring',
      'Consider creating a photo album to accompany this story'
    ];
  }

  // Helper methods
  generateMoodCacheKey(experienceData) {
    return `mood_${experienceData.userId || 'anonymous'}_${Date.now()}_${experienceData.location?.replace(/\s+/g, '_') || 'unknown'}`;
  }

  generateStoryCacheKey(storyData) {
    return `story_${storyData.userId || 'anonymous'}_${storyData.date || Date.now()}_${storyData.location?.replace(/\s+/g, '_') || 'unknown'}`;
  }

  // Enhance memory with AI analysis
  async enhanceMemory(memoryData) {
    try {
      const enhancement = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a memory enhancement specialist. Help users enrich their travel memories with deeper insights and connections."
          },
          {
            role: "user",
            content: `Enhance this travel memory with deeper insights:

Memory: ${memoryData.description}
Location: ${memoryData.location}
Date: ${memoryData.date}
Context: ${memoryData.context || 'General travel experience'}

Provide:
1. Hidden significance of this moment
2. Cultural or historical context
3. Personal growth implications
4. Future reflection questions
5. Memory preservation suggestions

Format as JSON with these categories.`
          }
        ],
        temperature: 0.6
      });

      return JSON.parse(enhancement.choices[0].message.content);
    } catch (error) {
      console.error('Error enhancing memory:', error);
      return {
        significance: 'This moment represents a meaningful part of your travel journey',
        context: 'Travel experiences contribute to personal growth and cultural understanding',
        growth: 'Each journey expands your perspective and resilience',
        questions: ['What did this teach you about yourself?', 'How did this change your worldview?'],
        preservation: ['Write detailed notes', 'Collect mementos', 'Share stories with others']
      };
    }
  }

  // Generate travel narrative themes
  generateNarrativeThemes(experiences) {
    const themes = [];
    
    experiences.forEach(exp => {
      if (exp.moodAnalysis) {
        const moodThemes = this.moodCategories[exp.moodAnalysis.primaryMood]?.storyThemes || [];
        themes.push(...moodThemes);
      }
    });

    // Remove duplicates and return top themes
    const uniqueThemes = [...new Set(themes)];
    return uniqueThemes.slice(0, 5);
  }

  // Create mood-based travel playlists
  generateMoodPlaylist(mood, duration = 60) {
    const moodPlaylists = {
      adventurous: [
        'On Top of the World - Imagine Dragons',
        'Adventure of a Lifetime - Coldplay',
        'Roar - Katy Perry',
        'Thunder - Imagine Dragons'
      ],
      peaceful: [
        'Weightless - Marconi Union',
        'River - Joni Mitchell',
        'Mad World - Gary Jules',
        'The Night We Met - Lord Huron'
      ],
      excited: [
        'Happy - Pharrell Williams',
        'Good as Hell - Lizzo',
        'Can\'t Stop the Feeling - Justin Timberlake',
        'Uptown Funk - Bruno Mars'
      ],
      nostalgic: [
        'The Way You Look Tonight - Frank Sinatra',
        'Yesterday - The Beatles',
        'Autumn Leaves - Nat King Cole',
        'La Vie En Rose - Édith Piaf'
      ]
    };

    return moodPlaylists[mood] || moodPlaylists.peaceful;
  }
}

module.exports = AIMoodStoryService;