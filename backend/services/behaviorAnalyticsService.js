const mongoose = require('mongoose');

// User Behavior Tracking Schema
const userBehaviorSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  eventType: {
    type: String,
    enum: ['click', 'view', 'search', 'bookmark', 'share', 'like', 'comment', 'book', 'chat'],
    required: true
  },
  eventData: {
    category: String, // destination, activity, accommodation, transport
    subcategory: String, // beach, mountain, city, adventure, luxury, budget
    itemId: String,
    itemName: String,
    price: Number,
    duration: Number,
    location: {
      country: String,
      city: String,
      coordinates: [Number]
    },
    metadata: mongoose.Schema.Types.Mixed
  },
  timestamp: { type: Date, default: Date.now },
  deviceInfo: {
    userAgent: String,
    platform: String,
    screenResolution: String
  },
  context: {
    tripType: { type: String, enum: ['solo', 'family', 'couple', 'group', 'business'] },
    budget: { type: String, enum: ['budget', 'mid-range', 'luxury'] },
    duration: Number, // days
    interests: [String]
  }
});

// User Preference Profile Schema
const userPreferenceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  learningData: {
    travelStyle: {
      adventureLevel: { type: Number, default: 0.5, min: 0, max: 1 }, // 0 = relaxed, 1 = adventure
      budgetPreference: { type: Number, default: 0.5, min: 0, max: 1 }, // 0 = budget, 1 = luxury
      culturalInterest: { type: Number, default: 0.5, min: 0, max: 1 },
      outdoorPreference: { type: Number, default: 0.5, min: 0, max: 1 },
      socialPreference: { type: Number, default: 0.5, min: 0, max: 1 }
    },
    preferredDestinations: [{
      type: { type: String, enum: ['beach', 'mountain', 'city', 'countryside', 'desert', 'tropical'] },
      confidence: { type: Number, min: 0, max: 1 }
    }],
    preferredActivities: [{
      activity: String,
      interest: { type: Number, min: 0, max: 1 },
      frequency: Number
    }],
    tripPatterns: {
      preferredDuration: { min: Number, max: Number },
      seasonalPreferences: [{
        season: { type: String, enum: ['spring', 'summer', 'fall', 'winter'] },
        preference: { type: Number, min: 0, max: 1 }
      }],
      groupSizePreference: { type: String, enum: ['solo', 'couple', 'small-group', 'large-group'] }
    },
    behaviorInsights: {
      planningStyle: { type: String, enum: ['spontaneous', 'moderate', 'detailed'] },
      bookingPattern: { type: String, enum: ['last-minute', 'advance', 'flexible'] },
      informationConsumption: {
        prefersDetails: { type: Number, min: 0, max: 1 },
        prefersVisuals: { type: Number, min: 0, max: 1 },
        prefersReviews: { type: Number, min: 0, max: 1 }
      }
    }
  },
  lastUpdated: { type: Date, default: Date.now },
  confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
  totalInteractions: { type: Number, default: 0 }
});

// Trip History Schema for Learning
const tripHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tripId: { type: String, required: true },
  destination: {
    country: String,
    city: String,
    region: String,
    coordinates: [Number]
  },
  tripDetails: {
    duration: Number,
    budget: Number,
    tripType: String,
    groupSize: Number,
    activities: [String],
    accommodationType: String,
    transportMethods: [String]
  },
  satisfaction: {
    overall: { type: Number, min: 1, max: 5 },
    accommodation: { type: Number, min: 1, max: 5 },
    activities: { type: Number, min: 1, max: 5 },
    budget: { type: Number, min: 1, max: 5 },
    planning: { type: Number, min: 1, max: 5 }
  },
  feedback: {
    likes: [String],
    dislikes: [String],
    improvements: [String],
    wouldRecommend: Boolean
  },
  completedDate: { type: Date, default: Date.now },
  learningWeight: { type: Number, default: 1.0 } // Recent trips have higher weight
});

const UserBehavior = mongoose.models.UserBehavior || mongoose.model('UserBehavior', userBehaviorSchema);
const UserPreference = mongoose.models.UserPreference || mongoose.model('UserPreference', userPreferenceSchema);
const TripHistory = mongoose.models.TripHistory || mongoose.model('TripHistory', tripHistorySchema);

class BehaviorAnalyticsService {
  // Track user behavior events
  async trackEvent(userId, eventType, eventData, context = {}) {
    try {
      const sessionId = context.sessionId || this.generateSessionId();
      
      const behaviorEvent = new UserBehavior({
        userId,
        sessionId,
        eventType,
        eventData,
        context,
        deviceInfo: context.deviceInfo || {}
      });

      await behaviorEvent.save();
      
      // Update user preferences based on this event
      await this.updateUserPreferences(userId, eventType, eventData, context);
      
      return behaviorEvent;
    } catch (error) {
      console.error('Error tracking behavior event:', error);
      throw error;
    }
  }

  // Learn and update user preferences from behavior
  async updateUserPreferences(userId, eventType, eventData, context) {
    try {
      let preferences = await UserPreference.findOne({ userId });
      
      if (!preferences) {
        preferences = new UserPreference({
          userId,
          learningData: {
            travelStyle: {},
            preferredDestinations: [],
            preferredActivities: [],
            tripPatterns: { seasonalPreferences: [] },
            behaviorInsights: { informationConsumption: {} }
          }
        });
      }

      preferences.totalInteractions += 1;
      const learningRate = 0.1; // How much each interaction affects preferences

      // Analyze different event types
      switch (eventType) {
        case 'click':
        case 'view':
          await this.updateFromViewBehavior(preferences, eventData, learningRate);
          break;
        case 'search':
          await this.updateFromSearchBehavior(preferences, eventData, learningRate);
          break;
        case 'bookmark':
        case 'like':
          await this.updateFromEngagementBehavior(preferences, eventData, learningRate * 2);
          break;
        case 'book':
          await this.updateFromBookingBehavior(preferences, eventData, learningRate * 3);
          break;
        case 'chat':
          await this.updateFromChatBehavior(preferences, eventData, context, learningRate);
          break;
      }

      // Update confidence score based on interaction count
      preferences.confidenceScore = Math.min(
        preferences.totalInteractions / 100, // Full confidence after 100 interactions
        1.0
      );

      preferences.lastUpdated = new Date();
      await preferences.save();

      return preferences;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // Update preferences from viewing behavior
  async updateFromViewBehavior(preferences, eventData, learningRate) {
    if (eventData.category) {
      const category = eventData.category.toLowerCase();
      
      // Update destination preferences
      if (['beach', 'mountain', 'city', 'countryside'].includes(category)) {
        const existingPref = preferences.learningData.preferredDestinations
          .find(p => p.type === category);
        
        if (existingPref) {
          existingPref.confidence = Math.min(existingPref.confidence + learningRate, 1.0);
        } else {
          preferences.learningData.preferredDestinations.push({
            type: category,
            confidence: learningRate
          });
        }
      }

      // Update activity preferences
      if (eventData.subcategory) {
        const activity = eventData.subcategory.toLowerCase();
        const existingActivity = preferences.learningData.preferredActivities
          .find(a => a.activity === activity);
        
        if (existingActivity) {
          existingActivity.interest = Math.min(existingActivity.interest + learningRate, 1.0);
          existingActivity.frequency += 1;
        } else {
          preferences.learningData.preferredActivities.push({
            activity,
            interest: learningRate,
            frequency: 1
          });
        }
      }

      // Infer travel style from price points
      if (eventData.price) {
        const budgetSignal = eventData.price > 500 ? learningRate : -learningRate;
        preferences.learningData.travelStyle.budgetPreference = Math.max(0, 
          Math.min(1, preferences.learningData.travelStyle.budgetPreference + budgetSignal)
        );
      }
    }
  }

  // Update preferences from search behavior
  async updateFromSearchBehavior(preferences, eventData, learningRate) {
    // Analyze search terms to understand interests
    if (eventData.searchTerms) {
      const terms = eventData.searchTerms.toLowerCase();
      
      // Adventure keywords
      if (terms.includes('adventure') || terms.includes('hiking') || 
          terms.includes('extreme') || terms.includes('climbing')) {
        preferences.learningData.travelStyle.adventureLevel = Math.min(
          preferences.learningData.travelStyle.adventureLevel + learningRate, 1.0
        );
      }

      // Cultural keywords
      if (terms.includes('museum') || terms.includes('culture') || 
          terms.includes('history') || terms.includes('art')) {
        preferences.learningData.travelStyle.culturalInterest = Math.min(
          preferences.learningData.travelStyle.culturalInterest + learningRate, 1.0
        );
      }

      // Outdoor keywords
      if (terms.includes('nature') || terms.includes('outdoor') || 
          terms.includes('wildlife') || terms.includes('park')) {
        preferences.learningData.travelStyle.outdoorPreference = Math.min(
          preferences.learningData.travelStyle.outdoorPreference + learningRate, 1.0
        );
      }
    }
  }

  // Update preferences from high-engagement behavior
  async updateFromEngagementBehavior(preferences, eventData, learningRate) {
    // Strong signal of preference
    await this.updateFromViewBehavior(preferences, eventData, learningRate);
    
    // Update information consumption preferences
    if (eventData.contentType) {
      const infoConsumption = preferences.learningData.behaviorInsights.informationConsumption;
      
      switch (eventData.contentType) {
        case 'detailed-info':
          infoConsumption.prefersDetails = Math.min(
            (infoConsumption.prefersDetails || 0.5) + learningRate, 1.0
          );
          break;
        case 'photo':
        case 'video':
          infoConsumption.prefersVisuals = Math.min(
            (infoConsumption.prefersVisuals || 0.5) + learningRate, 1.0
          );
          break;
        case 'review':
          infoConsumption.prefersReviews = Math.min(
            (infoConsumption.prefersReviews || 0.5) + learningRate, 1.0
          );
          break;
      }
    }
  }

  // Update preferences from booking behavior
  async updateFromBookingBehavior(preferences, eventData, learningRate) {
    // Booking is the strongest signal of preference
    await this.updateFromEngagementBehavior(preferences, eventData, learningRate);
    
    // Update booking patterns
    if (eventData.bookingAdvance) {
      const advance = eventData.bookingAdvance; // days in advance
      if (advance < 7) {
        preferences.learningData.behaviorInsights.bookingPattern = 'last-minute';
      } else if (advance > 30) {
        preferences.learningData.behaviorInsights.bookingPattern = 'advance';
      } else {
        preferences.learningData.behaviorInsights.bookingPattern = 'flexible';
      }
    }
  }

  // Update preferences from chat behavior
  async updateFromChatBehavior(preferences, eventData, context, learningRate) {
    // Analyze chat content for preferences
    if (eventData.message) {
      const message = eventData.message.toLowerCase();
      
      // Detect planning style from chat patterns
      if (message.includes('detailed') || message.includes('plan') || 
          message.includes('schedule') || message.includes('itinerary')) {
        preferences.learningData.behaviorInsights.planningStyle = 'detailed';
      } else if (message.includes('spontaneous') || message.includes('flexible') || 
                 message.includes('surprise')) {
        preferences.learningData.behaviorInsights.planningStyle = 'spontaneous';
      }

      // Detect social preferences
      if (message.includes('solo') || message.includes('alone')) {
        preferences.learningData.tripPatterns.groupSizePreference = 'solo';
      } else if (message.includes('family') || message.includes('kids')) {
        preferences.learningData.tripPatterns.groupSizePreference = 'large-group';
      } else if (message.includes('couple') || message.includes('romantic')) {
        preferences.learningData.tripPatterns.groupSizePreference = 'couple';
      }
    }

    // Update context-based preferences
    if (context.tripType) {
      preferences.learningData.tripPatterns.groupSizePreference = context.tripType;
    }
  }

  // Generate personalized recommendations
  async getPersonalizedRecommendations(userId, context = {}) {
    try {
      const preferences = await UserPreference.findOne({ userId });
      const recentBehavior = await UserBehavior.find({ userId })
        .sort({ timestamp: -1 })
        .limit(100);

      if (!preferences || preferences.confidenceScore < 0.1) {
        return this.getDefaultRecommendations(context);
      }

      const recommendations = {
        destinations: await this.getDestinationRecommendations(preferences, context),
        activities: await this.getActivityRecommendations(preferences, context),
        accommodations: await this.getAccommodationRecommendations(preferences, context),
        budget: await this.getBudgetRecommendations(preferences, context),
        travelStyle: preferences.learningData.travelStyle,
        confidence: preferences.confidenceScore
      };

      return recommendations;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return this.getDefaultRecommendations(context);
    }
  }

  // Get destination recommendations based on preferences
  async getDestinationRecommendations(preferences, context) {
    const destinationPrefs = preferences.learningData.preferredDestinations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);

    const recommendations = destinationPrefs.map(pref => ({
      type: pref.type,
      confidence: pref.confidence,
      reasoning: this.getDestinationReasoning(pref.type, preferences)
    }));

    return recommendations;
  }

  // Get activity recommendations based on preferences
  async getActivityRecommendations(preferences, context) {
    const activityPrefs = preferences.learningData.preferredActivities
      .sort((a, b) => (b.interest * b.frequency) - (a.interest * a.frequency))
      .slice(0, 10);

    return activityPrefs.map(activity => ({
      activity: activity.activity,
      interest: activity.interest,
      frequency: activity.frequency,
      recommendation: activity.interest > 0.7 ? 'highly-recommended' : 
                     activity.interest > 0.4 ? 'recommended' : 'consider'
    }));
  }

  // Get accommodation recommendations
  async getAccommodationRecommendations(preferences, context) {
    const budgetLevel = preferences.learningData.travelStyle.budgetPreference;
    const socialLevel = preferences.learningData.travelStyle.socialPreference;

    const recommendations = [];

    if (budgetLevel > 0.7) {
      recommendations.push({ type: 'luxury-hotel', confidence: budgetLevel });
      recommendations.push({ type: 'resort', confidence: budgetLevel * 0.9 });
    } else if (budgetLevel < 0.3) {
      recommendations.push({ type: 'hostel', confidence: 1 - budgetLevel });
      recommendations.push({ type: 'budget-hotel', confidence: 1 - budgetLevel });
    } else {
      recommendations.push({ type: 'mid-range-hotel', confidence: 0.8 });
      recommendations.push({ type: 'airbnb', confidence: 0.7 });
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence);
  }

  // Get budget recommendations
  async getBudgetRecommendations(preferences, context) {
    const budgetPreference = preferences.learningData.travelStyle.budgetPreference;
    
    let budgetRange;
    if (budgetPreference > 0.7) {
      budgetRange = { min: 200, max: 500, category: 'luxury' };
    } else if (budgetPreference < 0.3) {
      budgetRange = { min: 30, max: 100, category: 'budget' };
    } else {
      budgetRange = { min: 80, max: 200, category: 'mid-range' };
    }

    return {
      dailyBudget: budgetRange,
      confidence: preferences.confidenceScore,
      reasoning: `Based on your past preferences, you tend towards ${budgetRange.category} options`
    };
  }

  // Get reasoning for destination recommendations
  getDestinationReasoning(destinationType, preferences) {
    const reasons = [];
    
    if (destinationType === 'beach' && preferences.learningData.travelStyle.outdoorPreference > 0.6) {
      reasons.push('You enjoy outdoor activities');
    }
    if (destinationType === 'city' && preferences.learningData.travelStyle.culturalInterest > 0.6) {
      reasons.push('You show interest in cultural experiences');
    }
    if (destinationType === 'mountain' && preferences.learningData.travelStyle.adventureLevel > 0.6) {
      reasons.push('You prefer adventurous destinations');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'Based on your browsing patterns';
  }

  // Default recommendations for new users
  getDefaultRecommendations(context) {
    return {
      destinations: [
        { type: 'city', confidence: 0.5, reasoning: 'Popular choice for first-time users' },
        { type: 'beach', confidence: 0.4, reasoning: 'Relaxing option' }
      ],
      activities: [
        { activity: 'sightseeing', interest: 0.6, recommendation: 'recommended' },
        { activity: 'local-food', interest: 0.7, recommendation: 'highly-recommended' }
      ],
      accommodations: [
        { type: 'mid-range-hotel', confidence: 0.6 }
      ],
      budget: {
        dailyBudget: { min: 80, max: 150, category: 'mid-range' },
        confidence: 0.3,
        reasoning: 'Default recommendation for new users'
      },
      travelStyle: {
        adventureLevel: 0.5,
        budgetPreference: 0.5,
        culturalInterest: 0.5,
        outdoorPreference: 0.5,
        socialPreference: 0.5
      },
      confidence: 0.1
    };
  }

  // Add trip feedback for learning
  async addTripFeedback(userId, tripData, satisfaction, feedback) {
    try {
      const tripHistory = new TripHistory({
        userId,
        tripId: tripData.tripId || this.generateTripId(),
        destination: tripData.destination,
        tripDetails: tripData.details,
        satisfaction,
        feedback,
        learningWeight: 1.0
      });

      await tripHistory.save();

      // Update preferences based on trip satisfaction
      await this.updatePreferencesFromTripFeedback(userId, tripHistory);

      return tripHistory;
    } catch (error) {
      console.error('Error adding trip feedback:', error);
      throw error;
    }
  }

  // Update preferences based on trip feedback
  async updatePreferencesFromTripFeedback(userId, tripHistory) {
    try {
      const preferences = await UserPreference.findOne({ userId });
      if (!preferences) return;

      const satisfactionMultiplier = (tripHistory.satisfaction.overall - 3) / 2; // -1 to 1 scale
      const learningRate = 0.2 * Math.abs(satisfactionMultiplier);

      // Positive feedback reinforces preferences
      if (satisfactionMultiplier > 0) {
        // Reinforce destination type
        const destinationType = this.inferDestinationType(tripHistory.destination);
        if (destinationType) {
          const existingPref = preferences.learningData.preferredDestinations
            .find(p => p.type === destinationType);
          
          if (existingPref) {
            existingPref.confidence = Math.min(existingPref.confidence + learningRate, 1.0);
          }
        }

        // Reinforce activities
        tripHistory.tripDetails.activities.forEach(activity => {
          const existingActivity = preferences.learningData.preferredActivities
            .find(a => a.activity === activity);
          
          if (existingActivity) {
            existingActivity.interest = Math.min(existingActivity.interest + learningRate, 1.0);
          }
        });
      }

      await preferences.save();
    } catch (error) {
      console.error('Error updating preferences from trip feedback:', error);
    }
  }

  // Helper methods
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTripId() {
    return `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  inferDestinationType(destination) {
    const city = destination.city?.toLowerCase() || '';
    const region = destination.region?.toLowerCase() || '';
    
    if (city.includes('beach') || region.includes('coast')) return 'beach';
    if (region.includes('mountain') || city.includes('mountain')) return 'mountain';
    if (city.includes('city') || destination.country) return 'city';
    
    return null;
  }

  // Get user behavior analytics
  async getUserAnalytics(userId, timeframe = '30d') {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      const behavior = await UserBehavior.aggregate([
        { $match: { userId, timestamp: { $gte: startDate } } },
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 },
            categories: { $addToSet: '$eventData.category' },
            avgDuration: { $avg: '$eventData.duration' }
          }
        }
      ]);

      const preferences = await UserPreference.findOne({ userId });
      const tripHistory = await TripHistory.find({ userId }).sort({ completedDate: -1 });

      return {
        behaviorSummary: behavior,
        preferences: preferences?.learningData,
        confidence: preferences?.confidenceScore || 0,
        totalInteractions: preferences?.totalInteractions || 0,
        recentTrips: tripHistory.slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }
}

module.exports = {
  BehaviorAnalyticsService,
  UserBehavior,
  UserPreference,
  TripHistory
};