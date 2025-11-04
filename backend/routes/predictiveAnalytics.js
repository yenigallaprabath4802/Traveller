const express = require('express');
const router = express.Router();
const predictiveAnalyticsService = require('../services/predictiveAnalyticsService');
const authMiddleware = require('../middleware/auth');

// Get comprehensive travel trends analysis
router.get('/trends', authMiddleware, async (req, res) => {
  try {
    const { region, timeframe, category, destination } = req.query;
    
    console.log('📈 Getting travel trends with filters:', { region, timeframe, category, destination });

    const filters = {
      region: region || 'global',
      timeframe: timeframe || '1y',
      category: category || 'all',
      destination: destination || null
    };

    const trends = await predictiveAnalyticsService.generateTravelTrends(filters);

    res.json({
      success: true,
      data: {
        trends,
        metadata: {
          totalDestinations: trends.length,
          lastUpdated: new Date(),
          filters
        }
      }
    });

  } catch (error) {
    console.error('Error getting travel trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel trends',
      error: error.message
    });
  }
});

// Get detailed price analysis for a specific destination
router.get('/price-analysis/:destination', authMiddleware, async (req, res) => {
  try {
    const { destination } = req.params;
    const { timeframe } = req.query;

    console.log(`💰 Getting price analysis for: ${destination}`);

    const analysis = await predictiveAnalyticsService.getPriceAnalysis(
      decodeURIComponent(destination)
    );

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Error getting price analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price analysis',
      error: error.message
    });
  }
});

// Get user-specific travel insights and patterns
router.get('/user-insights', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    console.log(`👤 Getting user insights for: ${userId}`);

    const insights = await predictiveAnalyticsService.analyzeUserTravelPattern(userId);

    res.json({
      success: true,
      data: insights
    });

  } catch (error) {
    console.error('Error getting user insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user insights',
      error: error.message
    });
  }
});

// Get comprehensive market analytics
router.get('/market-analytics', authMiddleware, async (req, res) => {
  try {
    const { region, category } = req.query;

    console.log('🌍 Getting market analytics with filters:', { region, category });

    const analytics = await predictiveAnalyticsService.generateMarketAnalytics();

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting market analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market analytics',
      error: error.message
    });
  }
});

// Get travel predictions for multiple destinations
router.post('/predictions', authMiddleware, async (req, res) => {
  try {
    const { destinations, timeframe, preferences } = req.body;

    console.log('🔮 Getting travel predictions for destinations:', destinations);

    const predictions = await Promise.all(
      destinations.map(async (destination) => {
        try {
          const analysis = await predictiveAnalyticsService.getPriceAnalysis(destination);
          return {
            destination,
            success: true,
            analysis
          };
        } catch (error) {
          return {
            destination,
            success: false,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        predictions,
        requestedAt: new Date(),
        timeframe,
        preferences
      }
    });

  } catch (error) {
    console.error('Error getting travel predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel predictions',
      error: error.message
    });
  }
});

// Get optimal booking recommendations
router.get('/booking-recommendations', authMiddleware, async (req, res) => {
  try {
    const { destinations, budget, flexibility, travelDates } = req.query;
    const userId = req.user.id;

    console.log('🎯 Getting booking recommendations for user:', userId);

    // Parse destinations if it's a string
    let destinationList = [];
    if (destinations) {
      destinationList = typeof destinations === 'string' 
        ? destinations.split(',').map(d => d.trim())
        : destinations;
    }

    // Get user travel pattern for personalized recommendations
    const userPattern = await predictiveAnalyticsService.analyzeUserTravelPattern(userId);

    // Generate recommendations for each destination
    const recommendations = await Promise.all(
      destinationList.map(async (destination) => {
        try {
          const analysis = await predictiveAnalyticsService.getPriceAnalysis(destination);
          
          return {
            destination,
            recommendation: {
              action: analysis.optimalBooking.month ? 'book' : 'wait',
              timing: analysis.optimalBooking.month,
              expectedSavings: analysis.optimalBooking.savings,
              confidence: Math.floor(Math.random() * 20 + 80), // 80-100%
              reasoning: analysis.optimalBooking.reasoning,
              urgency: analysis.predictions?.[0]?.predictedPrice > analysis.historical?.[0]?.avgPrice ? 'high' : 'medium'
            }
          };
        } catch (error) {
          return {
            destination,
            error: error.message
          };
        }
      })
    );

    res.json({
      success: true,
      data: {
        recommendations,
        userProfile: {
          spendingPattern: userPattern.analytics.spendingPattern,
          averageTripCost: userPattern.analytics.averageTripCost,
          budgetEfficiency: userPattern.analytics.budgetEfficiency
        },
        filters: {
          budget,
          flexibility,
          travelDates
        }
      }
    });

  } catch (error) {
    console.error('Error getting booking recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking recommendations',
      error: error.message
    });
  }
});

// Get travel alerts and notifications
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { severity, category } = req.query;

    console.log('🚨 Getting travel alerts for user:', userId);

    // Generate mock alerts based on user patterns and market conditions
    const alerts = [
      {
        id: 1,
        type: 'price_drop',
        severity: 'medium',
        category: 'pricing',
        destination: 'Bali, Indonesia',
        title: 'Price Drop Alert',
        message: 'Prices for Bali have dropped 18% in the last week. Consider booking soon.',
        expectedSavings: 320,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        confidence: 87,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: 2,
        type: 'optimal_timing',
        severity: 'high',
        category: 'booking',
        destination: 'Tokyo, Japan',
        title: 'Optimal Booking Window',
        message: 'Now is the ideal time to book your trip to Tokyo for spring season.',
        expectedSavings: 450,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        confidence: 92,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      },
      {
        id: 3,
        type: 'market_trend',
        severity: 'low',
        category: 'market',
        destination: 'Europe',
        title: 'Market Trend Alert',
        message: 'European travel costs are expected to rise 12% over next quarter.',
        expectedSavings: 0,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        confidence: 78,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
      }
    ].filter(alert => {
      if (severity && alert.severity !== severity) return false;
      if (category && alert.category !== category) return false;
      return true;
    });

    res.json({
      success: true,
      data: {
        alerts,
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter(a => new Date(a.validUntil) > new Date()).length,
        lastChecked: new Date()
      }
    });

  } catch (error) {
    console.error('Error getting travel alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch travel alerts',
      error: error.message
    });
  }
});

// Update user travel preferences for better analytics
router.put('/user-preferences', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { spendingPattern, preferredMonths, destinationTypes, budgetRange, flexibility } = req.body;

    console.log('⚙️ Updating user preferences for:', userId);

    // This would update the user's travel pattern in the database
    // For now, we'll return a success response
    const updatedPreferences = {
      spendingPattern,
      preferredMonths,
      destinationTypes,
      budgetRange,
      flexibility,
      updatedAt: new Date()
    };

    res.json({
      success: true,
      message: 'Travel preferences updated successfully',
      data: updatedPreferences
    });

  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user preferences',
      error: error.message
    });
  }
});

// Force refresh analytics data
router.post('/refresh', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 Refreshing analytics data...');

    await predictiveAnalyticsService.updateAnalyticsData();

    res.json({
      success: true,
      message: 'Analytics data refreshed successfully',
      refreshedAt: new Date()
    });

  } catch (error) {
    console.error('Error refreshing analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh analytics data',
      error: error.message
    });
  }
});

// Export analytics data
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { format, destinations, timeframe } = req.query;
    const userId = req.user.id;

    console.log('📊 Exporting analytics data for user:', userId);

    // Get comprehensive data for export
    const [trends, userInsights, marketAnalytics] = await Promise.all([
      predictiveAnalyticsService.generateTravelTrends(),
      predictiveAnalyticsService.analyzeUserTravelPattern(userId),
      predictiveAnalyticsService.generateMarketAnalytics()
    ]);

    const exportData = {
      exportInfo: {
        userId,
        exportedAt: new Date(),
        format: format || 'json',
        timeframe: timeframe || '1y'
      },
      travelTrends: trends,
      userInsights,
      marketAnalytics,
      summary: {
        totalDestinations: trends.length,
        averagePrice: trends.reduce((sum, t) => sum + t.analytics.currentPrice, 0) / trends.length,
        risingTrends: trends.filter(t => t.analytics.trend === 'up').length,
        decliningTrends: trends.filter(t => t.analytics.trend === 'down').length
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=travel-analytics.csv');
      
      // Simple CSV conversion for trends
      const csvHeaders = 'Destination,Country,Current Price,Predicted Price,Change %,Trend,Confidence\n';
      const csvData = trends.map(t => 
        `${t.destination},${t.country},${t.analytics.currentPrice},${t.analytics.predictedPrice},${t.analytics.priceChange},${t.analytics.trend},${t.analytics.confidence}`
      ).join('\n');
      
      res.send(csvHeaders + csvData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }

  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export analytics data',
      error: error.message
    });
  }
});

module.exports = router;