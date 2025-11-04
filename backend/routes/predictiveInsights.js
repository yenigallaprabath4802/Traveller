const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const PredictiveTravelService = require('../services/predictiveTravelService');

// Initialize the predictive travel service
const predictiveService = new PredictiveTravelService();

// All routes require authentication
router.use(authMiddleware);

// Get comprehensive travel predictions for a destination
router.post('/predictions', async (req, res) => {
  try {
    const {
      destination,
      travelDates = [],
      flexibility = 7,
      travelStyle = 'leisure',
      budget = 'medium',
      duration = 7,
      travelers = 2,
      preferences = {}
    } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }

    console.log(`🔮 Generating predictions for ${destination}`);

    const predictions = await predictiveService.generateTravelPredictions(destination, {
      travelDates,
      flexibility,
      travelStyle,
      budget,
      duration,
      travelers,
      preferences
    });

    res.json({
      success: true,
      data: predictions,
      message: 'Travel predictions generated successfully'
    });
  } catch (error) {
    console.error('Error generating travel predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate travel predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get weather predictions specifically
router.get('/weather/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    const { travelDates } = req.query;

    const dates = travelDates ? travelDates.split(',') : [];
    
    const weatherPredictions = await predictiveService.predictWeatherPatterns(
      destination, 
      dates
    );

    res.json({
      success: true,
      data: weatherPredictions,
      message: 'Weather predictions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting weather predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get crowd level predictions
router.get('/crowds/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    const { travelDates } = req.query;

    const dates = travelDates ? travelDates.split(',') : [];
    
    const crowdPredictions = await predictiveService.predictCrowdLevels(
      destination, 
      dates
    );

    res.json({
      success: true,
      data: crowdPredictions,
      message: 'Crowd predictions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting crowd predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crowd predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get pricing trend predictions
router.get('/pricing/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    const { 
      travelDates, 
      travelers = 2, 
      duration = 7 
    } = req.query;

    const dates = travelDates ? travelDates.split(',') : [];
    
    const pricingPredictions = await predictiveService.predictPricingTrends(
      destination, 
      dates,
      { travelers: parseInt(travelers), duration: parseInt(duration) }
    );

    res.json({
      success: true,
      data: pricingPredictions,
      message: 'Pricing predictions retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting pricing predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pricing predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get optimal timing recommendations
router.post('/optimal-timing', async (req, res) => {
  try {
    const {
      destination,
      travelStyle = 'leisure',
      budget = 'medium',
      flexibility = 7,
      preferences = {}
    } = req.body;

    if (!destination) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }

    const optimalTiming = await predictiveService.predictOptimalTiming(destination, {
      travelStyle,
      budget,
      flexibility,
      preferences
    });

    res.json({
      success: true,
      data: optimalTiming,
      message: 'Optimal timing recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error getting optimal timing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get optimal timing recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get seasonal insights
router.get('/seasonal/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    
    const seasonalInsights = await predictiveService.generateSeasonalInsights(destination);

    res.json({
      success: true,
      data: seasonalInsights,
      message: 'Seasonal insights retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting seasonal insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seasonal insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get multiple destinations comparison
router.post('/compare', async (req, res) => {
  try {
    const {
      destinations = [],
      travelDates = [],
      travelStyle = 'leisure',
      budget = 'medium',
      duration = 7,
      travelers = 2
    } = req.body;

    if (!destinations || destinations.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 destinations are required for comparison'
      });
    }

    console.log(`📊 Comparing destinations: ${destinations.join(', ')}`);

    // Generate predictions for all destinations
    const comparisons = await Promise.all(
      destinations.map(async (destination) => {
        try {
          const predictions = await predictiveService.generateTravelPredictions(destination, {
            travelDates,
            travelStyle,
            budget,
            duration,
            travelers
          });
          return { destination, predictions, success: true };
        } catch (error) {
          return { 
            destination, 
            error: error.message, 
            success: false 
          };
        }
      })
    );

    // Generate comparison analysis
    const comparisonAnalysis = {
      destinations: comparisons,
      generatedAt: new Date().toISOString(),
      summary: {
        bestForWeather: null,
        bestForCrowds: null,
        bestForPricing: null,
        overallRecommendation: null
      }
    };

    // Analyze comparisons to find best options
    const successfulComparisons = comparisons.filter(c => c.success);
    
    if (successfulComparisons.length > 0) {
      // Find best destination for each factor
      comparisonAnalysis.summary.bestForWeather = successfulComparisons
        .reduce((best, current) => 
          current.predictions.weather.confidence > (best.predictions.weather.confidence || 0) ? current : best
        ).destination;

      comparisonAnalysis.summary.bestForCrowds = successfulComparisons
        .reduce((best, current) => 
          current.predictions.crowds.confidence > (best.predictions.crowds.confidence || 0) ? current : best
        ).destination;

      comparisonAnalysis.summary.bestForPricing = successfulComparisons
        .reduce((best, current) => 
          current.predictions.pricing.confidence > (best.predictions.pricing.confidence || 0) ? current : best
        ).destination;

      // Overall recommendation based on combined confidence scores
      comparisonAnalysis.summary.overallRecommendation = successfulComparisons
        .reduce((best, current) => 
          current.predictions.confidence > (best.predictions.confidence || 0) ? current : best
        ).destination;
    }

    res.json({
      success: true,
      data: comparisonAnalysis,
      message: 'Destination comparison completed successfully'
    });
  } catch (error) {
    console.error('Error comparing destinations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to compare destinations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get trend analysis for a specific factor
router.get('/trends/:destination/:factor', async (req, res) => {
  try {
    const { destination, factor } = req.params;
    const { timeframe = '12months' } = req.query;

    const validFactors = ['weather', 'crowds', 'pricing', 'all'];
    if (!validFactors.includes(factor)) {
      return res.status(400).json({
        success: false,
        message: `Factor must be one of: ${validFactors.join(', ')}`
      });
    }

    console.log(`📈 Analyzing ${factor} trends for ${destination}`);

    let trendData = {};

    switch (factor) {
      case 'weather':
        trendData = await predictiveService.predictWeatherPatterns(destination, []);
        break;
      case 'crowds':
        trendData = await predictiveService.predictCrowdLevels(destination, []);
        break;
      case 'pricing':
        trendData = await predictiveService.predictPricingTrends(destination, []);
        break;
      case 'all':
        const [weather, crowds, pricing] = await Promise.all([
          predictiveService.predictWeatherPatterns(destination, []),
          predictiveService.predictCrowdLevels(destination, []),
          predictiveService.predictPricingTrends(destination, [])
        ]);
        trendData = { weather, crowds, pricing };
        break;
    }

    const trends = {
      destination,
      factor,
      timeframe,
      data: trendData,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: trends,
      message: `${factor} trends retrieved successfully`
    });
  } catch (error) {
    console.error('Error getting trend analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trend analysis',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get personalized recommendations based on user profile
router.post('/recommendations', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      destinations = [],
      travelDates = [],
      travelStyle = 'leisure',
      budget = 'medium',
      duration = 7,
      travelers = 2,
      preferences = {}
    } = req.body;

    if (!destinations || destinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one destination is required'
      });
    }

    console.log(`🎯 Generating personalized recommendations for user ${userId}`);

    // Get predictions for all destinations
    const destinationPredictions = await Promise.all(
      destinations.map(async (destination) => {
        try {
          const predictions = await predictiveService.generateTravelPredictions(destination, {
            travelDates,
            travelStyle,
            budget,
            duration,
            travelers,
            preferences
          });
          return { destination, predictions };
        } catch (error) {
          console.error(`Error predicting for ${destination}:`, error);
          return { destination, error: error.message };
        }
      })
    );

    // Rank destinations based on personalized criteria
    const rankedDestinations = destinationPredictions
      .filter(d => !d.error)
      .sort((a, b) => {
        // Custom ranking algorithm based on user preferences
        const scoreA = calculatePersonalizedScore(a.predictions, { travelStyle, budget, preferences });
        const scoreB = calculatePersonalizedScore(b.predictions, { travelStyle, budget, preferences });
        return scoreB - scoreA;
      });

    const recommendations = {
      userId,
      totalDestinations: destinations.length,
      successfulPredictions: rankedDestinations.length,
      rankedDestinations,
      topRecommendation: rankedDestinations[0] || null,
      generatedAt: new Date().toISOString(),
      criteria: { travelStyle, budget, duration, travelers, preferences }
    };

    res.json({
      success: true,
      data: recommendations,
      message: 'Personalized recommendations generated successfully'
    });
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalized recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to calculate personalized scores
function calculatePersonalizedScore(predictions, userProfile) {
  let score = 0;
  const { travelStyle, budget, preferences } = userProfile;

  // Base confidence score
  score += (predictions.confidence || 0) * 100;

  // Weather preferences
  if (predictions.weather && predictions.weather.travelComfortIndex) {
    score += predictions.weather.travelComfortIndex * 0.3;
  }

  // Crowd preferences
  if (predictions.crowds) {
    if (travelStyle === 'adventure' && predictions.crowds.averageCrowdLevel < 5) {
      score += 20; // Adventure travelers prefer fewer crowds
    } else if (travelStyle === 'leisure' && predictions.crowds.averageCrowdLevel < 7) {
      score += 15; // Leisure travelers are moderately crowd-averse
    }
  }

  // Budget considerations
  if (predictions.pricing) {
    const budgetMultiplier = budget === 'budget' ? 1.5 : budget === 'medium' ? 1.2 : 1.0;
    if (predictions.pricing.overallScore) {
      score += predictions.pricing.overallScore * budgetMultiplier * 0.4;
    }
  }

  // Timing bonus
  if (predictions.optimalTiming && predictions.optimalTiming.overallScore) {
    score += predictions.optimalTiming.overallScore * 0.3;
  }

  return Math.round(score);
}

// Get cached predictions
router.get('/cache/:destination', async (req, res) => {
  try {
    const { destination } = req.params;
    
    // Check if we have cached predictions
    const cacheKey = `predictions_${destination}`;
    
    if (predictiveService.predictionCache.has(cacheKey)) {
      const cached = predictiveService.predictionCache.get(cacheKey);
      const age = Date.now() - cached.timestamp;
      
      if (age < predictiveService.cacheExpiry) {
        res.json({
          success: true,
          data: {
            ...cached.data,
            cached: true,
            cacheAge: Math.round(age / 1000 / 60), // minutes
            cacheExpiry: Math.round((predictiveService.cacheExpiry - age) / 1000 / 60) // minutes until expiry
          },
          message: 'Cached predictions retrieved successfully'
        });
        return;
      }
    }

    res.status(404).json({
      success: false,
      message: 'No cached predictions found for this destination'
    });
  } catch (error) {
    console.error('Error getting cached predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cached predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Clear prediction cache
router.delete('/cache', async (req, res) => {
  try {
    const { destination } = req.query;
    
    if (destination) {
      // Clear cache for specific destination
      const cacheKey = `predictions_${destination}`;
      predictiveService.predictionCache.delete(cacheKey);
      
      res.json({
        success: true,
        message: `Cache cleared for ${destination}`
      });
    } else {
      // Clear all cache
      predictiveService.predictionCache.clear();
      
      res.json({
        success: true,
        message: 'All prediction cache cleared'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;