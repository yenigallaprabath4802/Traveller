const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware);

// Mock POI data for demonstration
const mockPOIs = {
  restaurant: [
    {
      id: 'rest_1',
      name: 'Katz\'s Delicatessen',
      category: 'restaurant',
      coordinates: [-73.9873, 40.7223],
      rating: 4.4,
      description: 'Famous Jewish deli since 1888',
      address: '205 E Houston St, New York, NY 10002',
      phone: '+1 212-254-2246',
      hours: '8:00 AM - 10:45 PM',
      priceLevel: 2,
      reviews: 3421
    },
    {
      id: 'rest_2',
      name: 'Joe\'s Pizza',
      category: 'restaurant',
      coordinates: [-73.9857, 40.7589],
      rating: 4.2,
      description: 'Classic New York pizza slice',
      address: '1435 Broadway, New York, NY 10018',
      phone: '+1 212-391-7940',
      hours: '10:00 AM - 4:00 AM',
      priceLevel: 1,
      reviews: 2876
    }
  ],
  hotel: [
    {
      id: 'hotel_1',
      name: 'The Plaza Hotel',
      category: 'hotel',
      coordinates: [-73.9743, 40.7648],
      rating: 4.6,
      description: 'Luxury hotel in Midtown Manhattan',
      address: '768 5th Ave, New York, NY 10019',
      phone: '+1 212-759-3000',
      website: 'https://theplaza.com',
      priceLevel: 4,
      reviews: 1234
    },
    {
      id: 'hotel_2',
      name: 'Pod Hotels',
      category: 'hotel',
      coordinates: [-73.9857, 40.7505],
      rating: 4.1,
      description: 'Modern micro-rooms in Times Square',
      address: '1431 Broadway, New York, NY 10018',
      phone: '+1 212-355-0300',
      website: 'https://podhotels.com',
      priceLevel: 2,
      reviews: 987
    }
  ],
  attraction: [
    {
      id: 'attr_1',
      name: 'Central Park',
      category: 'attraction',
      coordinates: [-73.9665, 40.7829],
      rating: 4.8,
      description: 'Beautiful urban park in Manhattan',
      address: 'New York, NY 10024',
      hours: '6:00 AM - 1:00 AM',
      priceLevel: 0,
      reviews: 12543
    },
    {
      id: 'attr_2',
      name: 'Empire State Building',
      category: 'attraction',
      coordinates: [-73.9857, 40.7484],
      rating: 4.5,
      description: 'Iconic Art Deco skyscraper',
      address: '20 W 34th St, New York, NY 10001',
      phone: '+1 212-736-3100',
      website: 'https://www.esbnyc.com',
      hours: '9:00 AM - 2:00 AM',
      priceLevel: 3,
      reviews: 8765
    }
  ],
  shopping: [
    {
      id: 'shop_1',
      name: 'Times Square',
      category: 'shopping',
      coordinates: [-73.9857, 40.7580],
      rating: 4.3,
      description: 'Famous commercial intersection',
      address: 'Times Square, New York, NY 10036',
      hours: '24/7',
      priceLevel: 3,
      reviews: 5432
    }
  ],
  gas_station: [
    {
      id: 'gas_1',
      name: 'Shell',
      category: 'gas_station',
      coordinates: [-73.9897, 40.7505],
      rating: 3.8,
      description: 'Gas station with convenience store',
      address: '511 W 42nd St, New York, NY 10036',
      phone: '+1 212-564-2890',
      hours: '24/7',
      priceLevel: 2,
      reviews: 234
    }
  ],
  hospital: [
    {
      id: 'hosp_1',
      name: 'Mount Sinai Hospital',
      category: 'hospital',
      coordinates: [-73.9514, 40.7903],
      rating: 4.2,
      description: 'Major medical center',
      address: '1 Gustave L. Levy Pl, New York, NY 10029',
      phone: '+1 212-241-6500',
      website: 'https://www.mountsinai.org',
      hours: '24/7',
      reviews: 876
    }
  ],
  cafe: [
    {
      id: 'cafe_1',
      name: 'Starbucks',
      category: 'cafe',
      coordinates: [-73.9857, 40.7614],
      rating: 4.0,
      description: 'Popular coffee chain',
      address: '1585 Broadway, New York, NY 10036',
      phone: '+1 212-586-6960',
      hours: '5:00 AM - 11:00 PM',
      priceLevel: 2,
      reviews: 567
    }
  ]
};

// GET /api/pois/search - Search for POIs near a location
router.get('/search', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      category = 'all',
      radius = 5000, // meters
      limit = 20,
      minRating = 0
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Latitude and longitude are required'
      });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    // Filter POIs by category
    let allPOIs = [];
    if (category === 'all') {
      allPOIs = Object.values(mockPOIs).flat();
    } else if (mockPOIs[category]) {
      allPOIs = mockPOIs[category];
    }

    // Calculate distance and filter by radius and rating
    const nearbyPOIs = allPOIs
      .map(poi => ({
        ...poi,
        distance: calculateDistance(lat, lng, poi.coordinates[1], poi.coordinates[0])
      }))
      .filter(poi => 
        poi.distance <= radius && 
        (poi.rating || 0) >= parseFloat(minRating)
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit));

    res.json({
      pois: nearbyPOIs,
      total: nearbyPOIs.length,
      searchParams: {
        center: [lng, lat],
        category,
        radius,
        limit
      }
    });

  } catch (error) {
    console.error('Error searching POIs:', error);
    res.status(500).json({
      error: 'Failed to search POIs',
      details: error.message
    });
  }
});

// GET /api/pois/:id - Get detailed POI information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find POI in mock data
    const allPOIs = Object.values(mockPOIs).flat();
    const poi = allPOIs.find(p => p.id === id);

    if (!poi) {
      return res.status(404).json({
        error: 'POI not found'
      });
    }

    // Add additional details (mock data)
    const detailedPOI = {
      ...poi,
      photos: [
        `https://picsum.photos/400/300?random=${poi.id}1`,
        `https://picsum.photos/400/300?random=${poi.id}2`,
        `https://picsum.photos/400/300?random=${poi.id}3`
      ],
      amenities: getAmenitiesForCategory(poi.category),
      nearbyTransit: [
        {
          type: 'subway',
          name: '42nd St - Port Authority',
          distance: 200,
          lines: ['A', 'C', 'E']
        },
        {
          type: 'bus',
          name: 'M42 Bus Stop',
          distance: 50,
          routes: ['M42']
        }
      ],
      businessStatus: 'OPERATIONAL',
      priceRange: getPriceRange(poi.priceLevel),
      tags: getTagsForCategory(poi.category)
    };

    res.json({ poi: detailedPOI });

  } catch (error) {
    console.error('Error fetching POI details:', error);
    res.status(500).json({
      error: 'Failed to fetch POI details',
      details: error.message
    });
  }
});

// POST /api/pois/directions - Get directions between two points
router.post('/directions', async (req, res) => {
  try {
    const {
      origin,
      destination,
      profile = 'driving', // driving, walking, cycling
      alternatives = true,
      steps = true
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        error: 'Origin and destination coordinates are required'
      });
    }

    // Mock directions response (replace with real Mapbox API call)
    const mockDirections = {
      routes: [
        {
          distance: 2500, // meters
          duration: 480, // seconds
          geometry: 'sample_encoded_polyline',
          legs: [
            {
              distance: 2500,
              duration: 480,
              steps: [
                {
                  distance: 500,
                  duration: 96,
                  instruction: 'Head north on Broadway',
                  geometry: 'step_polyline_1'
                },
                {
                  distance: 800,
                  duration: 144,
                  instruction: 'Turn right onto W 42nd St',
                  geometry: 'step_polyline_2'
                },
                {
                  distance: 1200,
                  duration: 240,
                  instruction: 'Continue straight to destination',
                  geometry: 'step_polyline_3'
                }
              ]
            }
          ],
          weightName: 'routability',
          weight: 520.3
        }
      ],
      waypoints: [
        {
          name: 'Origin',
          location: origin
        },
        {
          name: 'Destination',
          location: destination
        }
      ]
    };

    res.json(mockDirections);

  } catch (error) {
    console.error('Error getting directions:', error);
    res.status(500).json({
      error: 'Failed to get directions',
      details: error.message
    });
  }
});

// GET /api/pois/categories - Get available POI categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      { id: 'restaurant', name: 'Restaurants', icon: '🍽️' },
      { id: 'hotel', name: 'Hotels', icon: '🏨' },
      { id: 'attraction', name: 'Attractions', icon: '📷' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️' },
      { id: 'gas_station', name: 'Gas Stations', icon: '⛽' },
      { id: 'hospital', name: 'Hospitals', icon: '🏥' },
      { id: 'cafe', name: 'Cafes', icon: '☕' }
    ];

    res.json({ categories });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
      details: error.message
    });
  }
});

// Utility functions
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

const getAmenitiesForCategory = (category) => {
  const amenitiesMap = {
    restaurant: ['WiFi', 'Outdoor Seating', 'Takeaway', 'Credit Cards'],
    hotel: ['WiFi', 'Parking', 'Room Service', 'Gym', 'Pool'],
    attraction: ['Gift Shop', 'Guided Tours', 'Audio Guide', 'Parking'],
    shopping: ['Credit Cards', 'WiFi', 'Parking', 'Gift Wrapping'],
    gas_station: ['24/7', 'Car Wash', 'Convenience Store', 'ATM'],
    hospital: ['Emergency Room', 'Parking', 'Pharmacy', 'Cafeteria'],
    cafe: ['WiFi', 'Outdoor Seating', 'Takeaway', 'Credit Cards']
  };
  return amenitiesMap[category] || [];
};

const getPriceRange = (level) => {
  const ranges = {
    0: 'Free',
    1: '$',
    2: '$$',
    3: '$$$',
    4: '$$$$'
  };
  return ranges[level] || 'Unknown';
};

const getTagsForCategory = (category) => {
  const tagsMap = {
    restaurant: ['food', 'dining', 'cuisine'],
    hotel: ['accommodation', 'lodging', 'stay'],
    attraction: ['sightseeing', 'tourist', 'landmark'],
    shopping: ['retail', 'store', 'mall'],
    gas_station: ['fuel', 'automotive', 'convenience'],
    hospital: ['medical', 'healthcare', 'emergency'],
    cafe: ['coffee', 'drinks', 'casual']
  };
  return tagsMap[category] || [];
};

module.exports = router;