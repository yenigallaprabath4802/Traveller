const express = require('express');
const multer = require('multer');
const router = express.Router();
const arLocationService = require('../services/arLocationService');
const authMiddleware = require('../middleware/auth');

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/ar-location/discover
 * @desc    Discover nearby POIs for AR visualization
 * @access  Private
 */
router.get('/discover', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 1000,
      categories = 'restaurant,attraction,hotel',
      minRating = 3.0,
      limit = 50,
      includeHistorical = true
    } = req.query;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    // Validate coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    // Parse categories
    const categoryList = categories.split(',').map(cat => cat.trim());

    // Prepare options
    const options = {
      radius: parseInt(radius),
      categories: categoryList,
      minRating: parseFloat(minRating),
      limit: parseInt(limit),
      includeHistorical: includeHistorical === 'true'
    };

    console.log(`🔍 AR Discovery request: ${lat}, ${lng} - Categories: ${categoryList.join(', ')}`);

    // Discover POIs
    const pois = await arLocationService.discoverNearbyPOIs(lat, lng, options);

    // Add AR-specific data
    const arPOIs = pois.map(poi => ({
      ...poi,
      arData: {
        // AR marker configuration
        marker: {
          type: getCategoryMarkerType(poi.category),
          color: getCategoryColor(poi.category),
          size: getMarkerSize(poi.distance, poi.rating),
          icon: getCategoryIcon(poi.category)
        },
        // 3D position for AR rendering
        position: {
          x: (poi.coordinates.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180),
          y: 0, // Will be calculated based on terrain
          z: -(poi.coordinates.lat - lat) * 111320
        },
        // Distance-based visibility
        visibility: {
          minDistance: 0,
          maxDistance: poi.distance > 500 ? 1000 : 500,
          fadeDistance: 50
        },
        // Interactive elements
        interactions: {
          clickable: true,
          showDetails: true,
          showDirections: true,
          allowFavorite: true
        }
      },
      // Additional AR metadata
      arMetadata: {
        lastUpdated: new Date().toISOString(),
        accuracy: calculateLocationAccuracy(poi.distance),
        confidence: calculatePOIConfidence(poi),
        source: poi.source
      }
    }));

    res.json({
      success: true,
      data: {
        pois: arPOIs,
        location: { latitude: lat, longitude: lng },
        searchRadius: options.radius,
        totalResults: arPOIs.length,
        categories: categoryList,
        timestamp: new Date().toISOString()
      },
      message: `Found ${arPOIs.length} AR locations near your position`
    });

  } catch (error) {
    console.error('AR Discovery error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to discover AR locations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/ar-location/search
 * @desc    Search for specific POIs with AR data
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      query,
      radius = 2000,
      limit = 20
    } = req.query;

    // Validate required parameters
    if (!latitude || !longitude || !query) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and search query are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    console.log(`🔍 AR Search: "${query}" near ${lat}, ${lng}`);

    // Search POIs
    const options = {
      radius: parseInt(radius),
      limit: parseInt(limit)
    };

    const pois = await arLocationService.searchPOIs(lat, lng, query, options);

    // Add AR-specific data
    const arSearchResults = pois.map(poi => ({
      ...poi,
      arData: {
        marker: {
          type: 'search',
          color: '#FF6B6B',
          size: getMarkerSize(poi.distance, poi.rating),
          icon: 'search'
        },
        position: {
          x: (poi.coordinates.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180),
          y: 0,
          z: -(poi.coordinates.lat - lat) * 111320
        },
        visibility: {
          minDistance: 0,
          maxDistance: 2000,
          fadeDistance: 100
        },
        interactions: {
          clickable: true,
          showDetails: true,
          showDirections: true,
          allowFavorite: true,
          highlighted: true // Highlight search results
        }
      },
      searchRelevance: calculateSearchRelevance(poi.name, poi.description, query)
    }));

    res.json({
      success: true,
      data: {
        pois: arSearchResults,
        query,
        location: { latitude: lat, longitude: lng },
        searchRadius: options.radius,
        totalResults: arSearchResults.length,
        timestamp: new Date().toISOString()
      },
      message: `Found ${arSearchResults.length} results for "${query}"`
    });

  } catch (error) {
    console.error('AR Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search AR locations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/ar-location/details/:poiId
 * @desc    Get detailed information about a specific POI
 * @access  Private
 */
router.get('/details/:poiId', async (req, res) => {
  try {
    const { poiId } = req.params;
    const { source = 'foursquare' } = req.query;

    if (!poiId) {
      return res.status(400).json({
        success: false,
        message: 'POI ID is required'
      });
    }

    console.log(`📍 Getting AR POI details: ${poiId}`);

    // Extract actual ID from our prefixed format
    let actualId = poiId;
    let detectedSource = source;

    if (poiId.startsWith('fsq_')) {
      actualId = poiId.replace('fsq_', '');
      detectedSource = 'foursquare';
    } else if (poiId.startsWith('gpl_')) {
      actualId = poiId.replace('gpl_', '').replace('search_', '');
      detectedSource = 'google';
    }

    // Get detailed POI information
    const poiDetails = await arLocationService.getPOIDetails(actualId, detectedSource);

    // Add AR-specific enhancements
    const arEnhancedDetails = {
      ...poiDetails,
      arExtensions: {
        // 360° photo markers
        photoMarkers: poiDetails.photos?.map((photo, index) => ({
          id: `photo_${index}`,
          url: photo,
          angle: (360 / poiDetails.photos.length) * index,
          distance: 5 // meters from POI center
        })) || [],
        
        // AR information panels
        infoPanels: [
          {
            id: 'main_info',
            type: 'main',
            content: {
              title: poiDetails.name,
              subtitle: poiDetails.category,
              rating: poiDetails.rating,
              priceRange: poiDetails.priceRange,
              isOpen: poiDetails.isOpen
            },
            position: { x: 0, y: 2, z: 0 }
          },
          {
            id: 'details_info',
            type: 'details',
            content: {
              description: poiDetails.description,
              visitDuration: poiDetails.visitDuration,
              bestTimeToVisit: poiDetails.bestTimeToVisit,
              tags: poiDetails.tags
            },
            position: { x: 2, y: 1.5, z: 0 }
          }
        ],

        // AR navigation aids
        navigation: {
          showCompass: true,
          showDistance: true,
          showDirection: true,
          pathfinding: true
        },

        // Interactive elements
        interactions: {
          allowPhotos: true,
          allowReviews: true,
          allowFavorites: true,
          allowSharing: true,
          showSimilar: true
        }
      },

      // Analytics data
      analytics: {
        viewCount: Math.floor(Math.random() * 1000) + 100,
        arViewCount: Math.floor(Math.random() * 50) + 10,
        lastViewed: new Date().toISOString(),
        popularity: calculatePopularityScore(poiDetails)
      }
    };

    res.json({
      success: true,
      data: arEnhancedDetails,
      message: 'POI details retrieved successfully'
    });

  } catch (error) {
    console.error('AR POI Details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get POI details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/ar-location/feedback
 * @desc    Submit feedback about AR POI accuracy
 * @access  Private
 */
router.post('/feedback', async (req, res) => {
  try {
    const {
      poiId,
      userLocation,
      feedback,
      accuracy,
      issues
    } = req.body;

    // Validate required fields
    if (!poiId || !userLocation || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'POI ID, user location, and feedback are required'
      });
    }

    console.log(`📝 AR Feedback received for POI: ${poiId}`);

    // Store feedback (in a real app, this would go to a database)
    const feedbackRecord = {
      id: `feedback_${Date.now()}`,
      poiId,
      userId: req.user?.id || 'anonymous',
      userLocation,
      feedback,
      accuracy: accuracy || 5,
      issues: issues || [],
      timestamp: new Date().toISOString(),
      source: 'ar_app'
    };

    // In a real application, save to database
    console.log('AR Feedback stored:', feedbackRecord);

    res.json({
      success: true,
      message: 'Thank you for your feedback! It helps improve AR accuracy.',
      data: {
        feedbackId: feedbackRecord.id,
        processed: true
      }
    });

  } catch (error) {
    console.error('AR Feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/ar-location/categories
 * @desc    Get available AR POI categories
 * @access  Private
 */
router.get('/categories', (req, res) => {
  try {
    const categories = [
      {
        id: 'restaurant',
        name: 'Restaurants',
        icon: 'utensils',
        color: '#FF6B6B',
        description: 'Find nearby restaurants and cafes'
      },
      {
        id: 'hotel',
        name: 'Hotels',
        icon: 'bed',
        color: '#4ECDC4',
        description: 'Discover accommodation options'
      },
      {
        id: 'attraction',
        name: 'Attractions',
        icon: 'map-pin',
        color: '#45B7D1',
        description: 'Explore tourist attractions and landmarks'
      },
      {
        id: 'shop',
        name: 'Shopping',
        icon: 'shopping-bag',
        color: '#96CEB4',
        description: 'Find stores and shopping centers'
      },
      {
        id: 'transport',
        name: 'Transport',
        icon: 'navigation',
        color: '#FFEAA7',
        description: 'Locate transportation hubs'
      },
      {
        id: 'medical',
        name: 'Medical',
        icon: 'plus',
        color: '#FD79A8',
        description: 'Find hospitals and pharmacies'
      },
      {
        id: 'entertainment',
        name: 'Entertainment',
        icon: 'music',
        color: '#A29BFE',
        description: 'Discover entertainment venues'
      }
    ];

    res.json({
      success: true,
      data: categories,
      message: 'AR categories retrieved successfully'
    });

  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get categories'
    });
  }
});

/**
 * @route   GET /api/ar-location/cache/stats
 * @desc    Get AR cache statistics
 * @access  Private
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = arLocationService.getCacheStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cache statistics'
    });
  }
});

/**
 * @route   DELETE /api/ar-location/cache
 * @desc    Clear AR cache
 * @access  Private
 */
router.delete('/cache', (req, res) => {
  try {
    const result = arLocationService.clearCache();
    
    res.json({
      success: true,
      data: result,
      message: 'AR cache cleared successfully'
    });

  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cache'
    });
  }
});

// Helper Functions

function getCategoryMarkerType(category) {
  const types = {
    restaurant: 'pin',
    hotel: 'building',
    attraction: 'star',
    shop: 'cube',
    transport: 'arrow',
    medical: 'cross',
    entertainment: 'sphere'
  };
  return types[category] || 'pin';
}

function getCategoryColor(category) {
  const colors = {
    restaurant: '#FF6B6B',
    hotel: '#4ECDC4',
    attraction: '#45B7D1',
    shop: '#96CEB4',
    transport: '#FFEAA7',
    medical: '#FD79A8',
    entertainment: '#A29BFE'
  };
  return colors[category] || '#45B7D1';
}

function getCategoryIcon(category) {
  const icons = {
    restaurant: 'utensils',
    hotel: 'bed',
    attraction: 'map-pin',
    shop: 'shopping-bag',
    transport: 'navigation',
    medical: 'plus',
    entertainment: 'music'
  };
  return icons[category] || 'map-pin';
}

function getMarkerSize(distance, rating) {
  // Base size adjusted by rating and proximity
  let size = 1.0;
  
  // Rating influence (0.8x to 1.4x)
  size *= (0.8 + (rating / 5) * 0.6);
  
  // Distance influence (closer = larger)
  if (distance < 100) size *= 1.2;
  else if (distance < 500) size *= 1.0;
  else size *= 0.8;
  
  return Math.max(0.5, Math.min(2.0, size));
}

function calculateLocationAccuracy(distance) {
  // Higher accuracy for closer locations
  if (distance < 50) return 'high';
  if (distance < 200) return 'medium';
  return 'low';
}

function calculatePOIConfidence(poi) {
  let confidence = 0.5;
  
  // Rating confidence
  if (poi.rating >= 4.0) confidence += 0.3;
  else if (poi.rating >= 3.5) confidence += 0.2;
  
  // Review count confidence
  if (poi.reviews > 100) confidence += 0.2;
  else if (poi.reviews > 20) confidence += 0.1;
  
  // AI enhancement confidence
  if (poi.aiEnhanced) confidence += 0.1;
  
  return Math.min(1.0, confidence);
}

function calculateSearchRelevance(name, description, query) {
  const queryLower = query.toLowerCase();
  const nameLower = name.toLowerCase();
  const descLower = (description || '').toLowerCase();
  
  let relevance = 0;
  
  // Exact name match
  if (nameLower.includes(queryLower)) relevance += 0.8;
  
  // Description match
  if (descLower.includes(queryLower)) relevance += 0.4;
  
  // Word matches
  const queryWords = queryLower.split(' ');
  queryWords.forEach(word => {
    if (nameLower.includes(word)) relevance += 0.2;
    if (descLower.includes(word)) relevance += 0.1;
  });
  
  return Math.min(1.0, relevance);
}

function calculatePopularityScore(poi) {
  let score = 0;
  
  // Rating influence
  score += (poi.rating / 5) * 40;
  
  // Review count influence
  score += Math.min((poi.reviews / 100) * 30, 30);
  
  // Recent activity (simulated)
  score += Math.random() * 30;
  
  return Math.round(score);
}

/**
 * @route   POST /api/ar-location/experience
 * @desc    Generate a complete AR experience for a location
 * @access  Private
 */
router.post('/experience', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 1000,
      categories = ['attraction', 'restaurant', 'hotel'],
      maxLandmarks = 10,
      userPreferences = {}
    } = req.body;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    console.log(`🔮 Generating AR experience at ${lat}, ${lng}`);

    // Generate AR experience
    const experience = await arLocationService.generateARExperience(lat, lng, {
      radius: parseInt(radius),
      categories,
      maxLandmarks: parseInt(maxLandmarks),
      userPreferences
    });

    res.json({
      success: true,
      data: experience,
      message: 'AR experience generated successfully'
    });

  } catch (error) {
    console.error('AR Experience generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AR experience',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/ar-location/identify-landmark
 * @desc    Identify landmark from uploaded image
 * @access  Private
 */
router.post('/identify-landmark', upload.single('image'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates provided'
      });
    }

    console.log(`🖼️ Identifying landmark from image at ${lat}, ${lng}`);

    // Identify landmark from image
    const identification = await arLocationService.identifyLandmarkFromImage(
      req.file.buffer,
      { latitude: lat, longitude: lng }
    );

    res.json({
      success: true,
      data: identification,
      message: identification.identified 
        ? 'Landmark identified successfully' 
        : 'Could not identify specific landmark'
    });

  } catch (error) {
    console.error('Landmark identification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to identify landmark',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/ar-location/compass/:bearing
 * @desc    Get AR compass information for a specific bearing
 * @access  Private
 */
router.get('/compass/:bearing', async (req, res) => {
  try {
    const { bearing } = req.params;
    const { latitude, longitude, radius = 500 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const bearingNum = parseFloat(bearing);

    if (isNaN(lat) || isNaN(lng) || isNaN(bearingNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates or bearing provided'
      });
    }

    console.log(`🧭 Getting compass info for bearing ${bearingNum}° at ${lat}, ${lng}`);

    // Get nearby POIs
    const pois = await arLocationService.discoverNearbyPOIs(lat, lng, {
      radius: parseInt(radius),
      categories: ['attraction', 'restaurant', 'hotel'],
      limit: 20
    });

    // Filter POIs by bearing (within ±30 degrees)
    const compassPOIs = pois.filter(poi => {
      const poiBearing = calculateBearing(lat, lng, poi.coordinates.lat, poi.coordinates.lng);
      const bearingDiff = Math.abs(((poiBearing - bearingNum + 180) % 360) - 180);
      return bearingDiff <= 30;
    });

    // Add compass-specific data
    const compassData = {
      bearing: bearingNum,
      cardinal: getCardinalDirection(bearingNum),
      pois: compassPOIs.map(poi => ({
        ...poi,
        compassData: {
          relativeBearing: calculateBearing(lat, lng, poi.coordinates.lat, poi.coordinates.lng),
          bearingDifference: Math.abs(calculateBearing(lat, lng, poi.coordinates.lat, poi.coordinates.lng) - bearingNum),
          compassPosition: getCompassPosition(poi.distance, calculateBearing(lat, lng, poi.coordinates.lat, poi.coordinates.lng))
        }
      }))
    };

    res.json({
      success: true,
      data: compassData,
      message: `Found ${compassPOIs.length} locations in the ${getCardinalDirection(bearingNum)} direction`
    });

  } catch (error) {
    console.error('AR Compass error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get compass information',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   POST /api/ar-location/calibrate
 * @desc    Calibrate AR positioning based on user input
 * @access  Private
 */
router.post('/calibrate', async (req, res) => {
  try {
    const {
      userLocation,
      deviceOrientation,
      knownLandmarks,
      calibrationData
    } = req.body;

    if (!userLocation || !deviceOrientation) {
      return res.status(400).json({
        success: false,
        message: 'User location and device orientation are required'
      });
    }

    console.log(`🎯 Calibrating AR positioning at ${userLocation.latitude}, ${userLocation.longitude}`);

    // Perform AR calibration
    const calibrationResult = {
      id: `calibration_${Date.now()}`,
      userLocation,
      deviceOrientation,
      calibrationTimestamp: new Date().toISOString(),
      adjustments: {
        positionOffset: calculatePositionOffset(userLocation, knownLandmarks),
        orientationCorrection: calculateOrientationCorrection(deviceOrientation, knownLandmarks),
        magneticDeclination: getMagneticDeclination(userLocation.latitude, userLocation.longitude),
        gpsAccuracy: calibrationData?.gpsAccuracy || 'medium'
      },
      confidence: calculateCalibrationConfidence(knownLandmarks),
      recommendations: generateCalibrationRecommendations(calibrationData)
    };

    res.json({
      success: true,
      data: calibrationResult,
      message: 'AR positioning calibrated successfully'
    });

  } catch (error) {
    console.error('AR Calibration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calibrate AR positioning',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/ar-location/analytics
 * @desc    Get AR usage analytics
 * @access  Private
 */
router.get('/analytics', async (req, res) => {
  try {
    const { timeframe = '7d', userId } = req.query;

    console.log(`📊 Getting AR analytics for timeframe: ${timeframe}`);

    // Generate analytics data (in a real app, this would come from a database)
    const analytics = {
      timeframe,
      userId: userId || req.user?.id,
      metrics: {
        totalARSessions: Math.floor(Math.random() * 100) + 50,
        averageSessionDuration: `${Math.floor(Math.random() * 10) + 5} minutes`,
        landmarksDiscovered: Math.floor(Math.random() * 50) + 25,
        photosShared: Math.floor(Math.random() * 20) + 10,
        reviewsSubmitted: Math.floor(Math.random() * 15) + 5
      },
      topCategories: [
        { category: 'attraction', views: 45, percentage: 35 },
        { category: 'restaurant', views: 32, percentage: 25 },
        { category: 'hotel', views: 26, percentage: 20 },
        { category: 'shop', views: 19, percentage: 15 },
        { category: 'entertainment', views: 6, percentage: 5 }
      ],
      popularLandmarks: [
        { name: 'Central Park', views: 23, rating: 4.8 },
        { name: 'Times Square', views: 19, rating: 4.5 },
        { name: 'Brooklyn Bridge', views: 16, rating: 4.9 }
      ],
      usagePatterns: {
        peakHours: ['10:00-12:00', '14:00-16:00', '18:00-20:00'],
        preferredDistance: '200-500m',
        averageLandmarksPerSession: 8
      },
      achievements: [
        { name: 'Explorer', unlocked: true, date: '2024-01-15' },
        { name: 'Photographer', unlocked: true, date: '2024-01-18' },
        { name: 'Social Butterfly', unlocked: false, progress: 60 }
      ]
    };

    res.json({
      success: true,
      data: analytics,
      message: 'AR analytics retrieved successfully'
    });

  } catch (error) {
    console.error('AR Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AR analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper Functions for new routes

function calculateBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

function getCardinalDirection(bearing) {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

function getCompassPosition(distance, bearing) {
  // Convert to screen coordinates for compass display
  const angle = (bearing - 90) * Math.PI / 180; // Adjust for screen coordinates
  const maxRadius = 100; // Max compass radius in pixels
  const radius = Math.min(distance / 10, maxRadius); // Scale distance
  
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    radius: radius
  };
}

function calculatePositionOffset(userLocation, knownLandmarks) {
  // Simplified position offset calculation
  if (!knownLandmarks || knownLandmarks.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  
  // In a real implementation, this would use landmark positions for triangulation
  return {
    x: (Math.random() - 0.5) * 2, // ±1 meter
    y: 0,
    z: (Math.random() - 0.5) * 2
  };
}

function calculateOrientationCorrection(deviceOrientation, knownLandmarks) {
  // Simplified orientation correction
  return {
    yaw: (Math.random() - 0.5) * 10, // ±5 degrees
    pitch: (Math.random() - 0.5) * 4, // ±2 degrees
    roll: (Math.random() - 0.5) * 2   // ±1 degree
  };
}

function getMagneticDeclination(lat, lng) {
  // Simplified magnetic declination calculation
  // In a real app, this would use the World Magnetic Model
  return Math.sin(lat * Math.PI / 180) * Math.cos(lng * Math.PI / 180) * 15;
}

function calculateCalibrationConfidence(knownLandmarks) {
  if (!knownLandmarks || knownLandmarks.length === 0) return 0.5;
  
  const baseConfidence = Math.min(knownLandmarks.length / 3, 1) * 0.7;
  const randomFactor = Math.random() * 0.3;
  
  return Math.min(baseConfidence + randomFactor, 1.0);
}

function generateCalibrationRecommendations(calibrationData) {
  const recommendations = [];
  
  if (!calibrationData?.gpsAccuracy || calibrationData.gpsAccuracy === 'low') {
    recommendations.push('Move to an open area for better GPS signal');
  }
  
  if (!calibrationData?.compassCalibrated) {
    recommendations.push('Calibrate your device compass in device settings');
  }
  
  recommendations.push('Hold device steady during AR scanning');
  recommendations.push('Ensure good lighting for landmark recognition');
  
  return recommendations;
}

module.exports = router;