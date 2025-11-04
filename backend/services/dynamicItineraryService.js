const axios = require('axios');
const { OpenAI } = require('openai');

class DynamicItineraryService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.weatherApiKey = process.env.WEATHER_API_KEY;
    this.foursquareApiKey = process.env.FOURSQUARE_API_KEY;
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  }

  // Main optimization function
  async optimizeItinerary(itinerary, realTimeFactors, mode = 'balanced') {
    try {
      console.log('🧠 Starting dynamic itinerary optimization...');
      
      // Analyze current situation
      const situationAnalysis = await this.analyzeSituation(itinerary, realTimeFactors);
      
      // Generate adaptations based on real-time factors
      const adaptations = await this.generateAdaptations(itinerary, realTimeFactors, situationAnalysis);
      
      // Optimize based on selected mode
      const optimizedPlan = await this.applyOptimizations(itinerary, adaptations, mode);
      
      // Optimize budget
      const budgetOptimization = await this.optimizeBudget(itinerary, optimizedPlan, mode);
      
      // Calculate travel routes with Mapbox
      const optimizedRoutes = await this.optimizeRoutes(optimizedPlan);
      
      return {
        optimizedPlan: optimizedRoutes,
        adaptations,
        budgetOptimization,
        confidence: situationAnalysis.confidence,
        optimizationSummary: {
          totalChanges: adaptations.length,
          budgetSavings: budgetOptimization.totalSavings,
          timeOptimization: this.calculateTimeSavings(itinerary.originalPlan, optimizedRoutes),
          experienceScore: this.calculateExperienceScore(optimizedRoutes)
        }
      };
      
    } catch (error) {
      console.error('Error optimizing itinerary:', error);
      throw new Error('Failed to optimize itinerary: ' + error.message);
    }
  }

  // Analyze current situation using AI
  async analyzeSituation(itinerary, realTimeFactors) {
    const prompt = `
    You are an expert travel AI analyzing a trip situation. Analyze the following data and provide insights:

    ITINERARY:
    - Destination: ${itinerary.destination}
    - Duration: ${itinerary.duration} days
    - Budget: $${itinerary.budget}
    - Travelers: ${itinerary.travelers}
    - Preferences: ${itinerary.preferences?.join(', ') || 'Not specified'}

    REAL-TIME FACTORS:
    Weather: ${JSON.stringify(realTimeFactors.weather || [])}
    Events: ${JSON.stringify(realTimeFactors.events || [])}
    Crowd Levels: ${JSON.stringify(realTimeFactors.crowdDensity || [])}
    Transportation: ${JSON.stringify(realTimeFactors.transportation || [])}

    Provide analysis in this JSON format:
    {
      "weatherImpact": "assessment of weather impact on outdoor activities",
      "eventOpportunities": "local events that could enhance the trip",
      "crowdConcerns": "areas with high crowds and suggested alternatives",
      "transportationIssues": "any transportation disruptions or delays",
      "budgetOpportunities": "opportunities to save money or get better value",
      "overallRisk": "low/medium/high - overall risk level",
      "confidence": 0.85,
      "keyRecommendations": ["recommendation1", "recommendation2"]
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing situation:', error);
      return {
        weatherImpact: 'Unable to analyze weather impact',
        confidence: 0.5,
        overallRisk: 'medium'
      };
    }
  }

  // Apply specific adaptation
  async applyAdaptation(itinerary, adaptationId) {
    try {
      const adaptation = itinerary.adaptations.find(a => a.id === adaptationId);
      if (!adaptation) {
        throw new Error('Adaptation not found');
      }

      let updatedPlan = JSON.parse(JSON.stringify(itinerary.optimizedPlan || itinerary.originalPlan));

      switch (adaptation.type) {
        case 'weather':
          updatedPlan = await this.applyWeatherAdaptation(updatedPlan, adaptation);
          break;
        case 'budget':
          updatedPlan = await this.applyBudgetAdaptation(updatedPlan, adaptation);
          break;
        case 'crowd':
          updatedPlan = await this.applyCrowdAdaptation(updatedPlan, adaptation);
          break;
        case 'event':
          updatedPlan = await this.applyEventAdaptation(updatedPlan, adaptation);
          break;
        case 'time':
          updatedPlan = await this.applyTimeAdaptation(updatedPlan, adaptation);
          break;
        default:
          console.warn(`Unknown adaptation type: ${adaptation.type}`);
      }

      return updatedPlan;

    } catch (error) {
      console.error('Error applying adaptation:', error);
      throw new Error('Failed to apply adaptation: ' + error.message);
    }
  }

  // Weather adaptation
  async applyWeatherAdaptation(plan, adaptation) {
    const weatherCondition = adaptation.reason.toLowerCase();
    
    plan.forEach(day => {
      if (weatherCondition.includes('rain') || weatherCondition.includes('storm')) {
        day.activities = day.activities.map(activity => {
          if (activity.weatherDependency === 'outdoor') {
            const indoorAlternative = this.findIndoorAlternative(activity);
            return indoorAlternative || activity;
          }
          return activity;
        });
      } else if (weatherCondition.includes('hot') || weatherCondition.includes('sunny')) {
        day.activities = day.activities.map(activity => {
          if (activity.type === 'outdoor') {
            return {
              ...activity,
              recommendedTimes: ['08:00-10:00', '17:00-19:00'],
              notes: 'Adjusted for hot weather - avoid midday sun'
            };
          }
          return activity;
        });
      }
    });

    return plan;
  }

  // Budget adaptation
  async applyBudgetAdaptation(plan, adaptation) {
    plan.forEach(day => {
      day.activities = day.activities.map(activity => {
        if (activity.cost > 50) { // High-cost activities
          const budgetAlternative = this.findBudgetAlternative(activity);
          return budgetAlternative || {
            ...activity,
            cost: activity.cost * 0.7, // 30% discount
            notes: 'Budget-optimized alternative found'
          };
        }
        return activity;
      });
    });

    return plan;
  }

  // Crowd adaptation
  async applyCrowdAdaptation(plan, adaptation) {
    plan.forEach(day => {
      day.activities = day.activities.map(activity => {
        if (adaptation.reason.includes(activity.name)) {
          return {
            ...activity,
            recommendedTimes: ['08:00-10:00', '16:00-18:00'],
            notes: 'Visit during off-peak hours to avoid crowds',
            crowdLevel: 'low'
          };
        }
        return activity;
      });
    });

    return plan;
  }

  // Event adaptation
  async applyEventAdaptation(plan, adaptation) {
    const eventDate = adaptation.reason.match(/on (\d{4}-\d{2}-\d{2})/)?.[1];
    
    if (eventDate) {
      const dayToUpdate = plan.find(day => day.date === eventDate);
      if (dayToUpdate) {
        dayToUpdate.activities.unshift({
          id: `event_${Date.now()}`,
          name: adaptation.suggestedChange,
          type: 'event',
          location: { address: 'Event Location', coordinates: [0, 0] },
          startTime: '19:00',
          endTime: '21:00',
          duration: 120,
          cost: 0,
          rating: 4.5,
          crowdLevel: 'medium',
          weatherDependency: 'flexible',
          alternatives: [],
          bookingRequired: false,
          bestVisitingHours: ['19:00']
        });
      }
    }

    return plan;
  }

  // Time adaptation
  async applyTimeAdaptation(plan, adaptation) {
    plan.forEach(day => {
      if (adaptation.reason.includes('time optimization')) {
        // Sort activities by location proximity
        day.activities.sort((a, b) => {
          // Simple distance calculation (in a real app, use proper geolocation)
          const distanceA = Math.abs(a.location.coordinates[0]) + Math.abs(a.location.coordinates[1]);
          const distanceB = Math.abs(b.location.coordinates[0]) + Math.abs(b.location.coordinates[1]);
          return distanceA - distanceB;
        });

        // Adjust start times for better flow
        let currentTime = 9; // 9:00 AM
        day.activities.forEach(activity => {
          activity.startTime = `${Math.floor(currentTime)}:${(currentTime % 1 * 60).toString().padStart(2, '0')}`;
          currentTime += activity.duration / 60 + 0.5; // Add travel time
          activity.endTime = `${Math.floor(currentTime)}:${(currentTime % 1 * 60).toString().padStart(2, '0')}`;
        });
      }
    });

    return plan;
  }

  // Helper methods
  findIndoorAlternative(activity) {
    const indoorAlternatives = {
      'Eiffel Tower Visit': {
        ...activity,
        name: 'Louvre Museum',
        type: 'museum',
        weatherDependency: 'indoor',
        notes: 'Indoor alternative due to weather'
      },
      'Park Walk': {
        ...activity,
        name: 'Shopping Mall Visit',
        type: 'shopping',
        weatherDependency: 'indoor',
        notes: 'Indoor alternative due to weather'
      }
    };

    return indoorAlternatives[activity.name] || null;
  }

  findBudgetAlternative(activity) {
    const budgetAlternatives = {
      'Fine Dining': {
        ...activity,
        name: 'Local Bistro',
        cost: activity.cost * 0.5,
        notes: 'Budget-friendly alternative'
      },
      'Premium Tour': {
        ...activity,
        name: 'Self-Guided Tour',
        cost: 0,
        notes: 'Free self-guided alternative'
      }
    };

    return budgetAlternatives[activity.name] || null;
  }

  // Generate smart adaptations
  async generateAdaptations(itinerary, realTimeFactors, situationAnalysis) {
    const adaptations = [];

    // Weather-based adaptations
    if (realTimeFactors.weather) {
      for (const weather of realTimeFactors.weather) {
        if (weather.precipitation > 70) {
          const alternatives = await this.findIndoorAlternatives(
            itinerary.destination, 
            weather.date
          );
          
          adaptations.push({
            id: `weather_${Date.now()}_${weather.date}`,
            type: 'weather',
            priority: 'high',
            reason: `High chance of rain (${weather.precipitation}%) on ${weather.date}`,
            originalActivity: 'Outdoor activities',
            suggestedChange: `Consider indoor alternatives: ${alternatives.slice(0, 2).map(a => a.name).join(', ')}`,
            impact: 'moderate',
            confidence: 0.9,
            timestamp: new Date().toISOString(),
            accepted: false,
            data: { alternatives }
          });
        }

        if (weather.temperature > 35) {
          adaptations.push({
            id: `weather_heat_${Date.now()}_${weather.date}`,
            type: 'weather',
            priority: 'medium',
            reason: `Extreme heat (${weather.temperature}°C) expected on ${weather.date}`,
            suggestedChange: 'Schedule indoor activities during peak hours (11 AM - 4 PM)',
            impact: 'minor',
            confidence: 0.8,
            timestamp: new Date().toISOString(),
            accepted: false
          });
        }
      }
    }

    // Event-based adaptations
    if (realTimeFactors.events) {
      for (const event of realTimeFactors.events) {
        if (event.impact === 'positive') {
          adaptations.push({
            id: `event_${Date.now()}_${event.id}`,
            type: 'event',
            priority: 'medium',
            reason: `Special event "${event.name}" happening on ${event.date}`,
            suggestedChange: `Add ${event.name} to your itinerary`,
            impact: 'positive',
            confidence: 0.7,
            timestamp: new Date().toISOString(),
            accepted: false,
            data: { event }
          });
        } else if (event.impact === 'negative') {
          adaptations.push({
            id: `event_avoid_${Date.now()}_${event.id}`,
            type: 'event',
            priority: 'high',
            reason: `${event.name} may cause disruptions on ${event.date}`,
            suggestedChange: 'Avoid affected areas or reschedule activities',
            impact: 'moderate',
            confidence: 0.8,
            timestamp: new Date().toISOString(),
            accepted: false
          });
        }
      }
    }

    // Budget optimizations
    const budgetUsage = this.calculateBudgetUsage(itinerary);
    if (budgetUsage > 0.9) {
      const budgetAlternatives = await this.findBudgetAlternatives(itinerary);
      adaptations.push({
        id: `budget_${Date.now()}`,
        type: 'budget',
        priority: 'high',
        reason: `Trip cost (${(budgetUsage * 100).toFixed(1)}%) approaching budget limit`,
        suggestedChange: `Replace expensive activities with budget alternatives`,
        impact: 'major',
        confidence: 0.9,
        timestamp: new Date().toISOString(),
        accepted: false,
        data: { alternatives: budgetAlternatives }
      });
    }

    // Crowd-based adaptations
    if (realTimeFactors.crowdDensity) {
      for (const crowd of realTimeFactors.crowdDensity) {
        if (crowd.level === 'high' || crowd.level === 'extreme') {
          adaptations.push({
            id: `crowd_${Date.now()}_${crowd.location}`,
            type: 'crowd',
            priority: 'medium',
            reason: `${crowd.location} has ${crowd.level} crowd levels`,
            suggestedChange: `Visit during off-peak hours: ${crowd.bestTimes?.join(' or ')}`,
            impact: 'minor',
            confidence: 0.8,
            timestamp: new Date().toISOString(),
            accepted: false
          });
        }
      }
    }

    return adaptations;
  }

  // Find indoor alternatives using AI
  async findIndoorAlternatives(destination, date) {
    const prompt = `
    Find indoor alternatives for outdoor activities in ${destination} on ${date}.
    Return a JSON array of indoor activities with this structure:
    [
      {
        "name": "Activity name",
        "type": "museum/shopping/entertainment/etc",
        "description": "Brief description",
        "estimatedCost": 25,
        "duration": "2-3 hours",
        "rating": 4.5
      }
    ]
    Limit to 5 best options.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error finding indoor alternatives:', error);
      return [];
    }
  }

  // Find budget alternatives
  async findBudgetAlternatives(itinerary) {
    const prompt = `
    Find budget-friendly alternatives for activities in ${itinerary.destination}.
    Focus on maintaining experience quality while reducing costs.
    
    Current budget: $${itinerary.budget}
    Travelers: ${itinerary.travelers}
    
    Return JSON array:
    [
      {
        "category": "accommodation/food/activities/transport",
        "originalCost": 100,
        "alternativeCost": 60,
        "savings": 40,
        "alternative": "Description of budget option",
        "qualityScore": 4.2
      }
    ]
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error finding budget alternatives:', error);
      return [];
    }
  }

  // Optimize routes using Mapbox Directions API
  async optimizeRoutes(itineraryDays) {
    const optimizedDays = [];
    
    for (const day of itineraryDays) {
      if (day.activities && day.activities.length > 1) {
        const optimizedDay = { ...day };
        
        // Get coordinates for all activities
        const waypoints = day.activities.map(activity => ({
          coordinates: activity.location.coordinates,
          activity: activity
        }));

        // Optimize route order
        const optimizedOrder = await this.calculateOptimalRoute(waypoints);
        
        // Reorder activities based on optimal route
        optimizedDay.activities = optimizedOrder.map(point => point.activity);
        
        // Calculate transportation between activities
        optimizedDay.transportation = await this.calculateTransportation(optimizedDay.activities);
        
        // Update timing based on travel time
        optimizedDay.activities = this.adjustActivityTimes(
          optimizedDay.activities, 
          optimizedDay.transportation
        );
        
        optimizedDays.push(optimizedDay);
      } else {
        optimizedDays.push(day);
      }
    }
    
    return optimizedDays;
  }

  // Calculate optimal route using Mapbox Optimization API
  async calculateOptimalRoute(waypoints) {
    if (waypoints.length <= 2) return waypoints;

    try {
      const coordinates = waypoints.map(w => w.coordinates.join(',')).join(';');
      const url = `https://api.mapbox.com/optimized-trips/v1/mapbox/driving/${coordinates}?access_token=${this.mapboxToken}`;
      
      const response = await axios.get(url);
      const optimizedOrder = response.data.trips[0].waypoint_order;
      
      return optimizedOrder.map(index => waypoints[index]);
    } catch (error) {
      console.error('Error optimizing route:', error);
      return waypoints; // Return original order if optimization fails
    }
  }

  // Calculate transportation between activities
  async calculateTransportation(activities) {
    const transportation = [];
    
    for (let i = 0; i < activities.length - 1; i++) {
      const from = activities[i].location.coordinates;
      const to = activities[i + 1].location.coordinates;
      
      try {
        const route = await this.getDirections(from, to);
        transportation.push({
          from: activities[i].location.address,
          to: activities[i + 1].location.address,
          mode: route.mode,
          duration: route.duration,
          distance: route.distance,
          cost: route.cost,
          route: route.geometry
        });
      } catch (error) {
        console.error('Error calculating transportation:', error);
        // Fallback calculation
        const distance = this.calculateDistance(from[1], from[0], to[1], to[0]);
        transportation.push({
          from: activities[i].location.address,
          to: activities[i + 1].location.address,
          mode: distance > 2 ? 'driving' : 'walking',
          duration: distance > 2 ? Math.ceil(distance * 3) : Math.ceil(distance * 12),
          distance: Math.ceil(distance * 1000),
          cost: distance > 2 ? Math.ceil(distance * 0.5) : 0
        });
      }
    }
    
    return transportation;
  }

  // Get directions from Mapbox
  async getDirections(from, to, profile = 'driving') {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.join(',')};${to.join(',')}?access_token=${this.mapboxToken}&geometries=geojson`;
      
      const response = await axios.get(url);
      const route = response.data.routes[0];
      
      return {
        mode: profile,
        duration: Math.ceil(route.duration / 60), // Convert to minutes
        distance: route.distance,
        cost: this.estimateTravelCost(route.distance, profile),
        geometry: route.geometry
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  // Estimate travel cost
  estimateTravelCost(distance, mode) {
    const rates = {
      driving: 0.5, // per km
      walking: 0,
      cycling: 0,
      transit: 0.1
    };
    
    return Math.ceil((distance / 1000) * (rates[mode] || 0));
  }

  // Adjust activity times based on travel time
  adjustActivityTimes(activities, transportation) {
    const adjustedActivities = [...activities];
    let currentTime = activities[0].startTime;
    
    for (let i = 0; i < adjustedActivities.length; i++) {
      adjustedActivities[i].startTime = currentTime;
      
      // Calculate end time
      const duration = adjustedActivities[i].duration;
      const endTime = this.addMinutes(currentTime, duration);
      adjustedActivities[i].endTime = endTime;
      
      // Add travel time to next activity
      if (i < transportation.length) {
        const travelTime = transportation[i].duration;
        currentTime = this.addMinutes(endTime, travelTime + 15); // 15 min buffer
      }
    }
    
    return adjustedActivities;
  }

  // Budget optimization using AI
  async optimizeBudget(itinerary, optimizedPlan, mode) {
    const currentCost = this.calculateTotalCost(optimizedPlan);
    const targetBudget = itinerary.budget;
    
    if (currentCost <= targetBudget && mode !== 'budget') {
      return {
        totalSavings: 0,
        optimizations: [],
        finalBudget: currentCost
      };
    }

    const prompt = `
    Optimize budget for ${itinerary.destination} trip:
    
    Current cost: $${currentCost}
    Target budget: $${targetBudget}
    Mode: ${mode}
    
    Provide budget optimizations in JSON format:
    {
      "accommodationSavings": { "amount": 100, "method": "description" },
      "transportationSavings": { "amount": 50, "method": "description" },
      "activitySavings": { "amount": 75, "method": "description" },
      "foodSavings": { "amount": 30, "method": "description" },
      "totalSavings": 255
    }
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      });

      const optimization = JSON.parse(response.choices[0].message.content);
      
      return {
        ...optimization,
        finalBudget: currentCost - optimization.totalSavings,
        optimizationMode: mode
      };
    } catch (error) {
      console.error('Error optimizing budget:', error);
      return {
        totalSavings: 0,
        optimizations: [],
        finalBudget: currentCost
      };
    }
  }

  // Fetch real-time weather data
  async fetchWeatherForecast(destination, days = 7) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${destination}&appid=${this.weatherApiKey}&units=metric&cnt=${days * 8}`;
      
      const response = await axios.get(url);
      const forecasts = response.data.list;
      
      // Group by day and get daily summaries
      const dailyForecasts = [];
      for (let i = 0; i < forecasts.length; i += 8) {
        const dayData = forecasts[i];
        dailyForecasts.push({
          date: dayData.dt_txt.split(' ')[0],
          condition: dayData.weather[0].main.toLowerCase(),
          temperature: Math.round(dayData.main.temp),
          precipitation: (dayData.pop * 100).toFixed(0),
          windSpeed: dayData.wind.speed,
          advisory: this.generateWeatherAdvisory(dayData)
        });
      }
      
      return dailyForecasts;
    } catch (error) {
      console.error('Error fetching weather:', error);
      return [];
    }
  }

  // Generate weather advisory
  generateWeatherAdvisory(weatherData) {
    const temp = weatherData.main.temp;
    const pop = weatherData.pop;
    const condition = weatherData.weather[0].main;
    
    if (pop > 0.7) return 'High chance of rain - plan indoor activities';
    if (temp > 35) return 'Very hot - avoid outdoor activities during midday';
    if (temp < 5) return 'Very cold - dress warmly and consider indoor alternatives';
    if (condition === 'Clear' && temp > 20 && temp < 30) return 'Perfect weather for outdoor activities';
    
    return null;
  }

  // Fetch local events
  async fetchLocalEvents(destination, startDate, endDate) {
    // This would integrate with Eventbrite, Foursquare, or local event APIs
    // For now, returning mock data
    return [
      {
        id: 'event1',
        name: 'Local Food Festival',
        type: 'festival',
        date: startDate,
        location: 'City Center',
        impact: 'positive',
        description: 'Annual food festival featuring local cuisine'
      }
    ];
  }

  // Utility functions
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateBudgetUsage(itinerary) {
    const totalCost = this.calculateTotalCost(itinerary.originalPlan || []);
    return totalCost / itinerary.budget;
  }

  calculateTotalCost(itineraryDays) {
    return itineraryDays.reduce((total, day) => {
      return total + (day.totalCost || 0);
    }, 0);
  }

  calculateTimeSavings(originalPlan, optimizedPlan) {
    const originalTime = originalPlan.reduce((total, day) => total + (day.travelTime || 0), 0);
    const optimizedTime = optimizedPlan.reduce((total, day) => total + (day.travelTime || 0), 0);
    return originalTime - optimizedTime;
  }

  calculateExperienceScore(optimizedPlan) {
    // Calculate experience score based on ratings, variety, and optimization
    let totalScore = 0;
    let totalActivities = 0;
    
    optimizedPlan.forEach(day => {
      day.activities?.forEach(activity => {
        totalScore += activity.rating || 4.0;
        totalActivities++;
      });
    });
    
    return totalActivities > 0 ? (totalScore / totalActivities).toFixed(1) : 4.0;
  }

  addMinutes(timeString, minutes) {
    const [hours, mins] = timeString.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }
}

module.exports = new DynamicItineraryService();