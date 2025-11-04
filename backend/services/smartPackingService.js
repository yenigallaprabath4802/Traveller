const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class SmartPackingService {
  constructor() {
    this.packingCache = new Map();
    this.weatherCache = new Map();
    this.categoryWeights = {
      essential: 10,
      recommended: 7,
      optional: 4,
      seasonal: 8,
      activity: 9,
      safety: 10,
      comfort: 6,
      tech: 5
    };

    // Comprehensive packing categories
    this.packingCategories = {
      clothing: {
        essential: ['underwear', 'socks', 'basic_shirts', 'pants', 'sleepwear'],
        weather_dependent: ['jackets', 'sweaters', 'shorts', 'swimwear', 'rain_gear'],
        activity_specific: ['hiking_boots', 'dress_shoes', 'athletic_wear', 'formal_wear'],
        accessories: ['belts', 'hats', 'scarves', 'gloves', 'sunglasses']
      },
      toiletries: {
        essential: ['toothbrush', 'toothpaste', 'shampoo', 'soap', 'deodorant'],
        personal_care: ['skincare', 'makeup', 'razors', 'feminine_products'],
        health: ['medications', 'first_aid', 'sunscreen', 'insect_repellent'],
        travel_size: ['travel_containers', 'toiletry_bag']
      },
      electronics: {
        essential: ['phone', 'chargers', 'adapters'],
        entertainment: ['headphones', 'camera', 'e_reader', 'tablet'],
        travel_tech: ['portable_battery', 'travel_router', 'gps_device'],
        accessories: ['cables', 'memory_cards', 'protective_cases']
      },
      documents: {
        travel: ['passport', 'visa', 'tickets', 'insurance', 'itinerary'],
        financial: ['credit_cards', 'cash', 'traveler_checks'],
        emergency: ['emergency_contacts', 'medical_info', 'copies'],
        digital: ['digital_copies', 'travel_apps', 'offline_maps']
      },
      gear: {
        luggage: ['suitcase', 'backpack', 'day_pack', 'packing_cubes'],
        travel_comfort: ['neck_pillow', 'eye_mask', 'earplugs', 'blanket'],
        security: ['locks', 'money_belt', 'rfid_wallet'],
        utility: ['laundry_bag', 'shoe_bags', 'compression_sacks']
      }
    };

    // Activity-specific packing requirements
    this.activityRequirements = {
      beach: {
        essential: ['swimwear', 'sunscreen', 'beach_towel', 'flip_flops'],
        recommended: ['beach_bag', 'snorkel_gear', 'waterproof_phone_case'],
        optional: ['beach_umbrella', 'cooler', 'beach_games']
      },
      hiking: {
        essential: ['hiking_boots', 'backpack', 'water_bottle', 'first_aid'],
        recommended: ['hiking_poles', 'gps_device', 'emergency_whistle'],
        optional: ['camping_gear', 'portable_stove', 'sleeping_bag']
      },
      business: {
        essential: ['formal_wear', 'dress_shoes', 'laptop', 'business_cards'],
        recommended: ['portfolio', 'presentation_materials', 'backup_charger'],
        optional: ['portable_projector', 'meeting_gifts', 'formal_accessories']
      },
      adventure: {
        essential: ['sturdy_footwear', 'weather_gear', 'safety_equipment'],
        recommended: ['action_camera', 'protective_gear', 'emergency_kit'],
        optional: ['specialized_equipment', 'backup_gear', 'comfort_items']
      },
      cultural: {
        essential: ['modest_clothing', 'comfortable_shoes', 'guidebook'],
        recommended: ['camera', 'notebook', 'local_currency'],
        optional: ['cultural_gifts', 'language_book', 'traditional_wear']
      },
      urban: {
        essential: ['comfortable_shoes', 'day_pack', 'city_map'],
        recommended: ['portable_charger', 'camera', 'metro_card'],
        optional: ['umbrella', 'shopping_bag', 'city_guide']
      }
    };

    // Climate-specific recommendations
    this.climateRequirements = {
      tropical: {
        clothing: ['light_cotton', 'breathable_fabrics', 'sun_protection'],
        protection: ['sunscreen', 'insect_repellent', 'hat'],
        comfort: ['cooling_towel', 'electrolyte_supplements']
      },
      temperate: {
        clothing: ['layers', 'versatile_pieces', 'light_jacket'],
        protection: ['light_rain_gear', 'comfortable_shoes'],
        comfort: ['light_sweater', 'versatile_accessories']
      },
      cold: {
        clothing: ['warm_layers', 'insulation', 'waterproof_outer'],
        protection: ['gloves', 'warm_hat', 'thermal_underwear'],
        comfort: ['hand_warmers', 'warm_socks', 'moisturizer']
      },
      desert: {
        clothing: ['light_colors', 'long_sleeves', 'breathable_fabrics'],
        protection: ['sun_protection', 'dust_mask', 'eye_protection'],
        comfort: ['cooling_accessories', 'hydration_pack']
      },
      mountain: {
        clothing: ['layering_system', 'wind_resistant', 'altitude_appropriate'],
        protection: ['sun_protection', 'altitude_gear', 'emergency_gear'],
        comfort: ['altitude_medicine', 'energy_snacks']
      }
    };
  }

  // Generate comprehensive packing list
  async generatePackingList(tripData) {
    try {
      const cacheKey = this.generateCacheKey(tripData);
      
      if (this.packingCache.has(cacheKey)) {
        return this.packingCache.get(cacheKey);
      }

      // Analyze trip requirements
      const tripAnalysis = await this.analyzeTripRequirements(tripData);
      
      // Get weather predictions
      const weatherData = await this.getWeatherPredictions(tripData.destination, tripData.dates);
      
      // Generate base packing list
      const baseList = this.generateBasePackingList(tripAnalysis, weatherData);
      
      // Apply AI optimization
      const optimizedList = await this.optimizePackingWithAI(baseList, tripAnalysis, weatherData);
      
      // Add personalized recommendations
      const personalizedList = await this.addPersonalizedRecommendations(
        optimizedList, 
        tripData.userPreferences || {}
      );

      // Calculate packing statistics
      const packingStats = this.calculatePackingStats(personalizedList);

      const result = {
        packingList: personalizedList,
        tripAnalysis,
        weatherSummary: this.summarizeWeather(weatherData),
        packingStats,
        recommendations: await this.generatePackingRecommendations(tripAnalysis, weatherData),
        timeline: this.generatePackingTimeline(tripData.dates),
        tips: await this.generateSmartPackingTips(tripAnalysis)
      };

      // Cache result
      this.packingCache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('Error generating packing list:', error);
      throw new Error('Failed to generate packing list');
    }
  }

  // Analyze trip requirements
  async analyzeTripRequirements(tripData) {
    const analysis = {
      destination: tripData.destination,
      duration: this.calculateTripDuration(tripData.dates),
      season: this.determineSeason(tripData.dates.start, tripData.destination),
      activities: tripData.activities || [],
      accommodation: tripData.accommodation || 'hotel',
      transport: tripData.transport || 'flight',
      climate: await this.determineClimate(tripData.destination),
      culture: await this.analyzeCulturalRequirements(tripData.destination),
      budget: tripData.budget || 'medium',
      travelerType: tripData.travelerType || 'leisure'
    };

    // Determine trip complexity
    analysis.complexity = this.calculateTripComplexity(analysis);
    
    // Identify special requirements
    analysis.specialRequirements = this.identifySpecialRequirements(analysis);

    return analysis;
  }

  // Get weather predictions for trip
  async getWeatherPredictions(destination, dates) {
    try {
      const cacheKey = `weather_${destination}_${dates.start}_${dates.end}`;
      
      if (this.weatherCache.has(cacheKey)) {
        return this.weatherCache.get(cacheKey);
      }

      // Use OpenAI to analyze weather patterns
      const weatherAnalysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a weather and climate expert. Provide detailed weather predictions and packing recommendations."
          },
          {
            role: "user",
            content: `Analyze weather conditions for ${destination} from ${dates.start} to ${dates.end}. 
            Provide:
            1. Expected temperature range
            2. Precipitation probability
            3. Weather patterns
            4. Seasonal considerations
            5. Specific packing recommendations
            
            Format as JSON with: {temperatureRange, precipitation, conditions, recommendations}`
          }
        ],
        temperature: 0.3
      });

      let weatherData;
      try {
        weatherData = JSON.parse(weatherAnalysis.choices[0].message.content);
      } catch (parseError) {
        // Fallback if JSON parsing fails
        weatherData = {
          temperatureRange: { min: 15, max: 25 },
          precipitation: 'moderate',
          conditions: 'variable',
          recommendations: ['Pack layers', 'Bring rain protection']
        };
      }

      // Cache weather data
      this.weatherCache.set(cacheKey, weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error getting weather predictions:', error);
      // Return default weather data
      return {
        temperatureRange: { min: 15, max: 25 },
        precipitation: 'unknown',
        conditions: 'variable',
        recommendations: ['Pack versatile clothing', 'Prepare for variable weather']
      };
    }
  }

  // Generate base packing list
  generateBasePackingList(tripAnalysis, weatherData) {
    const packingList = {
      clothing: [],
      toiletries: [],
      electronics: [],
      documents: [],
      gear: [],
      activities: [],
      emergency: []
    };

    // Add essential items
    this.addEssentialItems(packingList, tripAnalysis);
    
    // Add weather-specific items
    this.addWeatherSpecificItems(packingList, weatherData, tripAnalysis);
    
    // Add activity-specific items
    this.addActivitySpecificItems(packingList, tripAnalysis.activities);
    
    // Add accommodation-specific items
    this.addAccommodationSpecificItems(packingList, tripAnalysis.accommodation);
    
    // Add cultural requirements
    this.addCulturalItems(packingList, tripAnalysis.culture);

    return packingList;
  }

  // Add essential items
  addEssentialItems(packingList, tripAnalysis) {
    const duration = tripAnalysis.duration;
    
    // Essential clothing based on trip duration
    const clothingMultiplier = Math.min(duration, 7); // Cap at 7 days, then recycle
    
    packingList.clothing.push(
      { item: 'underwear', quantity: duration + 2, priority: 'essential', category: 'clothing' },
      { item: 'socks', quantity: duration + 2, priority: 'essential', category: 'clothing' },
      { item: 'basic_shirts', quantity: Math.ceil(duration / 2), priority: 'essential', category: 'clothing' },
      { item: 'pants', quantity: Math.ceil(duration / 3), priority: 'essential', category: 'clothing' },
      { item: 'sleepwear', quantity: 2, priority: 'essential', category: 'clothing' }
    );

    // Essential toiletries
    packingList.toiletries.push(
      { item: 'toothbrush', quantity: 1, priority: 'essential', category: 'toiletries' },
      { item: 'toothpaste', quantity: 1, priority: 'essential', category: 'toiletries' },
      { item: 'shampoo', quantity: 1, priority: 'essential', category: 'toiletries' },
      { item: 'soap', quantity: 1, priority: 'essential', category: 'toiletries' },
      { item: 'deodorant', quantity: 1, priority: 'essential', category: 'toiletries' }
    );

    // Essential electronics
    packingList.electronics.push(
      { item: 'phone', quantity: 1, priority: 'essential', category: 'electronics' },
      { item: 'phone_charger', quantity: 1, priority: 'essential', category: 'electronics' },
      { item: 'power_adapter', quantity: 1, priority: 'essential', category: 'electronics' }
    );

    // Essential documents
    packingList.documents.push(
      { item: 'passport', quantity: 1, priority: 'essential', category: 'documents' },
      { item: 'travel_tickets', quantity: 1, priority: 'essential', category: 'documents' },
      { item: 'travel_insurance', quantity: 1, priority: 'essential', category: 'documents' }
    );
  }

  // Add weather-specific items
  addWeatherSpecificItems(packingList, weatherData, tripAnalysis) {
    const tempRange = weatherData.temperatureRange;
    const climate = tripAnalysis.climate;

    // Temperature-based clothing
    if (tempRange.max > 25) {
      packingList.clothing.push(
        { item: 'shorts', quantity: 2, priority: 'recommended', category: 'clothing', reason: 'hot_weather' },
        { item: 'light_shirts', quantity: 3, priority: 'recommended', category: 'clothing', reason: 'hot_weather' },
        { item: 'sandals', quantity: 1, priority: 'recommended', category: 'clothing', reason: 'hot_weather' }
      );
    }

    if (tempRange.min < 15) {
      packingList.clothing.push(
        { item: 'warm_jacket', quantity: 1, priority: 'essential', category: 'clothing', reason: 'cold_weather' },
        { item: 'sweaters', quantity: 2, priority: 'recommended', category: 'clothing', reason: 'cold_weather' },
        { item: 'long_pants', quantity: 2, priority: 'essential', category: 'clothing', reason: 'cold_weather' }
      );
    }

    // Precipitation protection
    if (weatherData.precipitation === 'high' || weatherData.precipitation === 'moderate') {
      packingList.clothing.push(
        { item: 'rain_jacket', quantity: 1, priority: 'essential', category: 'clothing', reason: 'rain_protection' },
        { item: 'waterproof_shoes', quantity: 1, priority: 'recommended', category: 'clothing', reason: 'rain_protection' }
      );
      
      packingList.gear.push(
        { item: 'umbrella', quantity: 1, priority: 'recommended', category: 'gear', reason: 'rain_protection' }
      );
    }

    // Climate-specific items
    if (climate === 'tropical') {
      packingList.toiletries.push(
        { item: 'sunscreen_spf50', quantity: 1, priority: 'essential', category: 'toiletries', reason: 'sun_protection' },
        { item: 'insect_repellent', quantity: 1, priority: 'essential', category: 'toiletries', reason: 'insect_protection' }
      );
    }
  }

  // Add activity-specific items
  addActivitySpecificItems(packingList, activities) {
    activities.forEach(activity => {
      const requirements = this.activityRequirements[activity.toLowerCase()];
      if (requirements) {
        // Add essential activity items
        requirements.essential.forEach(item => {
          packingList.activities.push({
            item,
            quantity: 1,
            priority: 'essential',
            category: 'activities',
            activity: activity,
            reason: `required_for_${activity}`
          });
        });

        // Add recommended activity items
        requirements.recommended.forEach(item => {
          packingList.activities.push({
            item,
            quantity: 1,
            priority: 'recommended',
            category: 'activities',
            activity: activity,
            reason: `recommended_for_${activity}`
          });
        });
      }
    });
  }

  // Optimize packing with AI
  async optimizePackingWithAI(packingList, tripAnalysis, weatherData) {
    try {
      const listSummary = this.summarizePackingList(packingList);
      
      const optimization = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert travel packing consultant. Optimize packing lists for efficiency, weight, and practicality."
          },
          {
            role: "user",
            content: `Optimize this packing list for a ${tripAnalysis.duration}-day trip to ${tripAnalysis.destination}:
            
            Current list: ${JSON.stringify(listSummary)}
            Trip type: ${tripAnalysis.travelerType}
            Activities: ${tripAnalysis.activities.join(', ')}
            Weather: ${JSON.stringify(weatherData)}
            
            Provide optimizations:
            1. Items to remove (with reasons)
            2. Items to add (with reasons)
            3. Quantity adjustments
            4. Multi-purpose alternatives
            5. Weight-saving suggestions
            
            Format as JSON: {remove: [], add: [], adjust: [], alternatives: [], weightSaving: []}`
          }
        ],
        temperature: 0.3
      });

      let optimizations;
      try {
        optimizations = JSON.parse(optimization.choices[0].message.content);
        return this.applyOptimizations(packingList, optimizations);
      } catch (parseError) {
        console.error('AI optimization parsing error:', parseError);
        return packingList; // Return original if parsing fails
      }
    } catch (error) {
      console.error('AI optimization error:', error);
      return packingList;
    }
  }

  // Apply AI optimizations
  applyOptimizations(packingList, optimizations) {
    // Remove suggested items
    optimizations.remove?.forEach(removal => {
      Object.keys(packingList).forEach(category => {
        packingList[category] = packingList[category].filter(item => 
          item.item !== removal.item
        );
      });
    });

    // Add suggested items
    optimizations.add?.forEach(addition => {
      const category = addition.category || 'gear';
      if (packingList[category]) {
        packingList[category].push({
          item: addition.item,
          quantity: addition.quantity || 1,
          priority: addition.priority || 'recommended',
          category: category,
          reason: addition.reason || 'ai_optimization'
        });
      }
    });

    // Adjust quantities
    optimizations.adjust?.forEach(adjustment => {
      Object.keys(packingList).forEach(category => {
        packingList[category].forEach(item => {
          if (item.item === adjustment.item) {
            item.quantity = adjustment.newQuantity;
            item.reason = adjustment.reason || item.reason;
          }
        });
      });
    });

    return packingList;
  }

  // Add personalized recommendations
  async addPersonalizedRecommendations(packingList, userPreferences) {
    const personalizations = [];

    // Personal care preferences
    if (userPreferences.skinType) {
      personalizations.push(this.getSkinCareRecommendations(userPreferences.skinType));
    }

    // Dietary restrictions
    if (userPreferences.dietaryRestrictions) {
      personalizations.push(this.getDietaryPackingItems(userPreferences.dietaryRestrictions));
    }

    // Comfort preferences
    if (userPreferences.comfortItems) {
      personalizations.push(...userPreferences.comfortItems.map(item => ({
        item,
        quantity: 1,
        priority: 'optional',
        category: 'comfort',
        reason: 'personal_preference'
      })));
    }

    // Add personalizations to appropriate categories
    personalizations.forEach(item => {
      const category = item.category || 'gear';
      if (packingList[category]) {
        packingList[category].push(item);
      }
    });

    return packingList;
  }

  // Generate packing recommendations
  async generatePackingRecommendations(tripAnalysis, weatherData) {
    const recommendations = [];

    // Weight optimization
    recommendations.push({
      type: 'weight_optimization',
      title: 'Pack Light Strategy',
      suggestions: [
        'Choose versatile pieces that mix and match',
        'Limit shoes to 2-3 pairs maximum',
        'Use packing cubes for organization',
        'Wear heaviest items while traveling'
      ]
    });

    // Weather-based recommendations
    if (weatherData.conditions === 'variable') {
      recommendations.push({
        type: 'weather_strategy',
        title: 'Variable Weather Strategy',
        suggestions: [
          'Focus on layering pieces',
          'Pack a lightweight rain jacket',
          'Bring versatile footwear',
          'Include temperature-regulating fabrics'
        ]
      });
    }

    // Activity-based recommendations
    if (tripAnalysis.activities.length > 2) {
      recommendations.push({
        type: 'activity_strategy',
        title: 'Multi-Activity Packing',
        suggestions: [
          'Prioritize multipurpose gear',
          'Consider renting specialized equipment',
          'Pack one activity outfit that works for multiple activities',
          'Leave space for activity-specific purchases'
        ]
      });
    }

    return recommendations;
  }

  // Generate packing timeline
  generatePackingTimeline(dates) {
    const daysUntilTrip = Math.ceil((new Date(dates.start) - new Date()) / (1000 * 60 * 60 * 24));
    
    const timeline = [];

    if (daysUntilTrip > 14) {
      timeline.push({
        timeframe: '2 weeks before',
        tasks: [
          'Start collecting essential documents',
          'Check passport expiration',
          'Research destination-specific requirements',
          'Begin shopping for missing items'
        ]
      });
    }

    if (daysUntilTrip > 7) {
      timeline.push({
        timeframe: '1 week before',
        tasks: [
          'Finalize packing list',
          'Start laying out clothes',
          'Check weather forecast updates',
          'Prepare electronics and chargers'
        ]
      });
    }

    if (daysUntilTrip > 3) {
      timeline.push({
        timeframe: '3 days before',
        tasks: [
          'Do laundry for travel clothes',
          'Gather toiletries and medications',
          'Organize documents in travel wallet',
          'Check luggage weight restrictions'
        ]
      });
    }

    timeline.push({
      timeframe: 'Day before departure',
      tasks: [
        'Pack everything except essentials',
        'Prepare carry-on items',
        'Charge all electronic devices',
        'Set out travel day outfit'
      ]
    });

    return timeline;
  }

  // Generate smart packing tips
  async generateSmartPackingTips(tripAnalysis) {
    const tips = [
      {
        category: 'organization',
        tip: 'Use packing cubes to separate clean and dirty clothes',
        benefit: 'Keeps luggage organized throughout trip'
      },
      {
        category: 'space_saving',
        tip: 'Roll clothes instead of folding',
        benefit: 'Saves 30% more space in luggage'
      },
      {
        category: 'weight_distribution',
        tip: 'Pack heavy items in carry-on',
        benefit: 'Reduces checked bag weight fees'
      },
      {
        category: 'emergency_prep',
        tip: 'Pack one complete outfit in carry-on',
        benefit: 'Prepared for delayed luggage'
      }
    ];

    // Add destination-specific tips
    if (tripAnalysis.climate === 'tropical') {
      tips.push({
        category: 'climate_specific',
        tip: 'Pack moisture-wicking fabrics',
        benefit: 'Stay comfortable in humid conditions'
      });
    }

    return tips;
  }

  // Helper methods
  generateCacheKey(tripData) {
    return `packing_${tripData.destination}_${tripData.dates.start}_${tripData.dates.end}_${tripData.activities?.join('_') || 'none'}`;
  }

  calculateTripDuration(dates) {
    return Math.ceil((new Date(dates.end) - new Date(dates.start)) / (1000 * 60 * 60 * 24));
  }

  determineSeason(date, destination) {
    const month = new Date(date).getMonth();
    // Simplified season determination - could be enhanced with hemisphere logic
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  async determineClimate(destination) {
    // Simplified climate determination - could integrate with weather APIs
    const tropicalKeywords = ['tropical', 'caribbean', 'southeast asia', 'pacific islands'];
    const coldKeywords = ['arctic', 'northern', 'mountain', 'alpine'];
    const desertKeywords = ['desert', 'arid', 'middle east', 'sahara'];
    
    const dest = destination.toLowerCase();
    
    if (tropicalKeywords.some(keyword => dest.includes(keyword))) return 'tropical';
    if (coldKeywords.some(keyword => dest.includes(keyword))) return 'cold';
    if (desertKeywords.some(keyword => dest.includes(keyword))) return 'desert';
    
    return 'temperate';
  }

  async analyzeCulturalRequirements(destination) {
    // Simplified cultural analysis - could be enhanced with cultural database
    return {
      dressCode: 'moderate',
      religiousConsiderations: false,
      businessCulture: 'casual',
      giftGiving: false
    };
  }

  calculateTripComplexity(analysis) {
    let complexity = 0;
    
    complexity += analysis.activities.length * 2;
    complexity += analysis.duration > 7 ? 3 : 1;
    if (analysis.climate === 'extreme') complexity += 3;
    if (analysis.accommodation === 'camping') complexity += 2;
    
    return complexity > 10 ? 'high' : complexity > 5 ? 'medium' : 'low';
  }

  identifySpecialRequirements(analysis) {
    const requirements = [];
    
    if (analysis.climate === 'tropical') {
      requirements.push('sun_protection', 'insect_protection');
    }
    
    if (analysis.activities.includes('hiking')) {
      requirements.push('sturdy_footwear', 'first_aid');
    }
    
    if (analysis.duration > 14) {
      requirements.push('laundry_supplies', 'medication_refills');
    }
    
    return requirements;
  }

  summarizePackingList(packingList) {
    const summary = {};
    Object.keys(packingList).forEach(category => {
      summary[category] = packingList[category].map(item => ({
        item: item.item,
        quantity: item.quantity,
        priority: item.priority
      }));
    });
    return summary;
  }

  summarizeWeather(weatherData) {
    return {
      temperature: `${weatherData.temperatureRange.min}°C - ${weatherData.temperatureRange.max}°C`,
      precipitation: weatherData.precipitation,
      conditions: weatherData.conditions,
      packingFocus: weatherData.recommendations.slice(0, 3)
    };
  }

  calculatePackingStats(packingList) {
    let totalItems = 0;
    let essentialItems = 0;
    let optionalItems = 0;
    const categoryBreakdown = {};

    Object.keys(packingList).forEach(category => {
      categoryBreakdown[category] = packingList[category].length;
      packingList[category].forEach(item => {
        totalItems += item.quantity;
        if (item.priority === 'essential') {
          essentialItems += item.quantity;
        } else {
          optionalItems += item.quantity;
        }
      });
    });

    return {
      totalItems,
      essentialItems,
      optionalItems,
      categoryBreakdown,
      packingEfficiency: Math.round((essentialItems / totalItems) * 100)
    };
  }

  getSkinCareRecommendations(skinType) {
    const recommendations = {
      'sensitive': {
        item: 'gentle_skincare_kit',
        quantity: 1,
        priority: 'recommended',
        category: 'toiletries',
        reason: 'sensitive_skin'
      },
      'oily': {
        item: 'oil_control_products',
        quantity: 1,
        priority: 'recommended',
        category: 'toiletries',
        reason: 'oily_skin'
      },
      'dry': {
        item: 'moisturizing_products',
        quantity: 1,
        priority: 'recommended',
        category: 'toiletries',
        reason: 'dry_skin'
      }
    };

    return recommendations[skinType] || recommendations['sensitive'];
  }

  getDietaryPackingItems(restrictions) {
    const items = [];
    
    if (restrictions.includes('gluten-free')) {
      items.push({
        item: 'gluten_free_snacks',
        quantity: 3,
        priority: 'recommended',
        category: 'food',
        reason: 'dietary_restriction'
      });
    }
    
    if (restrictions.includes('vegan')) {
      items.push({
        item: 'protein_supplements',
        quantity: 1,
        priority: 'optional',
        category: 'food',
        reason: 'dietary_restriction'
      });
    }
    
    return items;
  }

  // Get personalized packing insights
  async getPersonalizedInsights(userId, tripData) {
    try {
      // This would integrate with user travel history
      const insights = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a personalized travel packing advisor. Provide insights based on travel patterns and preferences."
          },
          {
            role: "user",
            content: `Generate personalized packing insights for a ${tripData.duration}-day trip to ${tripData.destination}.
            Consider:
            1. Items frequently forgotten by travelers
            2. Destination-specific essentials
            3. Seasonal packing priorities
            4. Travel style optimizations
            
            Format as JSON: {insights: [], priorities: [], warnings: []}`
          }
        ],
        temperature: 0.4
      });

      return JSON.parse(insights.choices[0].message.content);
    } catch (error) {
      console.error('Error generating personalized insights:', error);
      return {
        insights: ['Pack versatile, comfortable clothes', 'Don\'t forget phone charger'],
        priorities: ['Documents', 'Medications', 'Weather protection'],
        warnings: ['Check airline baggage restrictions', 'Verify passport validity']
      };
    }
  }

  // Validate packing list completeness
  validatePackingList(packingList, tripAnalysis) {
    const validation = {
      completeness: 0,
      missingEssentials: [],
      recommendations: []
    };

    // Check for essential categories
    const essentialCategories = ['clothing', 'toiletries', 'documents', 'electronics'];
    let presentCategories = 0;

    essentialCategories.forEach(category => {
      if (packingList[category] && packingList[category].length > 0) {
        presentCategories++;
      } else {
        validation.missingEssentials.push(`Missing ${category} items`);
      }
    });

    validation.completeness = (presentCategories / essentialCategories.length) * 100;

    // Add recommendations based on missing items
    if (validation.completeness < 100) {
      validation.recommendations.push('Review essential categories to ensure nothing is missed');
    }

    return validation;
  }
}

module.exports = SmartPackingService;