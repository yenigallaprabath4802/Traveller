const { OpenAI } = require('openai');
const axios = require('axios');

class ReviewAnalyzerService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Review sources configuration
    this.reviewSources = {
      tripadvisor: {
        name: 'TripAdvisor',
        weight: 0.3,
        baseUrl: 'https://api.tripadvisor.com/api/partner/2.0',
        apiKey: process.env.TRIPADVISOR_API_KEY
      },
      google: {
        name: 'Google Reviews',
        weight: 0.25,
        baseUrl: 'https://maps.googleapis.com/maps/api/place',
        apiKey: process.env.GOOGLE_PLACES_API_KEY
      },
      booking: {
        name: 'Booking.com',
        weight: 0.2,
        baseUrl: 'https://distribution-xml.booking.com/2.7/json',
        apiKey: process.env.BOOKING_API_KEY
      },
      yelp: {
        name: 'Yelp',
        weight: 0.25,
        baseUrl: 'https://api.yelp.com/v3',
        apiKey: process.env.YELP_API_KEY
      }
    };

    // Sentiment analysis cache
    this.sentimentCache = new Map();
    this.aspectsCache = new Map();
  }

  // Main review analysis function
  async analyzeReviews(reviews, options = {}) {
    try {
      console.log(`📊 Analyzing ${reviews.length} reviews with AI...`);

      // Batch process reviews for efficiency
      const analysisPromises = reviews.map(review => this.analyzeSingleReview(review));
      const reviewAnalyses = await Promise.all(analysisPromises);

      // Aggregate all analyses
      const aggregatedAnalysis = await this.aggregateAnalyses(reviewAnalyses, options);

      // Generate insights using AI
      const insights = await this.generateInsights(reviewAnalyses, aggregatedAnalysis);

      // Calculate recommendation score
      const recommendation = this.calculateRecommendation(aggregatedAnalysis);

      return {
        overall_sentiment: aggregatedAnalysis.overall_sentiment,
        aspects: aggregatedAnalysis.aspects,
        pros: insights.pros,
        cons: insights.cons,
        insights: insights.key_insights,
        rating_distribution: aggregatedAnalysis.rating_distribution,
        temporal_trends: aggregatedAnalysis.temporal_trends,
        recommended: recommendation.recommended,
        confidence_score: recommendation.confidence,
        analysis_metadata: {
          total_reviews: reviews.length,
          analysis_date: new Date().toISOString(),
          processing_time: Date.now(),
          sources_analyzed: [...new Set(reviews.map(r => r.platform))]
        }
      };

    } catch (error) {
      console.error('Error analyzing reviews:', error);
      throw new Error('Failed to analyze reviews: ' + error.message);
    }
  }

  // Analyze individual review with AI
  async analyzeSingleReview(review) {
    const cacheKey = `${review.id}_${review.text.substring(0, 50)}`;
    
    if (this.sentimentCache.has(cacheKey)) {
      return this.sentimentCache.get(cacheKey);
    }

    const analysisPrompt = `
    Analyze this travel review and provide detailed sentiment and aspect analysis:

    Review: "${review.text}"
    Rating: ${review.rating}/5 stars
    Platform: ${review.platform}
    Date: ${review.date}

    Provide analysis in this JSON format:
    {
      "overall_sentiment": {
        "score": -1.0 to 1.0,
        "label": "positive|negative|neutral",
        "confidence": 0.0 to 1.0
      },
      "aspects": {
        "service": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "location": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "cleanliness": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "value": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "food": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "room": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "facilities": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        },
        "wifi": {
          "sentiment": -1.0 to 1.0,
          "mentions": ["specific mention phrases"],
          "importance": 0.0 to 1.0
        }
      },
      "emotions": ["happy", "frustrated", "disappointed", "satisfied", "angry", "excited"],
      "key_phrases": ["most important phrases from the review"],
      "summary": "One sentence summary of the review",
      "reliability_score": 0.0 to 1.0
    }

    Only include aspects that are actually mentioned in the review.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 1200
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Add original review data
      analysis.original_review = {
        id: review.id,
        rating: review.rating,
        date: review.date,
        platform: review.platform,
        author: review.author,
        verified: review.verified,
        helpful_votes: review.helpful_votes
      };

      // Cache the result
      this.sentimentCache.set(cacheKey, analysis);
      
      return analysis;

    } catch (error) {
      console.error('Error analyzing single review:', error);
      // Return fallback analysis
      return {
        overall_sentiment: {
          score: (review.rating - 3) / 2, // Convert 1-5 rating to -1 to 1 scale
          label: review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral',
          confidence: 0.5
        },
        aspects: {},
        emotions: [],
        key_phrases: [],
        summary: review.text.substring(0, 100) + '...',
        reliability_score: 0.5,
        original_review: review
      };
    }
  }

  // Aggregate multiple review analyses
  async aggregateAnalyses(analyses, options = {}) {
    const totalReviews = analyses.length;
    
    // Overall sentiment aggregation
    const sentiments = analyses.map(a => a.overall_sentiment.score);
    const averageSentiment = sentiments.reduce((sum, score) => sum + score, 0) / totalReviews;
    
    const positiveCount = sentiments.filter(s => s > 0.3).length;
    const negativeCount = sentiments.filter(s => s < -0.3).length;
    const neutralCount = totalReviews - positiveCount - negativeCount;

    // Aspect aggregation
    const aspectAggregation = {};
    const allAspects = ['service', 'location', 'cleanliness', 'value', 'food', 'room', 'facilities', 'wifi'];
    
    allAspects.forEach(aspect => {
      const aspectMentions = analyses
        .filter(a => a.aspects[aspect])
        .map(a => a.aspects[aspect]);
      
      if (aspectMentions.length > 0) {
        const avgSentiment = aspectMentions.reduce((sum, mention) => sum + mention.sentiment, 0) / aspectMentions.length;
        const allMentions = aspectMentions.flatMap(mention => mention.mentions || []);
        
        aspectAggregation[aspect] = {
          average_sentiment: avgSentiment,
          mention_count: aspectMentions.length,
          trending: this.calculateTrend(aspectMentions, analyses),
          top_mentions: this.getTopMentions(allMentions),
          importance: aspectMentions.reduce((sum, mention) => sum + (mention.importance || 0.5), 0) / aspectMentions.length
        };
      }
    });

    // Rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      ratingDistribution[i] = analyses.filter(a => a.original_review.rating === i).length;
    }

    // Temporal trends (if date information is available)
    const temporalTrends = this.calculateTemporalTrends(analyses);

    return {
      overall_sentiment: {
        positive: Math.round((positiveCount / totalReviews) * 100),
        negative: Math.round((negativeCount / totalReviews) * 100),
        neutral: Math.round((neutralCount / totalReviews) * 100),
        average_score: averageSentiment
      },
      aspects: aspectAggregation,
      rating_distribution: ratingDistribution,
      temporal_trends: temporalTrends
    };
  }

  // Generate AI insights from aggregated data
  async generateInsights(analyses, aggregatedData) {
    const insightPrompt = `
    Based on the analysis of travel reviews, generate actionable insights:

    Overall Sentiment: ${JSON.stringify(aggregatedData.overall_sentiment)}
    Aspect Analysis: ${JSON.stringify(aggregatedData.aspects)}
    Total Reviews Analyzed: ${analyses.length}

    Recent Review Samples:
    ${analyses.slice(0, 5).map(a => `- "${a.summary}" (${a.overall_sentiment.label})`).join('\n')}

    Generate insights in this JSON format:
    {
      "pros": [
        "Clear, specific positive insights based on the data",
        "Focus on most mentioned positive aspects",
        "Include quantitative context where possible"
      ],
      "cons": [
        "Clear, specific areas for improvement",
        "Focus on most mentioned negative aspects", 
        "Include quantitative context where possible"
      ],
      "key_insights": [
        "Strategic insights about patterns in the reviews",
        "Trends and correlations discovered",
        "Actionable recommendations for improvement",
        "Competitive advantages or disadvantages identified"
      ],
      "business_recommendations": [
        "Specific actionable steps for the business",
        "Priority areas for investment",
        "Marketing angles to leverage"
      ]
    }

    Focus on actionable, data-driven insights that would be valuable for both travelers and businesses.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: insightPrompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      return JSON.parse(response.choices[0].message.content);

    } catch (error) {
      console.error('Error generating insights:', error);
      return {
        pros: ['Multiple positive aspects mentioned in reviews'],
        cons: ['Some areas identified for improvement'],
        key_insights: ['Analysis completed on available review data'],
        business_recommendations: ['Continue monitoring review feedback']
      };
    }
  }

  // Calculate recommendation score
  calculateRecommendation(aggregatedData) {
    const sentimentScore = aggregatedData.overall_sentiment.average_score;
    const positivePercentage = aggregatedData.overall_sentiment.positive;
    const negativePercentage = aggregatedData.overall_sentiment.negative;
    
    // Calculate confidence based on review distribution and sentiment consistency
    let confidence = 0.5;
    
    if (positivePercentage > 60 && sentimentScore > 0.3) {
      confidence = Math.min(0.95, 0.6 + (positivePercentage - 60) / 100);
    } else if (negativePercentage > 60 && sentimentScore < -0.3) {
      confidence = Math.min(0.95, 0.6 + (negativePercentage - 60) / 100);
    } else {
      confidence = 0.5 + Math.abs(sentimentScore) * 0.3;
    }

    // Recommendation logic
    const recommended = (sentimentScore > 0.1 && positivePercentage > negativePercentage) || 
                      (positivePercentage > 50 && negativePercentage < 30);

    return {
      recommended,
      confidence: Math.min(0.95, Math.max(0.1, confidence)),
      reasoning: this.getRecommendationReasoning(aggregatedData, recommended)
    };
  }

  // Get recommendation reasoning
  getRecommendationReasoning(data, recommended) {
    if (recommended) {
      return `Recommended based on ${data.overall_sentiment.positive}% positive reviews and overall positive sentiment (${(data.overall_sentiment.average_score * 100).toFixed(1)}%)`;
    } else {
      return `Not recommended due to ${data.overall_sentiment.negative}% negative reviews and overall sentiment concerns`;
    }
  }

  // Calculate temporal trends
  calculateTemporalTrends(analyses) {
    const trends = [];
    const dateGroups = {};

    // Group by date
    analyses.forEach(analysis => {
      const date = analysis.original_review.date;
      if (date) {
        if (!dateGroups[date]) {
          dateGroups[date] = [];
        }
        dateGroups[date].push(analysis.overall_sentiment.score);
      }
    });

    // Calculate average sentiment per date
    Object.entries(dateGroups).forEach(([date, sentiments]) => {
      const averageSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
      trends.push({
        date,
        sentiment: averageSentiment,
        review_count: sentiments.length
      });
    });

    // Sort by date
    return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Calculate aspect trends
  calculateTrend(aspectMentions, allAnalyses) {
    if (aspectMentions.length < 2) return 'stable';
    
    // Simple trend calculation based on chronological sentiment
    const sorted = aspectMentions.sort((a, b) => 
      new Date(a.date || '2024-01-01').getTime() - new Date(b.date || '2024-01-01').getTime()
    );
    
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.sentiment, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.sentiment, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) return 'up';
    if (difference < -0.1) return 'down';
    return 'stable';
  }

  // Get top mentions for an aspect
  getTopMentions(mentions) {
    const mentionCounts = {};
    mentions.forEach(mention => {
      const normalized = mention.toLowerCase().trim();
      mentionCounts[normalized] = (mentionCounts[normalized] || 0) + 1;
    });
    
    return Object.entries(mentionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mention]) => mention);
  }

  // Search reviews from multiple sources
  async searchReviews(query, options = {}) {
    const { source = 'all', limit = 50 } = options;
    
    console.log(`🔍 Searching reviews for: ${query} from source: ${source}`);
    
    try {
      let allReviews = [];
      
      if (source === 'all') {
        // Search all sources in parallel
        const searchPromises = Object.keys(this.reviewSources).map(sourceName => 
          this.searchSingleSource(sourceName, query, Math.ceil(limit / 4))
        );
        
        const results = await Promise.allSettled(searchPromises);
        results.forEach(result => {
          if (result.status === 'fulfilled') {
            allReviews = allReviews.concat(result.value);
          }
        });
      } else {
        // Search single source
        allReviews = await this.searchSingleSource(source, query, limit);
      }
      
      // Sort by relevance and date
      allReviews.sort((a, b) => {
        if (a.helpful_votes !== b.helpful_votes) {
          return b.helpful_votes - a.helpful_votes;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      return allReviews.slice(0, limit);
      
    } catch (error) {
      console.error('Error searching reviews:', error);
      // Return mock data for demo purposes
      return this.generateMockReviews(query);
    }
  }

  // Search single review source
  async searchSingleSource(sourceName, query, limit) {
    const source = this.reviewSources[sourceName];
    if (!source) return [];
    
    try {
      // This would integrate with actual APIs
      // For now, return mock data
      return this.generateMockReviews(query, sourceName, limit);
      
    } catch (error) {
      console.error(`Error searching ${sourceName}:`, error);
      return [];
    }
  }

  // Generate mock reviews for demonstration
  generateMockReviews(query, source = 'mixed', count = 10) {
    const platforms = source === 'mixed' ? 
      ['TripAdvisor', 'Google Reviews', 'Booking.com', 'Yelp'] : 
      [this.reviewSources[source]?.name || 'TripAdvisor'];
    
    const sampleReviews = [
      {
        template: 'Great {type}! The {aspect1} was {positive_adj} and the {aspect2} was {positive_adj}. {positive_detail}',
        rating: [4, 5],
        sentiment: 'positive'
      },
      {
        template: 'Okay {type}, nothing special. The {aspect1} was {neutral_adj} but the {aspect2} could be better. {neutral_detail}',
        rating: [2, 3],
        sentiment: 'neutral'
      },
      {
        template: 'Disappointing {type}. The {aspect1} was {negative_adj} and {negative_detail}. Would not recommend.',
        rating: [1, 2],
        sentiment: 'negative'
      }
    ];
    
    const aspects = ['service', 'location', 'cleanliness', 'food', 'room', 'facilities'];
    const positiveAdj = ['excellent', 'outstanding', 'amazing', 'perfect', 'wonderful'];
    const neutralAdj = ['okay', 'decent', 'acceptable', 'average', 'fine'];
    const negativeAdj = ['terrible', 'awful', 'poor', 'disappointing', 'unacceptable'];
    
    const reviews = [];
    
    for (let i = 0; i < count; i++) {
      const template = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const rating = template.rating[Math.floor(Math.random() * template.rating.length)];
      
      let text = template.template
        .replace('{type}', query.includes('hotel') ? 'hotel' : query.includes('restaurant') ? 'restaurant' : 'place')
        .replace('{aspect1}', aspects[Math.floor(Math.random() * aspects.length)])
        .replace('{aspect2}', aspects[Math.floor(Math.random() * aspects.length)])
        .replace('{positive_adj}', positiveAdj[Math.floor(Math.random() * positiveAdj.length)])
        .replace('{neutral_adj}', neutralAdj[Math.floor(Math.random() * neutralAdj.length)])
        .replace('{negative_adj}', negativeAdj[Math.floor(Math.random() * negativeAdj.length)])
        .replace('{positive_detail}', 'Highly recommended!')
        .replace('{neutral_detail}', 'It was an average experience.')
        .replace('{negative_detail}', 'Very disappointed with the quality.');
      
      reviews.push({
        id: `review_${i}_${Date.now()}`,
        text,
        rating,
        author: `User ${i + 1}`,
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        platform,
        verified: Math.random() > 0.3,
        helpful_votes: Math.floor(Math.random() * 50)
      });
    }
    
    return reviews;
  }

  // Clear analysis cache
  clearCache() {
    this.sentimentCache.clear();
    this.aspectsCache.clear();
    return { success: true, message: 'Analysis cache cleared' };
  }

  // Get cache statistics
  getCacheStats() {
    return {
      sentiment_cache_size: this.sentimentCache.size,
      aspects_cache_size: this.aspectsCache.size,
      memory_usage: process.memoryUsage()
    };
  }
}

module.exports = new ReviewAnalyzerService();