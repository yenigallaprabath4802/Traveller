const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dynamicItineraryService = require('../services/dynamicItineraryService');

// Optimize itinerary with real-time factors
router.post('/optimize', auth, async (req, res) => {
  try {
    const { 
      itinerary, 
      realTimeFactors, 
      mode = 'balanced' 
    } = req.body;

    if (!itinerary) {
      return res.status(400).json({ 
        error: 'Itinerary data is required' 
      });
    }

    console.log(`🔄 Optimizing itinerary for user ${req.user.id} in ${mode} mode`);

    const optimization = await dynamicItineraryService.optimizeItinerary(
      itinerary,
      realTimeFactors,
      mode
    );

    res.json({
      success: true,
      data: optimization,
      message: `Itinerary optimized in ${mode} mode with ${optimization.adaptations.length} adaptations`
    });

  } catch (error) {
    console.error('Error optimizing itinerary:', error);
    res.status(500).json({ 
      error: 'Failed to optimize itinerary',
      details: error.message 
    });
  }
});

// Fetch real-time factors for a destination
router.post('/realtime-factors', auth, async (req, res) => {
  try {
    const { 
      destination, 
      startDate, 
      endDate,
      coordinates 
    } = req.body;

    if (!destination) {
      return res.status(400).json({ 
        error: 'Destination is required' 
      });
    }

    console.log(`🌍 Fetching real-time factors for ${destination}`);

    // Calculate date range
    const start = new Date(startDate || Date.now());
    const end = new Date(endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

    // Fetch weather forecast
    const weather = await dynamicItineraryService.fetchWeatherForecast(destination, days);

    // Fetch local events
    const events = await dynamicItineraryService.fetchLocalEvents(
      destination, 
      start.toISOString().split('T')[0], 
      end.toISOString().split('T')[0]
    );

    // Generate crowd density data (mock for now)
    const crowdDensity = generateCrowdDensityData(destination, days);

    // Generate transportation data (mock for now)
    const transportation = generateTransportationData(destination);

    const realTimeFactors = {
      weather,
      events,
      crowdDensity,
      transportation,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: realTimeFactors,
      message: `Real-time factors fetched for ${destination}`
    });

  } catch (error) {
    console.error('Error fetching real-time factors:', error);
    res.status(500).json({ 
      error: 'Failed to fetch real-time factors',
      details: error.message 
    });
  }
});

// Apply specific adaptation to itinerary
router.post('/apply-adaptation', auth, async (req, res) => {
  try {
    const { 
      itinerary, 
      adaptationId, 
      adaptationData 
    } = req.body;

    if (!itinerary || !adaptationId) {
      return res.status(400).json({ 
        error: 'Itinerary and adaptation ID are required' 
      });
    }

    console.log(`✅ Applying adaptation ${adaptationId} for user ${req.user.id}`);

    // Find the adaptation
    const adaptation = adaptationData;
    if (!adaptation) {
      return res.status(404).json({ 
        error: 'Adaptation not found' 
      });
    }

    // Apply the adaptation based on type
    let updatedItinerary = { ...itinerary };
    
    switch (adaptation.type) {
      case 'weather':
        updatedItinerary = await applyWeatherAdaptation(updatedItinerary, adaptation);
        break;
      case 'event':
        updatedItinerary = await applyEventAdaptation(updatedItinerary, adaptation);
        break;
      case 'budget':
        updatedItinerary = await applyBudgetAdaptation(updatedItinerary, adaptation);
        break;
      case 'crowd':
        updatedItinerary = await applyCrowdAdaptation(updatedItinerary, adaptation);
        break;
      default:
        throw new Error(`Unknown adaptation type: ${adaptation.type}`);
    }

    // Mark adaptation as accepted
    adaptation.accepted = true;
    adaptation.appliedAt = new Date().toISOString();

    res.json({
      success: true,
      data: {
        updatedItinerary,
        adaptation
      },
      message: `Adaptation ${adaptationId} applied successfully`
    });

  } catch (error) {
    console.error('Error applying adaptation:', error);
    res.status(500).json({ 
      error: 'Failed to apply adaptation',
      details: error.message 
    });
  }
});

// Get budget optimization suggestions
router.post('/budget-optimize', auth, async (req, res) => {
  try {
    const { 
      itinerary, 
      targetBudget, 
      priorities = [] 
    } = req.body;

    if (!itinerary || !targetBudget) {
      return res.status(400).json({ 
        error: 'Itinerary and target budget are required' 
      });
    }

    console.log(`💰 Optimizing budget for user ${req.user.id}, target: $${targetBudget}`);

    const budgetOptimization = await dynamicItineraryService.optimizeBudget(
      { ...itinerary, budget: targetBudget },
      itinerary.originalPlan || itinerary.days,
      'budget'
    );

    res.json({
      success: true,
      data: budgetOptimization,
      message: `Budget optimization completed with $${budgetOptimization.totalSavings} in savings`
    });

  } catch (error) {
    console.error('Error optimizing budget:', error);
    res.status(500).json({ 
      error: 'Failed to optimize budget',
      details: error.message 
    });
  }
});

// Get route optimization
router.post('/route-optimize', auth, async (req, res) => {
  try {
    const { itineraryDays } = req.body;

    if (!itineraryDays || !Array.isArray(itineraryDays)) {
      return res.status(400).json({ 
        error: 'Itinerary days array is required' 
      });
    }

    console.log(`🛣️  Optimizing routes for user ${req.user.id}`);

    const optimizedRoutes = await dynamicItineraryService.optimizeRoutes(itineraryDays);

    res.json({
      success: true,
      data: optimizedRoutes,
      message: 'Routes optimized successfully'
    });

  } catch (error) {
    console.error('Error optimizing routes:', error);
    res.status(500).json({ 
      error: 'Failed to optimize routes',
      details: error.message 
    });
  }
});

// Helper functions for applying adaptations
async function applyWeatherAdaptation(itinerary, adaptation) {
  // Implementation for weather-based adaptations
  if (adaptation.data && adaptation.data.alternatives) {
    // Replace outdoor activities with indoor alternatives
    const affectedDate = adaptation.reason.match(/on (\d{4}-\d{2}-\d{2})/)?.[1];
    
    if (affectedDate) {
      const dayToModify = itinerary.days?.find(day => day.date === affectedDate);
      if (dayToModify) {
        // Replace outdoor activities with indoor alternatives
        dayToModify.activities = dayToModify.activities.map(activity => {
          if (activity.type === 'outdoor' || activity.category === 'sightseeing') {
            const alternative = adaptation.data.alternatives[0];
            return {
              ...activity,
              name: alternative.name,
              type: 'indoor',
              description: alternative.description,
              estimatedCost: alternative.estimatedCost,
              weatherAdapted: true
            };
          }
          return activity;
        });
      }
    }
  }
  
  return itinerary;
}

async function applyEventAdaptation(itinerary, adaptation) {
  // Implementation for event-based adaptations
  if (adaptation.data && adaptation.data.event) {
    const event = adaptation.data.event;
    const eventDate = event.date;
    
    const dayToModify = itinerary.days?.find(day => day.date === eventDate);
    if (dayToModify) {
      // Add event to the day
      dayToModify.activities.push({
        id: `event_${event.id}`,
        name: event.name,
        type: event.type,
        description: event.description,
        location: { address: event.location },
        startTime: '19:00',
        duration: 120,
        estimatedCost: 0,
        rating: 4.5,
        eventAdded: true
      });
    }
  }
  
  return itinerary;
}

async function applyBudgetAdaptation(itinerary, adaptation) {
  // Implementation for budget-based adaptations
  if (adaptation.data && adaptation.data.alternatives) {
    // Apply budget alternatives to reduce costs
    for (const alternative of adaptation.data.alternatives) {
      // Find and replace expensive items
      itinerary.days?.forEach(day => {
        day.activities = day.activities.map(activity => {
          if (activity.estimatedCost > alternative.originalCost * 0.8) {
            return {
              ...activity,
              name: alternative.alternative,
              estimatedCost: alternative.alternativeCost,
              budgetOptimized: true
            };
          }
          return activity;
        });
      });
    }
  }
  
  return itinerary;
}

async function applyCrowdAdaptation(itinerary, adaptation) {
  // Implementation for crowd-based adaptations
  const location = adaptation.reason.match(/^(.*?) has/)?.[1];
  
  if (location) {
    itinerary.days?.forEach(day => {
      day.activities = day.activities.map(activity => {
        if (activity.location?.address?.includes(location)) {
          return {
            ...activity,
            crowdAdvisory: adaptation.suggestedChange,
            recommendedTimes: ['09:00-11:00', '16:00-18:00'],
            crowdOptimized: true
          };
        }
        return activity;
      });
    });
  }
  
  return itinerary;
}

// Mock data generators
function generateCrowdDensityData(destination, days) {
  const locations = ['City Center', 'Tourist District', 'Beach Area', 'Shopping Mall'];
  const crowdData = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    locations.forEach(location => {
      const isWeekend = new Date(date).getDay() === 0 || new Date(date).getDay() === 6;
      const baseLevel = isWeekend ? 'high' : 'medium';
      
      crowdData.push({
        location,
        date,
        level: baseLevel,
        peakHours: ['10:00-12:00', '14:00-16:00'],
        bestTimes: ['08:00-10:00', '16:00-18:00'],
        confidence: 0.8
      });
    });
  }
  
  return crowdData;
}

function generateTransportationData(destination) {
  return {
    traffic: {
      current: 'moderate',
      peakHours: ['08:00-10:00', '17:00-19:00'],
      incidents: []
    },
    publicTransport: {
      status: 'normal',
      delays: [],
      alternatives: ['metro', 'bus', 'taxi']
    },
    parking: {
      availability: 'limited',
      averageCost: 15,
      recommendations: ['Park at metro station', 'Use public transport in city center']
    }
  };
}

// Apply specific adaptation
router.post('/apply-adaptation', auth, async (req, res) => {
  try {
    const { itinerary, adaptationId } = req.body;

    if (!itinerary || !adaptationId) {
      return res.status(400).json({ 
        error: 'Itinerary and adaptation ID are required' 
      });
    }

    console.log(`🔧 Applying adaptation ${adaptationId} for user ${req.user.id}`);

    const updatedPlan = await dynamicItineraryService.applyAdaptation(
      itinerary,
      adaptationId
    );

    res.json({
      success: true,
      data: {
        updatedPlan,
        message: 'Adaptation applied successfully'
      }
    });

  } catch (error) {
    console.error('Error applying adaptation:', error);
    res.status(500).json({ 
      error: 'Failed to apply adaptation',
      details: error.message 
    });
  }
});

// Budget optimization endpoint
router.post('/budget-optimize', auth, async (req, res) => {
  try {
    const { itinerary, mode = 'balanced' } = req.body;

    if (!itinerary) {
      return res.status(400).json({ 
        error: 'Itinerary is required' 
      });
    }

    console.log(`💰 Optimizing budget for user ${req.user.id} in ${mode} mode`);

    const budgetOptimization = await dynamicItineraryService.optimizeBudget(
      itinerary,
      null,
      mode
    );

    res.json({
      success: true,
      data: budgetOptimization,
      message: `Budget optimized with potential savings of $${budgetOptimization.totalSavings}`
    });

  } catch (error) {
    console.error('Error optimizing budget:', error);
    res.status(500).json({ 
      error: 'Failed to optimize budget',
      details: error.message 
    });
  }
});

// Route optimization endpoint
router.post('/route-optimize', auth, async (req, res) => {
  try {
    const { itinerary } = req.body;

    if (!itinerary) {
      return res.status(400).json({ 
        error: 'Itinerary is required' 
      });
    }

    console.log(`🗺️ Optimizing routes for user ${req.user.id}`);

    const optimizedRoutes = await dynamicItineraryService.optimizeRoutes(
      itinerary.optimizedPlan || itinerary.originalPlan
    );

    res.json({
      success: true,
      data: {
        optimizedPlan: optimizedRoutes,
        message: 'Routes optimized successfully'
      }
    });

  } catch (error) {
    console.error('Error optimizing routes:', error);
    res.status(500).json({ 
      error: 'Failed to optimize routes',
      details: error.message 
    });
  }
});

module.exports = router;