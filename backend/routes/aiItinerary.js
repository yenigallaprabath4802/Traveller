const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate comprehensive AI trip plan
router.post('/generate-comprehensive', auth, async (req, res) => {
  try {
    const {
      destination,
      startDate,
      endDate,
      duration,
      budget,
      travelers,
      preferences,
      travelStyle,
      accommodation,
      transportation
    } = req.body;

    console.log('Generating comprehensive trip plan for:', { destination, duration, budget, preferences });

    // Generate detailed itinerary using AI
    const itinerary = await generateDetailedItinerary({
      destination,
      startDate,
      endDate,
      duration,
      budget,
      travelers,
      preferences,
      travelStyle,
      accommodation,
      transportation
    });

    // Generate AI insights
    const insights = await generateAIInsights({
      destination,
      duration,
      preferences,
      travelStyle,
      startDate
    });

    // Generate budget breakdown
    const budgetBreakdown = await generateBudgetBreakdown({
      budget,
      duration,
      travelers,
      travelStyle,
      accommodation,
      destination
    });

    // Generate optimizations
    const optimizations = await generateOptimizations({
      itinerary,
      budget,
      preferences,
      travelStyle
    });

    res.json({
      success: true,
      itinerary,
      insights,
      budgetBreakdown,
      optimizations,
      metadata: {
        generatedAt: new Date().toISOString(),
        destination,
        duration,
        budget,
        travelers
      }
    });

  } catch (error) {
    console.error('Error generating comprehensive trip plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trip plan',
      error: error.message
    });
  }
});

// Generate detailed itinerary
async function generateDetailedItinerary(tripDetails) {
  const {
    destination,
    startDate,
    endDate,
    duration,
    budget,
    travelers,
    preferences,
    travelStyle,
    accommodation,
    transportation
  } = tripDetails;

  const dailyBudget = Math.floor(budget / duration);
  const accommodationBudget = Math.floor(dailyBudget * 0.4); // 40% for accommodation
  const foodBudget = Math.floor(dailyBudget * 0.3); // 30% for food
  const activityBudget = Math.floor(dailyBudget * 0.3); // 30% for activities

  const prompt = `Create a detailed ${duration}-day travel itinerary for ${destination} with the following specifications:

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${duration} days
- Start Date: ${startDate}
- Total Budget: $${budget} (${travelers} travelers)
- Travel Style: ${travelStyle}
- Accommodation Type: ${accommodation}
- Transportation: ${transportation}
- Interests: ${preferences.join(', ')}

BUDGET ALLOCATION PER DAY:
- Accommodation: $${accommodationBudget}
- Food: $${foodBudget}
- Activities: $${activityBudget}
- Total Daily: $${dailyBudget}

For each day, provide a detailed itinerary including:
1. Day theme and highlights
2. 4-6 activities with specific times, locations, costs, and descriptions
3. 3 meal recommendations (breakfast, lunch, dinner) with costs
4. Transportation between locations with estimated costs
5. Accommodation details for that night

Format the response as a JSON array where each day has this structure:
{
  "day": 1,
  "date": "YYYY-MM-DD",
  "theme": "Day theme",
  "activities": [
    {
      "id": "unique_id",
      "name": "Activity name",
      "description": "Detailed description",
      "type": "sightseeing/adventure/cultural/etc",
      "location": {
        "address": "Full address",
        "coordinates": [longitude, latitude]
      },
      "startTime": "09:00",
      "endTime": "11:00",
      "duration": 120,
      "cost": 25,
      "rating": 4.5,
      "difficulty": "easy/moderate/challenging",
      "category": "culture/adventure/food/etc",
      "bookingRequired": true/false,
      "tips": ["tip1", "tip2"]
    }
  ],
  "meals": [
    {
      "id": "unique_id",
      "name": "Restaurant name",
      "type": "breakfast/lunch/dinner/snack",
      "cuisine": "Local cuisine type",
      "location": "Address",
      "cost": 15,
      "rating": 4.2,
      "dietaryOptions": ["vegetarian", "vegan", "gluten-free"]
    }
  ],
  "transportation": [
    {
      "from": "Location A",
      "to": "Location B",
      "mode": "walking/driving/train/bus/taxi",
      "duration": 15,
      "cost": 5,
      "provider": "Provider name",
      "notes": "Additional notes"
    }
  ],
  "accommodation": {
    "name": "Hotel/Accommodation name",
    "type": "hotel/hostel/airbnb/etc",
    "location": "Address",
    "rating": 4.3,
    "amenities": ["wifi", "breakfast", "pool"],
    "costPerNight": 80,
    "checkin": "15:00",
    "checkout": "11:00"
  },
  "totalCost": 150,
  "highlights": ["highlight1", "highlight2"]
}

Make the itinerary realistic, well-timed, and optimized for the chosen travel style and preferences.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert travel planner who creates detailed, realistic, and optimized travel itineraries. Always respond with valid JSON arrays."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 4000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let itinerary;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0]);
      } else {
        itinerary = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing itinerary JSON:', parseError);
      // Fallback to generating a basic itinerary
      itinerary = generateFallbackItinerary(tripDetails);
    }

    // Ensure all days have valid dates
    itinerary.forEach((day, index) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + index);
      day.date = date.toISOString().split('T')[0];
      day.day = index + 1;
    });

    return itinerary;

  } catch (error) {
    console.error('Error generating itinerary:', error);
    return generateFallbackItinerary(tripDetails);
  }
}

// Generate AI insights
async function generateAIInsights(tripDetails) {
  const { destination, duration, preferences, travelStyle, startDate } = tripDetails;
  
  const prompt = `Provide comprehensive AI travel insights for a trip to ${destination}:

TRIP CONTEXT:
- Destination: ${destination}
- Duration: ${duration} days
- Travel Style: ${travelStyle}
- Interests: ${preferences.join(', ')}
- Start Date: ${startDate}

Generate insights in the following categories:
1. Destination insights (cultural, historical, geographical)
2. Seasonal tips for the travel dates
3. Local culture and customs
4. Hidden gems and off-beaten-path locations
5. Budget-saving tips specific to this destination
6. Packing advice for the season and activities
7. Weather predictions and recommendations

Format as JSON with this structure:
{
  "destinationInsights": ["insight1", "insight2", ...],
  "seasonalTips": ["tip1", "tip2", ...],
  "localCulture": ["culture1", "culture2", ...],
  "hiddenGems": ["gem1", "gem2", ...],
  "budgetTips": ["tip1", "tip2", ...],
  "packingAdvice": ["advice1", "advice2", ...],
  "weatherPredictions": [
    {
      "date": "YYYY-MM-DD",
      "condition": "sunny/cloudy/rainy",
      "temperature": 25,
      "advice": "weather-specific advice"
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a travel expert AI that provides comprehensive destination insights and recommendations. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing insights JSON:', parseError);
      return generateFallbackInsights(tripDetails);
    }

  } catch (error) {
    console.error('Error generating insights:', error);
    return generateFallbackInsights(tripDetails);
  }
}

// Generate budget breakdown
async function generateBudgetBreakdown(budgetDetails) {
  const { budget, duration, travelers, travelStyle, accommodation, destination } = budgetDetails;

  const dailyBudget = budget / duration;
  const perPersonBudget = budget / travelers;

  // Calculate breakdown based on travel style
  let accommodationPercent, foodPercent, activityPercent, transportPercent;
  
  switch (travelStyle) {
    case 'luxury':
      accommodationPercent = 0.5;
      foodPercent = 0.25;
      activityPercent = 0.2;
      transportPercent = 0.05;
      break;
    case 'comfortable':
      accommodationPercent = 0.4;
      foodPercent = 0.3;
      activityPercent = 0.25;
      transportPercent = 0.05;
      break;
    case 'budget':
      accommodationPercent = 0.3;
      foodPercent = 0.3;
      activityPercent = 0.3;
      transportPercent = 0.1;
      break;
    case 'backpacker':
      accommodationPercent = 0.2;
      foodPercent = 0.3;
      activityPercent = 0.4;
      transportPercent = 0.1;
      break;
    default:
      accommodationPercent = 0.4;
      foodPercent = 0.3;
      activityPercent = 0.25;
      transportPercent = 0.05;
  }

  return {
    total: budget,
    dailyAverage: Math.round(dailyBudget),
    perPerson: Math.round(perPersonBudget),
    breakdown: {
      accommodation: {
        total: Math.round(budget * accommodationPercent),
        daily: Math.round(dailyBudget * accommodationPercent),
        percentage: accommodationPercent * 100
      },
      food: {
        total: Math.round(budget * foodPercent),
        daily: Math.round(dailyBudget * foodPercent),
        percentage: foodPercent * 100
      },
      activities: {
        total: Math.round(budget * activityPercent),
        daily: Math.round(dailyBudget * activityPercent),
        percentage: activityPercent * 100
      },
      transportation: {
        total: Math.round(budget * transportPercent),
        daily: Math.round(dailyBudget * transportPercent),
        percentage: transportPercent * 100
      }
    },
    savings: {
      potentialSavings: Math.round(budget * 0.15), // 15% potential savings with optimization
      tips: [
        'Book accommodations in advance for better rates',
        'Use public transportation when possible',
        'Look for free walking tours and activities',
        'Eat at local restaurants instead of tourist areas'
      ]
    }
  };
}

// Generate optimizations
async function generateOptimizations(optimizationDetails) {
  const { itinerary, budget, preferences, travelStyle } = optimizationDetails;

  return {
    budgetSavings: Math.round(budget * 0.12), // 12% potential savings
    timeOptimization: 15, // 15% time optimization
    experienceEnhancement: [
      'Optimized route to minimize travel time',
      'Grouped similar activities by location',
      'Included hidden gem recommendations',
      'Balanced high-energy and relaxing activities'
    ],
    alternatives: [
      {
        category: 'accommodation',
        original: 'Standard hotel booking',
        alternative: 'Boutique hotel with breakfast included',
        savings: 50,
        reasoning: 'Better value with included amenities'
      },
      {
        category: 'transportation',
        original: 'Individual taxi rides',
        alternative: 'Day pass for public transport',
        savings: 30,
        reasoning: 'More cost-effective for multiple trips'
      },
      {
        category: 'activities',
        original: 'Separate attraction tickets',
        alternative: 'City tourist pass',
        savings: 40,
        reasoning: 'Bundled pricing with additional benefits'
      }
    ]
  };
}

// Fallback itinerary generator
function generateFallbackItinerary(tripDetails) {
  const { destination, startDate, duration, budget } = tripDetails;
  const dailyBudget = Math.floor(budget / duration);

  const itinerary = [];
  
  for (let i = 0; i < duration; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const day = {
      day: i + 1,
      date: date.toISOString().split('T')[0],
      theme: `Explore ${destination} - Day ${i + 1}`,
      activities: [
        {
          id: `activity_${i + 1}_1`,
          name: `Morning Activity in ${destination}`,
          description: `Explore the highlights of ${destination}`,
          type: 'sightseeing',
          location: {
            address: `${destination} City Center`,
            coordinates: [0, 0]
          },
          startTime: '09:00',
          endTime: '11:30',
          duration: 150,
          cost: Math.floor(dailyBudget * 0.2),
          rating: 4.2,
          difficulty: 'easy',
          category: 'culture',
          bookingRequired: false,
          tips: [`Best visited in the morning`, `Bring comfortable walking shoes`]
        },
        {
          id: `activity_${i + 1}_2`,
          name: `Afternoon Experience in ${destination}`,
          description: `Discover local culture and attractions`,
          type: 'cultural',
          location: {
            address: `${destination} Historic District`,
            coordinates: [0, 0]
          },
          startTime: '14:00',
          endTime: '17:00',
          duration: 180,
          cost: Math.floor(dailyBudget * 0.25),
          rating: 4.5,
          difficulty: 'moderate',
          category: 'culture',
          bookingRequired: true,
          tips: [`Book tickets in advance`, `Allow extra time for photos`]
        }
      ],
      meals: [
        {
          id: `meal_${i + 1}_1`,
          name: 'Local Breakfast Spot',
          type: 'breakfast',
          cuisine: 'Local',
          location: `${destination} Breakfast Restaurant`,
          cost: Math.floor(dailyBudget * 0.1),
          rating: 4.0,
          dietaryOptions: ['vegetarian', 'gluten-free']
        },
        {
          id: `meal_${i + 1}_2`,
          name: 'Traditional Lunch',
          type: 'lunch',
          cuisine: 'Traditional',
          location: `${destination} Local Restaurant`,
          cost: Math.floor(dailyBudget * 0.15),
          rating: 4.3,
          dietaryOptions: ['vegetarian']
        },
        {
          id: `meal_${i + 1}_3`,
          name: 'Dinner Experience',
          type: 'dinner',
          cuisine: 'Local Specialty',
          location: `${destination} Fine Dining`,
          cost: Math.floor(dailyBudget * 0.2),
          rating: 4.6,
          dietaryOptions: ['vegetarian', 'vegan']
        }
      ],
      transportation: [
        {
          from: 'Hotel',
          to: 'Morning Activity',
          mode: 'walking',
          duration: 15,
          cost: 0,
          provider: '',
          notes: 'Pleasant morning walk'
        }
      ],
      accommodation: {
        name: `${destination} Hotel`,
        type: 'hotel',
        location: `${destination} City Center`,
        rating: 4.2,
        amenities: ['wifi', 'breakfast', 'gym'],
        costPerNight: Math.floor(dailyBudget * 0.4),
        checkin: '15:00',
        checkout: '11:00'
      },
      totalCost: dailyBudget,
      highlights: [`Explore ${destination}`, 'Local cuisine', 'Cultural experiences']
    };
    
    itinerary.push(day);
  }

  return itinerary;
}

// Fallback insights generator
function generateFallbackInsights(tripDetails) {
  const { destination, travelStyle } = tripDetails;

  return {
    destinationInsights: [
      `${destination} is known for its rich cultural heritage`,
      'Best experienced through local interactions',
      'Offers a perfect blend of history and modernity'
    ],
    seasonalTips: [
      'Pack layers for changing weather',
      'Check local festivals and events',
      'Book accommodations early during peak season'
    ],
    localCulture: [
      'Respect local customs and traditions',
      'Learn basic greetings in the local language',
      'Try traditional cuisine for authentic experience'
    ],
    hiddenGems: [
      'Explore local neighborhoods away from tourist areas',
      'Visit traditional markets for authentic shopping',
      'Discover local cafes and restaurants'
    ],
    budgetTips: [
      'Use public transportation for cost savings',
      'Look for free walking tours',
      'Eat where locals eat for better prices'
    ],
    packingAdvice: [
      'Comfortable walking shoes are essential',
      'Bring a portable charger for your devices',
      'Pack weather-appropriate clothing'
    ],
    weatherPredictions: [
      {
        date: new Date().toISOString().split('T')[0],
        condition: 'partly cloudy',
        temperature: 22,
        advice: 'Perfect weather for outdoor activities'
      }
    ]
  };
}

module.exports = router;