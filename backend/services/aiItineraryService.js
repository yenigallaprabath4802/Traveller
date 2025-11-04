const axios = require('axios');

class AIItineraryService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  async generateItinerary(tripDetails) {
    const {
      destination,
      duration,
      budget,
      travelers,
      travelStyle,
      interests,
      season,
      accommodation
    } = tripDetails;

    const prompt = this.buildItineraryPrompt(tripDetails);

    try {
      const response = await axios.post(this.baseUrl, {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional travel planner with expertise in creating detailed, budget-conscious itineraries. Always provide practical, realistic recommendations with cost estimates.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      return this.parseItineraryResponse(aiResponse, tripDetails);
    } catch (error) {
      console.error('AI Itinerary Generation Error:', error);
      return this.generateFallbackItinerary(tripDetails);
    }
  }

  buildItineraryPrompt(tripDetails) {
    const {
      destination,
      duration,
      budget,
      travelers,
      travelStyle,
      interests,
      season
    } = tripDetails;

    return `
Create a detailed ${duration}-day travel itinerary for ${destination}.

Trip Details:
- Destination: ${destination}
- Duration: ${duration} days
- Budget: ${budget} (total for ${travelers} travelers)
- Travel Style: ${travelStyle}
- Interests: ${interests.join(', ')}
- Season: ${season}
- Number of Travelers: ${travelers}

Please provide:
1. Day-by-day detailed itinerary with activities
2. Estimated costs for each activity/meal/transport
3. Accommodation recommendations within budget
4. Local transportation options
5. Must-try local cuisine
6. Cultural tips and etiquette
7. Weather considerations
8. Emergency contacts and important info
9. Total estimated cost breakdown
10. Money-saving tips

Format the response as JSON with this structure:
{
  "itinerary": [
    {
      "day": 1,
      "theme": "Arrival & City Exploration",
      "activities": [
        {
          "time": "10:00 AM",
          "activity": "Activity name",
          "location": "Location",
          "cost": 0,
          "duration": "2 hours",
          "description": "Detailed description"
        }
      ],
      "meals": [
        {
          "type": "lunch",
          "restaurant": "Restaurant name",
          "cuisine": "Cuisine type",
          "cost": 0,
          "location": "Location"
        }
      ],
      "accommodation": {
        "name": "Hotel/Hostel name",
        "type": "Hotel/Hostel/Airbnb",
        "cost": 0,
        "location": "Location",
        "amenities": ["WiFi", "Pool"]
      },
      "transportation": {
        "method": "Metro/Taxi/Walking",
        "cost": 0,
        "notes": "Transportation notes"
      },
      "totalDayCost": 0
    }
  ],
  "costBreakdown": {
    "accommodation": 0,
    "food": 0,
    "activities": 0,
    "transportation": 0,
    "miscellaneous": 0,
    "total": 0
  },
  "tips": [
    "Money-saving tip 1",
    "Cultural tip 2"
  ],
  "essentialInfo": {
    "weather": "Weather info",
    "currency": "Local currency",
    "language": "Local language",
    "emergencyNumbers": ["Police: 100", "Medical: 108"]
  }
}
`;
  }

  parseItineraryResponse(aiResponse, tripDetails) {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedItinerary = JSON.parse(jsonMatch[0]);
        
        // Add metadata
        parsedItinerary.metadata = {
          generatedAt: new Date().toISOString(),
          destination: tripDetails.destination,
          duration: tripDetails.duration,
          budget: tripDetails.budget,
          travelers: tripDetails.travelers,
          travelStyle: tripDetails.travelStyle
        };

        return {
          success: true,
          itinerary: parsedItinerary,
          rawResponse: aiResponse
        };
      } else {
        return this.generateFallbackItinerary(tripDetails);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.generateFallbackItinerary(tripDetails);
    }
  }

  generateFallbackItinerary(tripDetails) {
    const { destination, duration, budget, travelers } = tripDetails;
    
    return {
      success: false,
      itinerary: {
        itinerary: Array.from({ length: duration }, (_, i) => ({
          day: i + 1,
          theme: `Day ${i + 1} - Explore ${destination}`,
          activities: [
            {
              time: "09:00 AM",
              activity: "City exploration",
              location: destination,
              cost: Math.floor(budget * 0.1 / duration),
              duration: "3 hours",
              description: "Explore the main attractions and landmarks"
            },
            {
              time: "02:00 PM",
              activity: "Local cuisine experience",
              location: "Local restaurant",
              cost: Math.floor(budget * 0.15 / duration),
              duration: "2 hours",
              description: "Try authentic local dishes"
            }
          ],
          totalDayCost: Math.floor(budget / duration)
        })),
        costBreakdown: {
          accommodation: Math.floor(budget * 0.4),
          food: Math.floor(budget * 0.3),
          activities: Math.floor(budget * 0.2),
          transportation: Math.floor(budget * 0.1),
          total: budget
        },
        tips: [
          "Book accommodations in advance for better rates",
          "Use public transportation to save money",
          "Try local street food for authentic experience"
        ],
        essentialInfo: {
          weather: "Check local weather before departure",
          currency: "Research local currency and exchange rates",
          language: "Learn basic local phrases",
          emergencyNumbers: ["Emergency services: varies by country"]
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          destination,
          duration,
          budget,
          travelers,
          fallback: true
        }
      },
      message: "AI service unavailable. Generated basic itinerary."
    };
  }

  async regenerateItinerary(originalItinerary, modifications) {
    const prompt = `
Based on this existing itinerary: ${JSON.stringify(originalItinerary)}

Please modify it according to these requirements: ${modifications}

Maintain the same JSON structure but adjust activities, costs, and recommendations based on the modifications.
`;

    try {
      const response = await axios.post(this.baseUrl, {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are modifying an existing travel itinerary. Keep the structure consistent while incorporating the requested changes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return this.parseItineraryResponse(response.data.choices[0].message.content, originalItinerary.metadata);
    } catch (error) {
      console.error('Error regenerating itinerary:', error);
      return { success: false, message: 'Failed to regenerate itinerary' };
    }
  }
}

module.exports = new AIItineraryService();