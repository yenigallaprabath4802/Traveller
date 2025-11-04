const express = require('express');
const LiveTravelDataService = require('../services/liveTravelDataService');

const router = express.Router();
const liveDataService = new LiveTravelDataService();

// Search flights with real-time data
router.post('/flights/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      adults,
      children,
      infants,
      travelClass,
      currency,
      providers,
      nonStop,
      maxResults
    } = req.body;

    // Validate required fields
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: origin, destination, departureDate'
      });
    }

    const searchParams = {
      origin,
      destination,
      departureDate,
      returnDate,
      adults: adults || 1,
      children: children || 0,
      infants: infants || 0,
      travelClass: travelClass || 'ECONOMY',
      currency: currency || 'USD',
      nonStop: nonStop || false,
      maxResults: maxResults || 50
    };

    const results = await liveDataService.searchFlights(
      searchParams,
      providers || ['amadeus', 'skyscanner']
    );

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      error: 'Flight search failed',
      details: error.message
    });
  }
});

// Search hotels with real-time data
router.post('/hotels/search', async (req, res) => {
  try {
    const {
      cityCode,
      latitude,
      longitude,
      checkInDate,
      checkOutDate,
      adults,
      rooms,
      priceRange,
      currency,
      sort,
      language,
      radius,
      providers
    } = req.body;

    // Validate required fields
    if ((!cityCode && (!latitude || !longitude)) || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: (cityCode or coordinates) and check-in/out dates'
      });
    }

    const searchParams = {
      cityCode,
      latitude,
      longitude,
      checkInDate,
      checkOutDate,
      adults: adults || 2,
      rooms: rooms || 1,
      priceRange: priceRange || '1-999',
      currency: currency || 'USD',
      sort: sort || 'PRICE',
      language: language || 'EN',
      radius: radius || 5
    };

    const results = await liveDataService.searchHotels(
      searchParams,
      providers || ['amadeus']
    );

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({
      success: false,
      error: 'Hotel search failed',
      details: error.message
    });
  }
});

// Get location suggestions
router.get('/locations/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters long'
      });
    }

    const suggestions = await liveDataService.getLocationSuggestions(query);

    res.json({
      success: true,
      data: {
        suggestions,
        query,
        count: suggestions.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({
      success: false,
      error: 'Location search failed',
      details: error.message
    });
  }
});

// Price tracking and alerts
router.post('/price-tracking/track', async (req, res) => {
  try {
    const {
      type, // 'flight' or 'hotel'
      origin,
      destination,
      departureDate,
      returnDate,
      checkInDate,
      checkOutDate,
      targetPrice,
      userId
    } = req.body;

    const trackingParams = {
      type,
      origin,
      destination,
      departureDate,
      returnDate,
      checkInDate,
      checkOutDate,
      targetPrice,
      userId
    };

    const trackingResult = await liveDataService.trackPrices(trackingParams);

    res.json({
      success: true,
      data: trackingResult,
      message: 'Price tracking initiated'
    });
  } catch (error) {
    console.error('Price tracking error:', error);
    res.status(500).json({
      success: false,
      error: 'Price tracking failed',
      details: error.message
    });
  }
});

// Get price alerts for user
router.get('/price-tracking/alerts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const alerts = await liveDataService.getPriceAlerts(userId);

    res.json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Price alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price alerts',
      details: error.message
    });
  }
});

// Compare prices across providers
router.post('/compare', async (req, res) => {
  try {
    const {
      type, // 'flights' or 'hotels'
      searchParams,
      providers
    } = req.body;

    let comparisonResults;

    if (type === 'flights') {
      comparisonResults = await liveDataService.searchFlights(
        searchParams,
        providers || ['amadeus', 'skyscanner']
      );
    } else if (type === 'hotels') {
      comparisonResults = await liveDataService.searchHotels(
        searchParams,
        providers || ['amadeus']
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid comparison type. Use "flights" or "hotels"'
      });
    }

    // Enhanced comparison analysis
    const analysis = {
      providerComparison: {},
      priceVariation: {},
      bestDeals: {},
      recommendations: comparisonResults.data?.recommendations || {}
    };

    // Analyze provider performance
    Object.entries(comparisonResults.data?.providers || {}).forEach(([provider, data]) => {
      if (!data.error) {
        const items = type === 'flights' ? data.flights : data.hotels;
        analysis.providerComparison[provider] = {
          totalResults: items?.length || 0,
          averagePrice: items?.length > 0 ? 
            items.reduce((sum, item) => 
              sum + (type === 'flights' ? item.price?.total : item.bestPrice?.total) || 0, 0
            ) / items.length : 0,
          priceRange: {
            min: items?.length > 0 ? 
              Math.min(...items.map(item => 
                type === 'flights' ? item.price?.total : item.bestPrice?.total
              ).filter(p => p > 0)) : 0,
            max: items?.length > 0 ? 
              Math.max(...items.map(item => 
                type === 'flights' ? item.price?.total : item.bestPrice?.total
              ).filter(p => p > 0)) : 0
          }
        };
      }
    });

    res.json({
      success: true,
      data: {
        ...comparisonResults.data,
        analysis
      },
      meta: comparisonResults.meta,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      success: false,
      error: 'Comparison failed',
      details: error.message
    });
  }
});

// Get live price updates (for real-time dashboard)
router.get('/live-prices/:trackingId', async (req, res) => {
  try {
    const { trackingId } = req.params;

    // In a real implementation, this would fetch from a real-time data source
    // For demo purposes, we'll simulate live price updates
    const mockLivePrices = {
      trackingId,
      currentPrice: Math.floor(Math.random() * 500) + 200,
      priceChange: Math.floor(Math.random() * 100) - 50,
      percentageChange: ((Math.random() - 0.5) * 20).toFixed(2),
      lastUpdate: new Date().toISOString(),
      trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)],
      alerts: [],
      historicalData: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        price: Math.floor(Math.random() * 100) + 200,
        timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString()
      }))
    };

    res.json({
      success: true,
      data: mockLivePrices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Live prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch live prices',
      details: error.message
    });
  }
});

// Get travel deals and recommendations
router.get('/deals', async (req, res) => {
  try {
    const {
      origin,
      budget,
      travelDates,
      interests,
      userId
    } = req.query;

    // In a real implementation, this would use AI to find personalized deals
    const mockDeals = {
      featured: [
        {
          id: 'deal_1',
          type: 'flight',
          title: 'Flash Sale: NYC to Paris',
          originalPrice: 899,
          dealPrice: 599,
          savings: 300,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Round-trip flights with major airline',
          tags: ['flash-sale', 'europe', 'round-trip']
        },
        {
          id: 'deal_2',
          type: 'hotel',
          title: 'Luxury Resort in Bali',
          originalPrice: 450,
          dealPrice: 299,
          savings: 151,
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          description: '4-night stay at 5-star beachfront resort',
          tags: ['luxury', 'beach', 'tropical']
        }
      ],
      personalized: [
        {
          id: 'personal_1',
          title: 'Based on your search history',
          deals: [
            {
              destination: 'Tokyo, Japan',
              price: 1299,
              savings: 200,
              matchReason: 'You searched for Asian destinations'
            }
          ]
        }
      ],
      trending: [
        {
          destination: 'Iceland',
          averagePrice: 699,
          priceChange: -15,
          popularityScore: 8.5,
          bestTime: 'September - October'
        }
      ]
    };

    res.json({
      success: true,
      data: mockDeals,
      filters: {
        origin,
        budget,
        travelDates,
        interests
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Deals fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deals',
      details: error.message
    });
  }
});

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Live Travel Data API',
    status: 'healthy',
    version: '1.0.0',
    endpoints: {
      flights: '/api/live-travel/flights/search',
      hotels: '/api/live-travel/hotels/search',
      locations: '/api/live-travel/locations/search',
      priceTracking: '/api/live-travel/price-tracking/track',
      comparison: '/api/live-travel/compare',
      livePrices: '/api/live-travel/live-prices/:trackingId',
      deals: '/api/live-travel/deals'
    },
    providers: {
      amadeus: process.env.AMADEUS_CLIENT_ID ? 'configured' : 'not configured',
      skyscanner: process.env.SKYSCANNER_API_KEY ? 'configured' : 'not configured'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;