const axios = require('axios');
const { OpenAI } = require('openai');

class ARLocationService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // External API configurations
    this.apis = {
      foursquare: {
        baseUrl: 'https://api.foursquare.com/v3/places',
        apiKey: process.env.FOURSQUARE_API_KEY,
        headers: {
          'Authorization': `fsq3/ObXzA2vZpPJffKNBGCgAIpV+tqiSi1+Abh18bW8yAk=`,
          'Accept': 'application/json'
        }
      },
      googlePlaces: {
        baseUrl: 'https://maps.googleapis.com/maps/api/place',
        apiKey: process.env.GOOGLE_PLACES_API_KEY
      },
      mapbox: {
        baseUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places',
        apiKey: process.env.MAPBOX_API_KEY
      }
    };

    // POI categories mapping
    this.categoryMapping = {
      restaurant: ['restaurant', 'food', 'cafe', 'bar', 'bakery'],
      hotel: ['hotel', 'lodging', 'accommodation', 'hostel', 'resort'],
      attraction: ['tourist_attraction', 'museum', 'park', 'monument', 'landmark'],
      shop: ['store', 'shopping_mall', 'market', 'boutique', 'mall'],
      transport: ['transit_station', 'bus_station', 'subway_station', 'airport', 'taxi_stand'],
      medical: ['hospital', 'pharmacy', 'clinic', 'doctor', 'emergency'],
      entertainment: ['movie_theater', 'night_club', 'casino', 'amusement_park', 'zoo']
    };

    // Cache for POI data
    this.poisCache = new Map();
    this.historicalCache = new Map();
  }

  // Main method to discover nearby POIs
  async discoverNearbyPOIs(latitude, longitude, options = {}) {
    try {
      const {
        radius = 1000,
        categories = ['restaurant', 'attraction', 'hotel'],
        minRating = 3.0,
        limit = 50,
        includeHistorical = true
      } = options;

      console.log(`🔍 Discovering POIs near ${latitude}, ${longitude} within ${radius}m`);

      // Check cache first
      const cacheKey = `${latitude.toFixed(4)}_${longitude.toFixed(4)}_${radius}_${categories.join(',')}`;
      if (this.poisCache.has(cacheKey)) {
        console.log('📦 Returning cached POI data');
        return this.poisCache.get(cacheKey);
      }

      // Fetch POIs from multiple sources
      const poisPromises = [
        this.fetchFoursquarePOIs(latitude, longitude, radius, categories, limit),
        this.fetchGooglePlacesPOIs(latitude, longitude, radius, categories, limit)
      ];

      const results = await Promise.allSettled(poisPromises);
      let allPOIs = [];

      // Combine results from all sources
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allPOIs = allPOIs.concat(result.value);
          console.log(`✅ Source ${index + 1} returned ${result.value.length} POIs`);
        } else {
          console.error(`❌ Source ${index + 1} failed:`, result.reason);
        }
      });

      // Remove duplicates and enhance POIs
      const uniquePOIs = this.removeDuplicatePOIs(allPOIs);
      const enhancedPOIs = await this.enhancePOIsWithAI(uniquePOIs, { includeHistorical });

      // Filter by rating and limit results
      const filteredPOIs = enhancedPOIs
        .filter(poi => poi.rating >= minRating)
        .slice(0, limit);

      // Cache the results
      this.poisCache.set(cacheKey, filteredPOIs);
      
      // Set cache expiration (30 minutes)
      setTimeout(() => {
        this.poisCache.delete(cacheKey);
      }, 30 * 60 * 1000);

      console.log(`✨ Returning ${filteredPOIs.length} enhanced POIs`);
      return filteredPOIs;

    } catch (error) {
      console.error('Error discovering POIs:', error);
      throw new Error('Failed to discover nearby locations: ' + error.message);
    }
  }

  // Fetch POIs from Foursquare API
  async fetchFoursquarePOIs(lat, lng, radius, categories, limit) {
    try {
      console.log('🏢 Fetching POIs from Foursquare...');

      const categoryIds = this.mapCategoriesToFoursquare(categories);
      
      const response = await axios.get(`${this.apis.foursquare.baseUrl}/search`, {
        headers: this.apis.foursquare.headers,
        params: {
          ll: `${lat},${lng}`,
          radius,
          categories: categoryIds.join(','),
          limit: Math.min(limit, 50),
          fields: 'name,location,categories,rating,price,hours,description,tel,website,photos'
        }
      });

      return this.transformFoursquarePOIs(response.data.results, lat, lng);

    } catch (error) {
      console.error('Foursquare API error:', error.response?.data || error.message);
      return [];
    }
  }

  // Fetch POIs from Google Places API
  async fetchGooglePlacesPOIs(lat, lng, radius, categories, limit) {
    try {
      console.log('🌐 Fetching POIs from Google Places...');

      const allPOIs = [];
      
      for (const category of categories) {
        try {
          const response = await axios.get(`${this.apis.googlePlaces.baseUrl}/nearbysearch/json`, {
            params: {
              location: `${lat},${lng}`,
              radius,
              type: this.categoryMapping[category]?.[0] || category,
              key: this.apis.googlePlaces.apiKey
            }
          });

          if (response.data.results) {
            const transformedPOIs = this.transformGooglePlacesPOIs(response.data.results, lat, lng, category);
            allPOIs.push(...transformedPOIs);
          }
        } catch (categoryError) {
          console.error(`Google Places error for category ${category}:`, categoryError.message);
        }
      }

      return allPOIs.slice(0, limit);

    } catch (error) {
      console.error('Google Places API error:', error.response?.data || error.message);
      return [];
    }
  }

  // Transform Foursquare POI data
  transformFoursquarePOIs(pois, userLat, userLng) {
    return pois.map(poi => {
      const distance = this.calculateDistance(
        userLat, userLng,
        poi.geocodes?.main?.latitude || poi.location?.lat || 0,
        poi.geocodes?.main?.longitude || poi.location?.lng || 0
      );

      return {
        id: `fsq_${poi.fsq_id}`,
        name: poi.name,
        category: this.mapFoursquareCategoryToStandard(poi.categories?.[0]?.name),
        coordinates: {
          lat: poi.geocodes?.main?.latitude || poi.location?.lat || 0,
          lng: poi.geocodes?.main?.longitude || poi.location?.lng || 0
        },
        distance: Math.round(distance),
        bearing: this.calculateBearing(
          userLat, userLng,
          poi.geocodes?.main?.latitude || poi.location?.lat || 0,
          poi.geocodes?.main?.longitude || poi.location?.lng || 0
        ),
        rating: poi.rating || 3.5,
        priceRange: this.mapPriceLevel(poi.price),
        isOpen: this.determineOpenStatus(poi.hours),
        description: poi.description || 'Discover this amazing place in your area.',
        phone: poi.tel,
        website: poi.website,
        tags: this.generateTags(poi.categories),
        photos: poi.photos?.map(photo => `${photo.prefix}300x300${photo.suffix}`) || [],
        reviews: Math.floor(Math.random() * 500) + 50, // Placeholder
        estimatedTime: this.calculateEstimatedTime(distance),
        source: 'foursquare'
      };
    });
  }

  // Transform Google Places POI data
  transformGooglePlacesPOIs(pois, userLat, userLng, category) {
    return pois.map(poi => {
      const distance = this.calculateDistance(
        userLat, userLng,
        poi.geometry?.location?.lat || 0,
        poi.geometry?.location?.lng || 0
      );

      return {
        id: `gpl_${poi.place_id}`,
        name: poi.name,
        category: category,
        coordinates: {
          lat: poi.geometry?.location?.lat || 0,
          lng: poi.geometry?.location?.lng || 0
        },
        distance: Math.round(distance),
        bearing: this.calculateBearing(
          userLat, userLng,
          poi.geometry?.location?.lat || 0,
          poi.geometry?.location?.lng || 0
        ),
        rating: poi.rating || 3.5,
        priceRange: this.mapGooglePriceLevel(poi.price_level),
        isOpen: poi.opening_hours?.open_now !== false,
        description: `Highly rated ${category} in your area.`,
        phone: null,
        website: null,
        tags: poi.types?.slice(0, 3) || [],
        photos: poi.photos?.slice(0, 3).map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${photo.photo_reference}&key=${this.apis.googlePlaces.apiKey}`
        ) || [],
        reviews: poi.user_ratings_total || 0,
        estimatedTime: this.calculateEstimatedTime(distance),
        source: 'google'
      };
    });
  }

  // Enhance POIs with AI-generated content
  async enhancePOIsWithAI(pois, options = {}) {
    try {
      console.log(`🤖 Enhancing ${pois.length} POIs with AI content...`);

      const enhancedPOIs = [];
      
      // Process POIs in batches to avoid API limits
      const batchSize = 5;
      for (let i = 0; i < pois.length; i += batchSize) {
        const batch = pois.slice(i, i + batchSize);
        
        const batchPromises = batch.map(poi => this.enhanceSinglePOI(poi, options));
        const enhancedBatch = await Promise.allSettled(batchPromises);
        
        enhancedBatch.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            enhancedPOIs.push(result.value);
          } else {
            console.error(`Failed to enhance POI ${batch[index].name}:`, result.reason);
            enhancedPOIs.push(batch[index]); // Use original POI
          }
        });

        // Small delay between batches
        if (i + batchSize < pois.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return enhancedPOIs;

    } catch (error) {
      console.error('Error enhancing POIs with AI:', error);
      return pois; // Return original POIs if enhancement fails
    }
  }

  // Enhance single POI with AI
  async enhanceSinglePOI(poi, options = {}) {
    try {
      const enhancementPrompt = `
      Enhance this location data with engaging and informative content:

      Name: ${poi.name}
      Category: ${poi.category}
      Current Description: ${poi.description}
      Location: ${poi.coordinates.lat}, ${poi.coordinates.lng}
      Rating: ${poi.rating}

      Please provide:
      1. An engaging 1-2 sentence description
      2. 3-5 relevant tags/keywords
      3. ${options.includeHistorical ? 'Historical information if this is a notable location' : 'Skip historical info'}
      4. Estimated visit duration
      5. Best time to visit

      Return JSON format:
      {
        "description": "engaging description",
        "tags": ["tag1", "tag2", "tag3"],
        "historicalInfo": "historical context or null",
        "visitDuration": "30 minutes",
        "bestTimeToVisit": "Morning hours"
      }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: enhancementPrompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      const enhancement = JSON.parse(response.choices[0].message.content);

      return {
        ...poi,
        description: enhancement.description || poi.description,
        tags: [...new Set([...poi.tags, ...enhancement.tags])].slice(0, 5),
        historicalInfo: enhancement.historicalInfo,
        visitDuration: enhancement.visitDuration,
        bestTimeToVisit: enhancement.bestTimeToVisit,
        aiEnhanced: true
      };

    } catch (error) {
      console.error('Error enhancing single POI:', error);
      return poi;
    }
  }

  // Remove duplicate POIs based on name and location
  removeDuplicatePOIs(pois) {
    const uniqueMap = new Map();
    
    pois.forEach(poi => {
      const key = `${poi.name.toLowerCase()}_${poi.coordinates.lat.toFixed(4)}_${poi.coordinates.lng.toFixed(4)}`;
      
      if (!uniqueMap.has(key) || uniqueMap.get(key).rating < poi.rating) {
        uniqueMap.set(key, poi);
      }
    });

    return Array.from(uniqueMap.values());
  }

  // Calculate distance between two points
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Calculate bearing between two points
  calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }

  // Calculate estimated walking time
  calculateEstimatedTime(distance) {
    const walkingSpeed = 80; // meters per minute
    const minutes = Math.ceil(distance / walkingSpeed);
    
    if (minutes < 60) {
      return `${minutes} min walk`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes}m walk`;
    }
  }

  // Map categories to Foursquare category IDs
  mapCategoriesToFoursquare(categories) {
    const mapping = {
      restaurant: '13065',
      hotel: '19014',
      attraction: '16000',
      shop: '17000',
      transport: '19040',
      medical: '15014',
      entertainment: '10000'
    };

    return categories.map(cat => mapping[cat]).filter(Boolean);
  }

  // Map Foursquare category to standard category
  mapFoursquareCategoryToStandard(categoryName) {
    if (!categoryName) return 'attraction';
    
    const name = categoryName.toLowerCase();
    if (name.includes('restaurant') || name.includes('food') || name.includes('cafe')) return 'restaurant';
    if (name.includes('hotel') || name.includes('lodging')) return 'hotel';
    if (name.includes('shop') || name.includes('store') || name.includes('retail')) return 'shop';
    if (name.includes('transport') || name.includes('station')) return 'transport';
    if (name.includes('medical') || name.includes('hospital') || name.includes('pharmacy')) return 'medical';
    if (name.includes('entertainment') || name.includes('theater') || name.includes('club')) return 'entertainment';
    
    return 'attraction';
  }

  // Map price level to string
  mapPriceLevel(priceLevel) {
    if (typeof priceLevel === 'number') {
      switch (priceLevel) {
        case 1: return '$';
        case 2: return '$$';
        case 3: return '$$$';
        case 4: return '$$$$';
        default: return '$$';
      }
    }
    return '$$';
  }

  // Map Google price level to string
  mapGooglePriceLevel(priceLevel) {
    switch (priceLevel) {
      case 0: return '$';
      case 1: return '$';
      case 2: return '$$';
      case 3: return '$$$';
      case 4: return '$$$$';
      default: return '$$';
    }
  }

  // Determine if place is open
  determineOpenStatus(hours) {
    if (!hours || !hours.display) return true; // Default to open if no hours info
    
    const now = new Date();
    const currentHour = now.getHours();
    
    // Simple heuristic - most places are open during day hours
    return currentHour >= 8 && currentHour <= 22;
  }

  // Generate tags from categories
  generateTags(categories) {
    if (!categories || !Array.isArray(categories)) return [];
    
    return categories
      .map(cat => cat.name || cat)
      .filter(Boolean)
      .slice(0, 3);
  }

  // Search POIs by query
  async searchPOIs(latitude, longitude, query, options = {}) {
    try {
      console.log(`🔍 Searching for "${query}" near ${latitude}, ${longitude}`);

      const {
        radius = 2000,
        limit = 20
      } = options;

      // Search using multiple sources
      const searchPromises = [
        this.searchFoursquare(latitude, longitude, query, radius, limit),
        this.searchGooglePlaces(latitude, longitude, query, radius, limit)
      ];

      const results = await Promise.allSettled(searchPromises);
      let allPOIs = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allPOIs = allPOIs.concat(result.value);
        }
      });

      // Remove duplicates and enhance
      const uniquePOIs = this.removeDuplicatePOIs(allPOIs);
      const enhancedPOIs = await this.enhancePOIsWithAI(uniquePOIs.slice(0, limit));

      return enhancedPOIs;

    } catch (error) {
      console.error('Error searching POIs:', error);
      throw new Error('Failed to search locations: ' + error.message);
    }
  }

  // Search Foursquare by query
  async searchFoursquare(lat, lng, query, radius, limit) {
    try {
      const response = await axios.get(`${this.apis.foursquare.baseUrl}/search`, {
        headers: this.apis.foursquare.headers,
        params: {
          ll: `${lat},${lng}`,
          query,
          radius,
          limit: Math.min(limit, 25),
          fields: 'name,location,categories,rating,price,hours,description,tel,website,photos'
        }
      });

      return this.transformFoursquarePOIs(response.data.results, lat, lng);

    } catch (error) {
      console.error('Foursquare search error:', error);
      return [];
    }
  }

  // Search Google Places by query
  async searchGooglePlaces(lat, lng, query, radius, limit) {
    try {
      const response = await axios.get(`${this.apis.googlePlaces.baseUrl}/textsearch/json`, {
        params: {
          query: `${query} near ${lat},${lng}`,
          location: `${lat},${lng}`,
          radius,
          key: this.apis.googlePlaces.apiKey
        }
      });

      if (response.data.results) {
        const transformedPOIs = response.data.results.map(poi => {
          const distance = this.calculateDistance(
            lat, lng,
            poi.geometry?.location?.lat || 0,
            poi.geometry?.location?.lng || 0
          );

          return {
            id: `gpl_search_${poi.place_id}`,
            name: poi.name,
            category: this.mapGoogleTypesToCategory(poi.types),
            coordinates: {
              lat: poi.geometry?.location?.lat || 0,
              lng: poi.geometry?.location?.lng || 0
            },
            distance: Math.round(distance),
            bearing: this.calculateBearing(lat, lng, poi.geometry?.location?.lat || 0, poi.geometry?.location?.lng || 0),
            rating: poi.rating || 3.5,
            priceRange: this.mapGooglePriceLevel(poi.price_level),
            isOpen: poi.opening_hours?.open_now !== false,
            description: `Search result for "${query}"`,
            phone: null,
            website: null,
            tags: poi.types?.slice(0, 3) || [],
            photos: poi.photos?.slice(0, 2).map(photo => 
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=300&photoreference=${photo.photo_reference}&key=${this.apis.googlePlaces.apiKey}`
            ) || [],
            reviews: poi.user_ratings_total || 0,
            estimatedTime: this.calculateEstimatedTime(distance),
            source: 'google_search'
          };
        });

        return transformedPOIs.slice(0, limit);
      }

      return [];

    } catch (error) {
      console.error('Google Places search error:', error);
      return [];
    }
  }

  // Map Google types to our categories
  mapGoogleTypesToCategory(types) {
    if (!types || !Array.isArray(types)) return 'attraction';

    const typeStr = types.join(' ').toLowerCase();
    
    if (typeStr.includes('restaurant') || typeStr.includes('food') || typeStr.includes('meal')) return 'restaurant';
    if (typeStr.includes('lodging') || typeStr.includes('hotel')) return 'hotel';
    if (typeStr.includes('store') || typeStr.includes('shopping')) return 'shop';
    if (typeStr.includes('transit') || typeStr.includes('station')) return 'transport';
    if (typeStr.includes('hospital') || typeStr.includes('pharmacy') || typeStr.includes('health')) return 'medical';
    if (typeStr.includes('entertainment') || typeStr.includes('theater') || typeStr.includes('casino')) return 'entertainment';
    
    return 'attraction';
  }

  // Get detailed POI information
  async getPOIDetails(poiId, source = 'foursquare') {
    try {
      console.log(`📍 Getting details for POI: ${poiId} from ${source}`);

      if (source === 'foursquare') {
        return this.getFoursquareDetails(poiId);
      } else if (source === 'google') {
        return this.getGooglePlaceDetails(poiId);
      }

      throw new Error('Unknown POI source');

    } catch (error) {
      console.error('Error getting POI details:', error);
      throw new Error('Failed to get location details: ' + error.message);
    }
  }

  // Get cache statistics
  getCacheStats() {
    return {
      pois_cache_size: this.poisCache.size,
      historical_cache_size: this.historicalCache.size,
      memory_usage: process.memoryUsage()
    };
  }

  // Clear cache
  clearCache() {
    this.poisCache.clear();
    this.historicalCache.clear();
    return { success: true, message: 'AR location cache cleared' };
  }

  // NEW AR-SPECIFIC METHODS

  async generateARExperience(latitude, longitude, options = {}) {
    try {
      const {
        radius = 1000,
        categories = ['attraction', 'restaurant', 'hotel'],
        maxLandmarks = 10,
        userPreferences = {}
      } = options;

      console.log(`🔮 Generating AR experience at ${latitude}, ${longitude}`);

      // Get nearby POIs
      const pois = await this.discoverNearbyPOIs(latitude, longitude, {
        radius,
        categories,
        limit: maxLandmarks * 2, // Get more to filter better ones
        includeHistorical: true
      });

      // Enhance POIs with AR-specific data
      const arLandmarks = await Promise.all(
        pois.slice(0, maxLandmarks).map(poi => this.enhancePOIForAR(poi, { latitude, longitude }))
      );

      // Generate AR experience structure
      const experience = {
        id: `ar_exp_${Date.now()}`,
        title: 'AR Discovery Experience',
        description: 'Explore landmarks through augmented reality',
        userLocation: { latitude, longitude },
        landmarks: arLandmarks,
        arElements: this.generateARElements(arLandmarks),
        interactiveFeatures: this.generateInteractiveFeatures(arLandmarks),
        gamification: this.generateGamificationElements(arLandmarks),
        recommendations: this.generatePersonalizedRecommendations(arLandmarks, userPreferences),
        metadata: {
          totalLandmarks: arLandmarks.length,
          estimatedDuration: this.calculateExperienceDuration(arLandmarks),
          difficulty: this.calculateDifficulty(arLandmarks),
          themes: this.extractThemes(arLandmarks),
          radius: radius,
          created: new Date().toISOString()
        }
      };

      return experience;
    } catch (error) {
      console.error('Error generating AR experience:', error);
      throw new Error('Failed to generate AR experience');
    }
  }

  async enhancePOIForAR(poi, userLocation) {
    try {
      // Calculate AR-specific properties
      const distance = this.calculateDistance(
        userLocation.latitude, userLocation.longitude,
        poi.coordinates.lat, poi.coordinates.lng
      );

      const bearing = this.calculateBearing(
        userLocation.latitude, userLocation.longitude,
        poi.coordinates.lat, poi.coordinates.lng
      );

      // Generate AR overlay content
      const arOverlay = await this.generateAROverlayContent(poi);

      return {
        ...poi,
        arData: {
          priority: this.calculateARPriority(poi),
          displayType: this.determineARDisplayType(poi.category),
          iconType: this.getARIconType(poi.category),
          distance: Math.round(distance),
          bearing: Math.round(bearing),
          shouldDisplay: distance <= 1000, // Only show if within 1km
          overlay: arOverlay,
          interactionZone: {
            radius: Math.max(10, Math.min(50, distance / 20)), // Dynamic interaction zone
            type: 'circular'
          },
          animations: {
            entrance: 'fadeInUp',
            idle: 'pulse',
            selection: 'bounce'
          },
          sounds: {
            discovery: 'notification.mp3',
            interaction: 'click.mp3'
          }
        }
      };
    } catch (error) {
      console.error('Error enhancing POI for AR:', error);
      return { ...poi, arData: this.getDefaultARData() };
    }
  }

  async generateAROverlayContent(poi) {
    try {
      const overlayPrompt = `
      Create AR overlay content for this location:
      Name: ${poi.name}
      Category: ${poi.category}
      Description: ${poi.description}
      Rating: ${poi.rating}
      
      Generate concise AR overlay content:
      1. Title (max 25 chars)
      2. Subtitle (max 40 chars) 
      3. 2-3 quick facts
      4. Call-to-action text
      5. Cultural/historical highlight if relevant
      
      Return JSON:
      {
        "title": "Short title",
        "subtitle": "Brief description",
        "quickFacts": ["Fact 1", "Fact 2"],
        "callToAction": "Action text",
        "culturalHighlight": "Highlight or null"
      }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: overlayPrompt }],
        temperature: 0.7,
        max_tokens: 400
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating AR overlay content:', error);
      return this.getDefaultOverlayContent(poi);
    }
  }

  calculateARPriority(poi) {
    let priority = 0;
    
    // Rating factor (0-5 points)
    priority += (poi.rating || 3.5);
    
    // Distance factor (closer = higher priority)
    if (poi.distance <= 100) priority += 3;
    else if (poi.distance <= 300) priority += 2;
    else if (poi.distance <= 500) priority += 1;
    
    // Category importance
    const categoryWeights = {
      attraction: 3,
      restaurant: 2,
      hotel: 1,
      shop: 1,
      transport: 1,
      medical: 2,
      entertainment: 2
    };
    priority += categoryWeights[poi.category] || 1;
    
    // Reviews factor
    if (poi.reviews > 100) priority += 2;
    else if (poi.reviews > 50) priority += 1;
    
    // AI enhancement bonus
    if (poi.aiEnhanced) priority += 1;
    
    return Math.min(priority, 10); // Max 10 points
  }

  determineARDisplayType(category) {
    const displayTypes = {
      attraction: 'landmark',
      restaurant: 'dining',
      hotel: 'accommodation',
      shop: 'shopping',
      transport: 'transit',
      medical: 'medical',
      entertainment: 'entertainment'
    };
    return displayTypes[category] || 'general';
  }

  getARIconType(category) {
    const iconMap = {
      attraction: 'camera',
      restaurant: 'utensils',
      hotel: 'bed',
      shop: 'shopping-bag',
      transport: 'navigation',
      medical: 'plus-circle',
      entertainment: 'music'
    };
    return iconMap[category] || 'map-pin';
  }

  generateARElements(landmarks) {
    return {
      markers: landmarks.map(landmark => ({
        id: landmark.id,
        position: landmark.coordinates,
        type: landmark.arData.displayType,
        icon: landmark.arData.iconType,
        priority: landmark.arData.priority,
        overlay: landmark.arData.overlay,
        animations: landmark.arData.animations
      })),
      compass: {
        enabled: true,
        style: 'modern',
        position: 'top-right'
      },
      miniMap: {
        enabled: true,
        position: 'bottom-left',
        radius: 500
      },
      distanceIndicators: {
        enabled: true,
        unit: 'metric',
        showBearing: true
      }
    };
  }

  generateInteractiveFeatures(landmarks) {
    return {
      gestureControls: {
        tap: 'select_landmark',
        longPress: 'show_details',
        pinch: 'zoom_overlay',
        swipe: 'next_landmark'
      },
      voiceCommands: [
        'What is this place?',
        'Show me directions',
        'Tell me more',
        'Take a photo',
        'Save this location'
      ],
      socialFeatures: {
        checkIn: true,
        photoSharing: true,
        reviews: true,
        friendsNearby: true
      },
      navigation: {
        arDirections: true,
        stepByStep: true,
        voiceGuidance: true
      }
    };
  }

  generateGamificationElements(landmarks) {
    const totalLandmarks = landmarks.length;
    
    return {
      challenges: [
        {
          id: 'explorer',
          title: 'Local Explorer',
          description: `Discover ${Math.min(5, totalLandmarks)} places`,
          progress: 0,
          target: Math.min(5, totalLandmarks),
          reward: 'Explorer Badge',
          points: 50
        },
        {
          id: 'photographer',
          title: 'AR Photographer',
          description: 'Take 3 AR photos',
          progress: 0,
          target: 3,
          reward: 'Photo Badge',
          points: 30
        },
        {
          id: 'social_butterfly',
          title: 'Social Butterfly',
          description: 'Share 2 locations',
          progress: 0,
          target: 2,
          reward: 'Social Badge',
          points: 25
        }
      ],
      pointSystem: {
        visitLandmark: 10,
        takePhoto: 15,
        shareLocation: 20,
        writeReview: 25,
        completeChallenge: 50
      },
      leaderboard: {
        enabled: true,
        categories: ['weekly', 'monthly', 'all-time'],
        scope: 'local' // Within city/region
      },
      achievements: [
        'First Discovery',
        'Photography Master',
        'Social Explorer',
        'Cultural Enthusiast',
        'Local Guide'
      ]
    };
  }

  generatePersonalizedRecommendations(landmarks, userPreferences) {
    const recommendations = [];
    
    // Interest-based recommendations
    if (userPreferences.interests) {
      const interestMap = {
        history: landmarks.filter(l => l.historicalInfo),
        food: landmarks.filter(l => l.category === 'restaurant'),
        culture: landmarks.filter(l => l.category === 'attraction'),
        shopping: landmarks.filter(l => l.category === 'shop')
      };
      
      userPreferences.interests.forEach(interest => {
        const matchingLandmarks = interestMap[interest];
        if (matchingLandmarks && matchingLandmarks.length > 0) {
          recommendations.push({
            type: 'interest_based',
            title: `${interest.charAt(0).toUpperCase() + interest.slice(1)} Spots`,
            landmarks: matchingLandmarks.slice(0, 3),
            reason: `Based on your interest in ${interest}`
          });
        }
      });
    }
    
    // Time-based recommendations
    if (userPreferences.availableTime) {
      const quickVisits = landmarks.filter(l => l.arData.distance <= 200);
      const timeMinutes = parseInt(userPreferences.availableTime);
      
      if (timeMinutes <= 30 && quickVisits.length > 0) {
        recommendations.push({
          type: 'time_based',
          title: 'Quick Discoveries',
          landmarks: quickVisits.slice(0, 2),
          reason: 'Perfect for your available time'
        });
      }
    }
    
    // Rating-based recommendations
    const topRated = landmarks
      .filter(l => l.rating >= 4.5)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
    
    if (topRated.length > 0) {
      recommendations.push({
        type: 'quality_based',
        title: 'Highly Rated',
        landmarks: topRated,
        reason: 'Top-rated places nearby'
      });
    }
    
    return recommendations;
  }

  calculateExperienceDuration(landmarks) {
    const baseTime = landmarks.length * 5; // 5 minutes per landmark
    const travelTime = landmarks.length * 2; // 2 minutes travel between landmarks
    const interactionTime = landmarks.length * 3; // 3 minutes interaction time
    
    const totalMinutes = baseTime + travelTime + interactionTime;
    
    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    } else {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  }

  calculateDifficulty(landmarks) {
    const avgDistance = landmarks.reduce((sum, l) => sum + l.arData.distance, 0) / landmarks.length;
    const totalLandmarks = landmarks.length;
    
    let difficulty = 'Easy';
    
    if (avgDistance > 500 || totalLandmarks > 8) {
      difficulty = 'Moderate';
    }
    if (avgDistance > 800 || totalLandmarks > 12) {
      difficulty = 'Challenging';
    }
    
    return difficulty;
  }

  extractThemes(landmarks) {
    const themes = new Set();
    
    landmarks.forEach(landmark => {
      themes.add(landmark.category);
      
      if (landmark.historicalInfo) {
        themes.add('historical');
      }
      if (landmark.rating >= 4.5) {
        themes.add('top-rated');
      }
      if (landmark.tags) {
        landmark.tags.forEach(tag => {
          if (tag.length > 3) themes.add(tag.toLowerCase());
        });
      }
    });
    
    return Array.from(themes).slice(0, 5);
  }

  getDefaultARData() {
    return {
      priority: 5,
      displayType: 'general',
      iconType: 'map-pin',
      distance: 0,
      bearing: 0,
      shouldDisplay: true,
      overlay: this.getDefaultOverlayContent(),
      interactionZone: { radius: 25, type: 'circular' },
      animations: { entrance: 'fadeIn', idle: 'none', selection: 'pulse' },
      sounds: { discovery: 'default.mp3', interaction: 'click.mp3' }
    };
  }

  getDefaultOverlayContent(poi = {}) {
    return {
      title: poi.name || 'Unknown Place',
      subtitle: poi.category || 'Point of Interest',
      quickFacts: ['Discover this place', 'Tap to learn more'],
      callToAction: 'Explore',
      culturalHighlight: null
    };
  }

  async identifyLandmarkFromImage(imageBuffer, location) {
    try {
      console.log('🖼️ Identifying landmark from image...');
      
      // Convert image to base64
      const base64Image = imageBuffer.toString('base64');
      
      const prompt = `
      Analyze this image and identify the landmark or notable location. 
      Consider the location context: ${location.latitude}, ${location.longitude}
      
      Provide:
      1. Landmark name (if identifiable)
      2. Architectural style or features
      3. Historical period
      4. Cultural significance
      5. Confidence level (1-10)
      
      Return JSON:
      {
        "landmarkName": "Name or 'Unknown'",
        "features": ["feature1", "feature2"],
        "period": "historical period",
        "significance": "cultural importance",
        "confidence": 8
      }
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // If landmark identified, get additional details
      if (analysis.landmarkName !== 'Unknown' && analysis.confidence >= 7) {
        const nearbyPOIs = await this.searchPOIs(
          location.latitude, 
          location.longitude, 
          analysis.landmarkName,
          { radius: 200, limit: 5 }
        );
        
        return {
          identified: true,
          landmark: analysis,
          nearbyPOIs: nearbyPOIs
        };
      }
      
      return {
        identified: false,
        analysis: analysis,
        message: 'Could not identify specific landmark'
      };
      
    } catch (error) {
      console.error('Error identifying landmark from image:', error);
      throw new Error('Failed to identify landmark from image');
    }
  }
}

module.exports = new ARLocationService();