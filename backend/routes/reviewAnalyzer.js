const express = require('express');
const router = express.Router();
const reviewAnalyzerService = require('../services/reviewAnalyzerService');
const auth = require('../middleware/auth');

// Analyze reviews endpoint
router.post('/analyze', auth, async (req, res) => {
  try {
    const { reviews, options = {} } = req.body;
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return res.status(400).json({
        error: 'Reviews array is required and must not be empty'
      });
    }

    console.log(`📊 Analyzing ${reviews.length} reviews for user ${req.user.userId}`);

    // Validate review format
    const validReviews = reviews.filter(review => 
      review.text && review.rating && review.id
    );

    if (validReviews.length === 0) {
      return res.status(400).json({
        error: 'No valid reviews found. Each review must have text, rating, and id fields.'
      });
    }

    // Perform analysis
    const analysis = await reviewAnalyzerService.analyzeReviews(validReviews, options);

    res.json({
      success: true,
      analysis,
      metadata: {
        user_id: req.user.userId,
        request_time: new Date().toISOString(),
        reviews_processed: validReviews.length,
        reviews_skipped: reviews.length - validReviews.length
      }
    });

  } catch (error) {
    console.error('Error in review analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze reviews',
      message: error.message
    });
  }
});

// Search reviews endpoint
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      query, 
      source = 'all', 
      limit = 50,
      location,
      category 
    } = req.query;

    if (!query) {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    console.log(`🔍 Searching reviews for: "${query}" from source: ${source}`);

    // Search reviews
    const reviews = await reviewAnalyzerService.searchReviews(query, {
      source,
      limit: parseInt(limit),
      location,
      category
    });

    res.json({
      success: true,
      query,
      source,
      reviews,
      count: reviews.length,
      metadata: {
        search_time: new Date().toISOString(),
        user_id: req.user.userId
      }
    });

  } catch (error) {
    console.error('Error searching reviews:', error);
    res.status(500).json({
      error: 'Failed to search reviews',
      message: error.message
    });
  }
});

// Quick sentiment analysis endpoint
router.post('/sentiment', auth, async (req, res) => {
  try {
    const { text, rating } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'Text is required for sentiment analysis'
      });
    }

    // Create a review object for analysis
    const review = {
      id: `quick_${Date.now()}`,
      text,
      rating: rating || 3,
      platform: 'manual',
      date: new Date().toISOString().split('T')[0],
      author: 'User',
      verified: false,
      helpful_votes: 0
    };

    // Analyze single review
    const analysis = await reviewAnalyzerService.analyzeSingleReview(review);

    res.json({
      success: true,
      sentiment: analysis.overall_sentiment,
      aspects: analysis.aspects,
      emotions: analysis.emotions,
      key_phrases: analysis.key_phrases,
      summary: analysis.summary,
      metadata: {
        analysis_time: new Date().toISOString(),
        user_id: req.user.userId
      }
    });

  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    res.status(500).json({
      error: 'Failed to analyze sentiment',
      message: error.message
    });
  }
});

// Analyze place reviews (hotels, restaurants, attractions)
router.get('/place/:placeId', auth, async (req, res) => {
  try {
    const { placeId } = req.params;
    const { limit = 100, source = 'all' } = req.query;

    console.log(`📍 Analyzing reviews for place: ${placeId}`);

    // Search reviews for the specific place
    const reviews = await reviewAnalyzerService.searchReviews(placeId, {
      source,
      limit: parseInt(limit)
    });

    if (reviews.length === 0) {
      return res.json({
        success: true,
        message: 'No reviews found for this place',
        analysis: null,
        place_id: placeId
      });
    }

    // Analyze all reviews for the place
    const analysis = await reviewAnalyzerService.analyzeReviews(reviews);

    res.json({
      success: true,
      place_id: placeId,
      analysis,
      reviews_sample: reviews.slice(0, 5).map(r => ({
        text: r.text.substring(0, 200) + '...',
        rating: r.rating,
        platform: r.platform,
        date: r.date
      })),
      metadata: {
        total_reviews_found: reviews.length,
        analysis_time: new Date().toISOString(),
        user_id: req.user.userId
      }
    });

  } catch (error) {
    console.error('Error analyzing place reviews:', error);
    res.status(500).json({
      error: 'Failed to analyze place reviews',
      message: error.message
    });
  }
});

// Compare multiple places
router.post('/compare', auth, async (req, res) => {
  try {
    const { places } = req.body;

    if (!places || !Array.isArray(places) || places.length < 2) {
      return res.status(400).json({
        error: 'At least 2 places are required for comparison'
      });
    }

    console.log(`🆚 Comparing ${places.length} places`);

    const comparisons = [];

    // Analyze each place
    for (const place of places) {
      try {
        const reviews = await reviewAnalyzerService.searchReviews(place.name || place.id, {
          source: 'all',
          limit: 50
        });

        if (reviews.length > 0) {
          const analysis = await reviewAnalyzerService.analyzeReviews(reviews);
          
          comparisons.push({
            place: place.name || place.id,
            place_data: place,
            analysis,
            review_count: reviews.length
          });
        }
      } catch (placeError) {
        console.error(`Error analyzing place ${place.name}:`, placeError);
        comparisons.push({
          place: place.name || place.id,
          place_data: place,
          analysis: null,
          error: placeError.message
        });
      }
    }

    // Generate comparison insights
    const winner = comparisons.reduce((best, current) => {
      if (!current.analysis) return best;
      if (!best.analysis) return current;
      
      const currentScore = current.analysis.overall_sentiment.average_score;
      const bestScore = best.analysis.overall_sentiment.average_score;
      
      return currentScore > bestScore ? current : best;
    }, comparisons[0]);

    res.json({
      success: true,
      comparisons,
      winner: winner.place,
      insights: {
        best_overall: winner.place,
        comparison_date: new Date().toISOString(),
        total_places: comparisons.length,
        places_with_data: comparisons.filter(c => c.analysis).length
      },
      metadata: {
        user_id: req.user.userId,
        comparison_time: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error comparing places:', error);
    res.status(500).json({
      error: 'Failed to compare places',
      message: error.message
    });
  }
});

// Get trending aspects
router.get('/trends', auth, async (req, res) => {
  try {
    const { category = 'hotel', timeframe = '30d' } = req.query;

    console.log(`📈 Getting trends for ${category} in last ${timeframe}`);

    // This would typically query a database of historical analysis
    // For now, return mock trending data
    const trends = {
      trending_up: [
        { aspect: 'cleanliness', change: '+15%', reason: 'Increased focus on hygiene standards' },
        { aspect: 'wifi', change: '+12%', reason: 'Improved internet infrastructure' },
        { aspect: 'service', change: '+8%', reason: 'Better staff training initiatives' }
      ],
      trending_down: [
        { aspect: 'value', change: '-10%', reason: 'Rising prices amid inflation' },
        { aspect: 'food', change: '-5%', reason: 'Supply chain challenges' }
      ],
      stable: [
        { aspect: 'location', change: '0%', reason: 'Consistent location ratings' },
        { aspect: 'room', change: '+2%', reason: 'Minor improvements in room quality' }
      ]
    };

    res.json({
      success: true,
      category,
      timeframe,
      trends,
      metadata: {
        generated_at: new Date().toISOString(),
        user_id: req.user.userId
      }
    });

  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({
      error: 'Failed to get trends',
      message: error.message
    });
  }
});

// Clear analysis cache
router.delete('/cache', auth, async (req, res) => {
  try {
    const result = reviewAnalyzerService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      ...result,
      cleared_by: req.user.userId,
      cleared_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      error: 'Failed to clear cache',
      message: error.message
    });
  }
});

// Get cache statistics
router.get('/cache/stats', auth, async (req, res) => {
  try {
    const stats = reviewAnalyzerService.getCacheStats();
    
    res.json({
      success: true,
      cache_stats: stats,
      retrieved_by: req.user.userId,
      retrieved_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({
      error: 'Failed to get cache stats',
      message: error.message
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'Review Analyzer Service',
      status: 'healthy',
      features: [
        'Sentiment Analysis',
        'Aspect-based Analysis', 
        'Review Search',
        'Place Comparison',
        'Trend Analysis',
        'AI Insights Generation'
      ],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      service: 'Review Analyzer Service',
      status: 'unhealthy',
      error: error.message
    });
  }
});

module.exports = router;