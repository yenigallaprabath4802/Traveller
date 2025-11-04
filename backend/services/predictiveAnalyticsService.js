const OpenAI = require('openai');
const mongoose = require('mongoose');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Analytics Data Schemas
const TravelAnalyticsSchema = new mongoose.Schema({
  destination: { type: String, required: true },
  country: { type: String, required: true },
  region: { type: String, required: true },
  analytics: {
    currentPrice: { type: Number, default: 0 },
    predictedPrice: { type: Number, default: 0 },
    priceChange: { type: Number, default: 0 },
    trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    popularity: { type: Number, min: 0, max: 100, default: 50 },
    weatherScore: { type: Number, min: 0, max: 100, default: 50 },
    crowdLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    optimalMonth: { type: String, default: '' },
    seasonality: { type: String, default: '' }
  },
  priceHistory: [{
    month: String,
    year: Number,
    avgPrice: Number,
    flightPrice: Number,
    hotelPrice: Number,
    activities: Number,
    timestamp: { type: Date, default: Date.now }
  }],
  predictions: [{
    month: String,
    year: Number,
    predictedPrice: Number,
    confidence: Number,
    factors: [String],
    timestamp: { type: Date, default: Date.now }
  }],
  marketFactors: {
    economicIndicators: [String],
    seasonalEvents: [String],
    weatherPatterns: [String],
    exchangeRates: Number,
    politicalStability: Number,
    touristSentiment: Number
  },
  insights: [String],
  lastUpdated: { type: Date, default: Date.now }
});

const UserTravelPatternSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  analytics: {
    spendingPattern: { type: String, enum: ['budget', 'moderate', 'luxury'], default: 'moderate' },
    averageTripCost: { type: Number, default: 0 },
    totalSavings: { type: Number, default: 0 },
    travelFrequency: { type: Number, default: 0 },
    budgetEfficiency: { type: Number, min: 0, max: 100, default: 50 },
    preferredMonths: [String],
    destinationTypes: [String],
    bookingLeadTime: { type: Number, default: 0 }, // days in advance
    priceFlexibility: { type: Number, min: 0, max: 100, default: 50 }
  },
  travelHistory: [{
    destination: String,
    travelDate: Date,
    bookingDate: Date,
    totalCost: Number,
    savingsAchieved: Number,
    satisfactionScore: Number,
    tripType: String
  }],
  recommendations: [{
    type: { type: String, enum: ['timing', 'destination', 'loyalty', 'booking'], required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    potentialSavings: { type: Number, default: 0 },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    validUntil: Date,
    applied: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  lastAnalyzed: { type: Date, default: Date.now }
});

const MarketTrendSchema = new mongoose.Schema({
  region: { type: String, required: true },
  category: { type: String, enum: ['flights', 'hotels', 'experiences', 'car_rentals'], required: true },
  trend: {
    direction: { type: String, enum: ['rising', 'declining', 'stable'], default: 'stable' },
    percentage: { type: Number, default: 0 },
    confidence: { type: Number, min: 0, max: 100, default: 50 },
    prediction: { type: String, default: '' },
    impact: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  marketData: {
    currentValue: Number,
    projectedValue: Number,
    volatilityIndex: Number,
    demandScore: Number,
    supplyScore: Number,
    competitionLevel: Number
  },
  factors: [String],
  seasonalPatterns: [{
    month: String,
    totalTravelers: Number,
    avgSpending: Number,
    satisfaction: Number,
    marketShare: Number
  }],
  emergingDestinations: [{
    destination: String,
    growthRate: Number,
    avgCost: Number,
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    investmentPotential: Number
  }],
  lastUpdated: { type: Date, default: Date.now }
});

// Create models
const TravelAnalytics = mongoose.models.TravelAnalytics || mongoose.model('TravelAnalytics', TravelAnalyticsSchema);
const UserTravelPattern = mongoose.models.UserTravelPattern || mongoose.model('UserTravelPattern', UserTravelPatternSchema);
const MarketTrend = mongoose.models.MarketTrend || mongoose.model('MarketTrend', MarketTrendSchema);

class PredictiveAnalyticsService {
  // Generate comprehensive travel trends analysis
  async generateTravelTrends(filters = {}) {
    try {
      console.log('🔮 Generating travel trends with AI analysis...');

      const { region = 'global', timeframe = '1y', category = 'all' } = filters;

      // Get existing analytics data
      let analyticsData = await TravelAnalytics.find({
        ...(region !== 'global' && { region }),
        lastUpdated: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      }).limit(20);

      // If no recent data, generate fresh analytics
      if (analyticsData.length === 0) {
        analyticsData = await this.generateFreshAnalytics();
      }

      // Enhance with AI predictions
      const enhancedAnalytics = await Promise.all(
        analyticsData.map(async (destination) => {
          return await this.enhanceDestinationAnalytics(destination);
        })
      );

      return enhancedAnalytics;

    } catch (error) {
      console.error('Error generating travel trends:', error);
      throw error;
    }
  }

  // Generate fresh analytics data for destinations
  async generateFreshAnalytics() {
    console.log('🆕 Generating fresh analytics data...');

    const destinations = [
      { name: 'Paris, France', country: 'France', region: 'Europe' },
      { name: 'Tokyo, Japan', country: 'Japan', region: 'Asia' },
      { name: 'Bali, Indonesia', country: 'Indonesia', region: 'Asia' },
      { name: 'New York, USA', country: 'USA', region: 'North America' },
      { name: 'Barcelona, Spain', country: 'Spain', region: 'Europe' },
      { name: 'Santorini, Greece', country: 'Greece', region: 'Europe' },
      { name: 'Dubai, UAE', country: 'UAE', region: 'Middle East' },
      { name: 'London, UK', country: 'UK', region: 'Europe' },
      { name: 'Rome, Italy', country: 'Italy', region: 'Europe' },
      { name: 'Bangkok, Thailand', country: 'Thailand', region: 'Asia' },
      { name: 'Sydney, Australia', country: 'Australia', region: 'Oceania' },
      { name: 'Maldives', country: 'Maldives', region: 'Asia' },
      { name: 'Reykjavik, Iceland', country: 'Iceland', region: 'Europe' },
      { name: 'Marrakech, Morocco', country: 'Morocco', region: 'Africa' },
      { name: 'Ho Chi Minh City, Vietnam', country: 'Vietnam', region: 'Asia' },
      { name: 'Lisbon, Portugal', country: 'Portugal', region: 'Europe' },
      { name: 'Dubrovnik, Croatia', country: 'Croatia', region: 'Europe' },
      { name: 'Bergen, Norway', country: 'Norway', region: 'Europe' }
    ];

    const analyticsData = [];

    for (const dest of destinations) {
      // Generate realistic price and trend data
      const basePrice = 500 + Math.random() * 2000;
      const priceVariation = (Math.random() - 0.5) * 0.4; // -20% to +20%
      const currentPrice = Math.round(basePrice);
      const predictedPrice = Math.round(basePrice * (1 + priceVariation));
      const priceChange = ((predictedPrice - currentPrice) / currentPrice) * 100;

      // Determine trend based on price change
      let trend = 'stable';
      if (priceChange > 5) trend = 'up';
      else if (priceChange < -5) trend = 'down';

      // Generate analytics object
      const analytics = new TravelAnalytics({
        destination: dest.name,
        country: dest.country,
        region: dest.region,
        analytics: {
          currentPrice,
          predictedPrice,
          priceChange: Math.round(priceChange * 10) / 10,
          trend,
          confidence: 75 + Math.round(Math.random() * 20), // 75-95%
          popularity: 50 + Math.round(Math.random() * 50), // 50-100%
          weatherScore: 60 + Math.round(Math.random() * 40), // 60-100%
          crowdLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          optimalMonth: ['March', 'April', 'May', 'September', 'October'][Math.floor(Math.random() * 5)],
          seasonality: ['Peak Season', 'Shoulder Season', 'Off Season'][Math.floor(Math.random() * 3)]
        },
        priceHistory: this.generatePriceHistory(),
        predictions: this.generatePredictions(),
        marketFactors: {
          economicIndicators: ['Currency exchange rates', 'Local inflation', 'Tourism policies'],
          seasonalEvents: ['Local festivals', 'Weather patterns', 'Holiday seasons'],
          weatherPatterns: ['Temperature trends', 'Rainfall patterns', 'Seasonal changes'],
          exchangeRates: 0.85 + Math.random() * 0.3, // Simulated rate
          politicalStability: 70 + Math.round(Math.random() * 30),
          touristSentiment: 60 + Math.round(Math.random() * 40)
        },
        insights: await this.generateDestinationInsights(dest.name, trend, priceChange)
      });

      const savedAnalytics = await analytics.save();
      analyticsData.push(savedAnalytics);
    }

    return analyticsData;
  }

  // Generate price history for destinations
  generatePriceHistory() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    
    return months.map(month => {
      const basePrice = 600 + Math.random() * 800;
      return {
        month,
        year: currentYear,
        avgPrice: Math.round(basePrice),
        flightPrice: Math.round(basePrice * 0.4 + Math.random() * 200),
        hotelPrice: Math.round(basePrice * 0.35 + Math.random() * 150),
        activities: Math.round(basePrice * 0.25 + Math.random() * 100),
        timestamp: new Date()
      };
    });
  }

  // Generate price predictions
  generatePredictions() {
    const futureMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const nextYear = new Date().getFullYear() + 1;
    
    return futureMonths.map(month => ({
      month,
      year: nextYear,
      predictedPrice: Math.round(550 + Math.random() * 900),
      confidence: 70 + Math.round(Math.random() * 25),
      factors: [
        'Seasonal demand patterns',
        'Currency exchange fluctuations',
        'Local event calendar',
        'Weather forecast data',
        'Historical booking trends'
      ].slice(0, 3 + Math.floor(Math.random() * 3)),
      timestamp: new Date()
    }));
  }

  // Enhanced destination analytics with AI insights
  async enhanceDestinationAnalytics(destination) {
    try {
      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(destination);
      
      return {
        ...destination.toObject(),
        aiInsights,
        recommendedActions: await this.generateRecommendedActions(destination),
        riskAssessment: this.calculateRiskAssessment(destination),
        opportunityScore: this.calculateOpportunityScore(destination)
      };

    } catch (error) {
      console.error('Error enhancing destination analytics:', error);
      return destination.toObject();
    }
  }

  // Generate AI-powered insights using OpenAI
  async generateAIInsights(destination) {
    try {
      const prompt = `
        As a travel analytics expert, analyze this destination data and provide insights:
        
        Destination: ${destination.destination}
        Current Price: $${destination.analytics.currentPrice}
        Predicted Price: $${destination.analytics.predictedPrice}
        Price Change: ${destination.analytics.priceChange}%
        Trend: ${destination.analytics.trend}
        Popularity: ${destination.analytics.popularity}%
        Weather Score: ${destination.analytics.weatherScore}%
        Crowd Level: ${destination.analytics.crowdLevel}
        Optimal Month: ${destination.analytics.optimalMonth}
        
        Provide 3-4 concise, actionable insights about:
        1. Best booking timing
        2. Value opportunities
        3. Market conditions
        4. Travel recommendations
        
        Format as a JSON array of strings.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      });

      const insights = JSON.parse(response.choices[0].message.content);
      return insights;

    } catch (error) {
      console.error('Error generating AI insights:', error);
      return [
        'Historical data suggests optimal booking 6-8 weeks in advance',
        'Weather conditions favorable during shoulder season months',
        'Price volatility indicates potential savings opportunities',
        'Market sentiment suggests stable demand patterns'
      ];
    }
  }

  // Generate destination-specific insights
  async generateDestinationInsights(destination, trend, priceChange) {
    const insights = [];

    if (trend === 'down' && priceChange < -10) {
      insights.push(`Exceptional value opportunity with ${Math.abs(priceChange).toFixed(1)}% price reduction expected`);
    } else if (trend === 'up' && priceChange > 15) {
      insights.push(`Prices rising rapidly - book early to secure current rates`);
    }

    insights.push('Shoulder season offers optimal balance of weather and value');
    insights.push('Local events and festivals can significantly impact accommodation rates');
    insights.push('Weather patterns suggest favorable conditions for outdoor activities');

    return insights;
  }

  // Generate recommended actions
  async generateRecommendedActions(destination) {
    const actions = [];
    const analytics = destination.analytics;

    if (analytics.trend === 'down') {
      actions.push({
        action: 'wait',
        description: 'Wait 2-3 months for better prices',
        potential_savings: Math.abs(analytics.priceChange) * analytics.currentPrice / 100,
        confidence: analytics.confidence
      });
    } else if (analytics.trend === 'up') {
      actions.push({
        action: 'book_now',
        description: 'Book immediately to avoid price increases',
        potential_savings: analytics.priceChange * analytics.currentPrice / 100,
        confidence: analytics.confidence
      });
    }

    if (analytics.crowdLevel === 'low') {
      actions.push({
        action: 'book_optimal_time',
        description: `Travel in ${analytics.optimalMonth} for fewer crowds`,
        potential_savings: 0,
        confidence: 85
      });
    }

    return actions;
  }

  // Calculate risk assessment
  calculateRiskAssessment(destination) {
    const factors = {
      priceVolatility: Math.abs(destination.analytics.priceChange) > 20 ? 'high' : 'low',
      marketStability: destination.analytics.confidence > 80 ? 'stable' : 'volatile',
      weatherRisk: destination.analytics.weatherScore < 70 ? 'high' : 'low',
      crowdRisk: destination.analytics.crowdLevel === 'high' ? 'high' : 'low'
    };

    const riskScore = Object.values(factors).filter(f => f === 'high').length;
    
    return {
      overall: riskScore > 2 ? 'high' : riskScore > 1 ? 'medium' : 'low',
      factors
    };
  }

  // Calculate opportunity score
  calculateOpportunityScore(destination) {
    const analytics = destination.analytics;
    let score = 50; // Base score

    // Price opportunity
    if (analytics.priceChange < -10) score += 20;
    else if (analytics.priceChange < -5) score += 10;
    else if (analytics.priceChange > 10) score -= 15;

    // Crowd level opportunity
    if (analytics.crowdLevel === 'low') score += 15;
    else if (analytics.crowdLevel === 'high') score -= 10;

    // Weather score
    score += (analytics.weatherScore - 50) / 5;

    // Confidence adjustment
    score += (analytics.confidence - 50) / 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  // Analyze user travel patterns
  async analyzeUserTravelPattern(userId) {
    try {
      console.log('👤 Analyzing user travel patterns...');

      let userPattern = await UserTravelPattern.findOne({ userId });

      if (!userPattern) {
        // Create new user pattern analysis
        userPattern = await this.createUserTravelPattern(userId);
      } else {
        // Update existing analysis
        userPattern = await this.updateUserTravelPattern(userPattern);
      }

      // Generate personalized recommendations
      const recommendations = await this.generatePersonalizedRecommendations(userPattern);
      
      return {
        ...userPattern.toObject(),
        recommendations
      };

    } catch (error) {
      console.error('Error analyzing user travel pattern:', error);
      throw error;
    }
  }

  // Create new user travel pattern
  async createUserTravelPattern(userId) {
    const pattern = new UserTravelPattern({
      userId,
      analytics: {
        spendingPattern: 'moderate',
        averageTripCost: 1500 + Math.random() * 1000,
        totalSavings: Math.random() * 2000,
        travelFrequency: 2 + Math.random() * 4,
        budgetEfficiency: 60 + Math.random() * 30,
        preferredMonths: ['May', 'September', 'October'],
        destinationTypes: ['Cultural', 'Adventure', 'Beach'],
        bookingLeadTime: 30 + Math.random() * 60,
        priceFlexibility: 50 + Math.random() * 30
      },
      travelHistory: this.generateMockTravelHistory(),
      recommendations: []
    });

    return await pattern.save();
  }

  // Generate mock travel history
  generateMockTravelHistory() {
    const destinations = ['Paris', 'Tokyo', 'Bali', 'New York', 'Barcelona'];
    const history = [];

    for (let i = 0; i < 5; i++) {
      const travelDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const bookingDate = new Date(travelDate.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
      
      history.push({
        destination: destinations[Math.floor(Math.random() * destinations.length)],
        travelDate,
        bookingDate,
        totalCost: 800 + Math.random() * 2000,
        savingsAchieved: Math.random() * 500,
        satisfactionScore: 3 + Math.random() * 2,
        tripType: ['Business', 'Leisure', 'Adventure'][Math.floor(Math.random() * 3)]
      });
    }

    return history;
  }

  // Generate personalized recommendations
  async generatePersonalizedRecommendations(userPattern) {
    const recommendations = [];

    // Timing recommendation
    if (userPattern.analytics.bookingLeadTime < 30) {
      recommendations.push({
        type: 'timing',
        title: 'Book flights earlier for better prices',
        description: 'Based on your travel history, booking flights 6-8 weeks in advance could save you $200-400 per trip.',
        potentialSavings: 300,
        confidence: 85,
        priority: 'high'
      });
    }

    // Seasonal recommendation
    if (userPattern.analytics.preferredMonths.includes('July') || userPattern.analytics.preferredMonths.includes('August')) {
      recommendations.push({
        type: 'destination',
        title: 'Consider shoulder season travel',
        description: 'Traveling in May or September instead of peak summer could reduce costs by 25% while maintaining great weather.',
        potentialSavings: Math.round(userPattern.analytics.averageTripCost * 0.25),
        confidence: 78,
        priority: 'medium'
      });
    }

    // Loyalty program recommendation
    recommendations.push({
      type: 'loyalty',
      title: 'Maximize loyalty program benefits',
      description: 'Consistent use of airline and hotel loyalty programs could provide 15% additional savings and upgrades.',
      potentialSavings: Math.round(userPattern.analytics.averageTripCost * 0.15),
      confidence: 70,
      priority: 'medium'
    });

    return recommendations;
  }

  // Generate market analytics
  async generateMarketAnalytics() {
    try {
      console.log('📊 Generating comprehensive market analytics...');

      // Get or create market trends
      let marketTrends = await MarketTrend.find({
        lastUpdated: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      });

      if (marketTrends.length === 0) {
        marketTrends = await this.generateFreshMarketTrends();
      }

      return {
        globalTrends: this.generateGlobalTrends(),
        seasonalPatterns: this.generateSeasonalPatterns(),
        emergingDestinations: this.generateEmergingDestinations(),
        marketTrends: marketTrends.map(trend => trend.toObject())
      };

    } catch (error) {
      console.error('Error generating market analytics:', error);
      throw error;
    }
  }

  // Generate fresh market trends
  async generateFreshMarketTrends() {
    const regions = ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];
    const categories = ['flights', 'hotels', 'experiences', 'car_rentals'];
    const trends = [];

    for (const region of regions) {
      for (const category of categories) {
        const trend = new MarketTrend({
          region,
          category,
          trend: {
            direction: ['rising', 'declining', 'stable'][Math.floor(Math.random() * 3)],
            percentage: (Math.random() - 0.5) * 30, // -15% to +15%
            confidence: 70 + Math.random() * 25,
            prediction: ['Growth expected', 'Decline anticipated', 'Stable outlook'][Math.floor(Math.random() * 3)],
            impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
          },
          marketData: {
            currentValue: 1000 + Math.random() * 5000,
            projectedValue: 1000 + Math.random() * 6000,
            volatilityIndex: Math.random() * 100,
            demandScore: 50 + Math.random() * 50,
            supplyScore: 50 + Math.random() * 50,
            competitionLevel: Math.random() * 100
          },
          factors: [
            'Economic indicators',
            'Seasonal demand',
            'Currency fluctuations',
            'Political stability',
            'Weather patterns'
          ].slice(0, 3),
          seasonalPatterns: this.generateSeasonalPatterns(),
          emergingDestinations: this.generateEmergingDestinations()
        });

        const savedTrend = await trend.save();
        trends.push(savedTrend);
      }
    }

    return trends;
  }

  // Generate global trends data
  generateGlobalTrends() {
    const regions = ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];
    
    return regions.map(region => ({
      region,
      growth: (Math.random() - 0.3) * 40, // Bias toward positive growth
      avgCost: 800 + Math.random() * 1500,
      popularityIndex: 50 + Math.random() * 50
    }));
  }

  // Generate seasonal patterns
  generateSeasonalPatterns() {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    return months.map(month => ({
      month,
      totalTravelers: 200000 + Math.random() * 500000,
      avgSpending: 1000 + Math.random() * 800,
      satisfaction: 80 + Math.random() * 20,
      marketShare: 5 + Math.random() * 15
    }));
  }

  // Generate emerging destinations
  generateEmergingDestinations() {
    const destinations = [
      'Georgia', 'Albania', 'Rwanda', 'Kazakhstan', 'Bolivia',
      'Madagascar', 'Uzbekistan', 'North Macedonia', 'Sri Lanka', 'Montenegro'
    ];

    return destinations.slice(0, 6).map(destination => ({
      destination,
      growthRate: 20 + Math.random() * 50,
      avgCost: 600 + Math.random() * 800,
      riskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      investmentPotential: 40 + Math.random() * 60
    }));
  }

  // Get price analysis for specific destination
  async getPriceAnalysis(destination) {
    try {
      console.log(`💰 Generating price analysis for ${destination}...`);

      const analytics = await TravelAnalytics.findOne({ destination });
      
      if (!analytics) {
        throw new Error('Destination not found');
      }

      // Generate enhanced price analysis
      const analysis = {
        destination: analytics.destination,
        historical: analytics.priceHistory || this.generatePriceHistory(),
        predictions: analytics.predictions || this.generatePredictions(),
        optimalBooking: {
          month: analytics.analytics.optimalMonth,
          savings: Math.round(Math.abs(analytics.analytics.priceChange) * analytics.analytics.currentPrice / 100),
          reasoning: await this.generateOptimalBookingReasoning(analytics)
        },
        costBreakdown: this.generateCostBreakdown(analytics),
        competitorAnalysis: await this.generateCompetitorAnalysis(destination)
      };

      return analysis;

    } catch (error) {
      console.error('Error getting price analysis:', error);
      throw error;
    }
  }

  // Generate optimal booking reasoning
  async generateOptimalBookingReasoning(analytics) {
    const trend = analytics.analytics.trend;
    const priceChange = analytics.analytics.priceChange;
    const crowdLevel = analytics.analytics.crowdLevel;

    let reasoning = '';

    if (trend === 'down') {
      reasoning = `Prices are expected to drop by ${Math.abs(priceChange)}% over the next few months. `;
    } else if (trend === 'up') {
      reasoning = `Prices are trending upward with a ${priceChange}% increase expected. `;
    }

    reasoning += `${analytics.analytics.optimalMonth} offers the best combination of weather conditions and value. `;

    if (crowdLevel === 'low') {
      reasoning += 'Tourist crowds are significantly lower during this period, enhancing the overall experience.';
    }

    return reasoning;
  }

  // Generate cost breakdown
  generateCostBreakdown(analytics) {
    const totalCost = analytics.analytics.currentPrice;
    
    return {
      flights: Math.round(totalCost * 0.4),
      accommodation: Math.round(totalCost * 0.35),
      activities: Math.round(totalCost * 0.15),
      meals: Math.round(totalCost * 0.08),
      transportation: Math.round(totalCost * 0.02)
    };
  }

  // Generate competitor analysis
  async generateCompetitorAnalysis(destination) {
    // Mock competitor data
    return {
      averageMarketPrice: 1200 + Math.random() * 800,
      pricePosition: 'competitive', // competitive, premium, budget
      marketShare: 15 + Math.random() * 25,
      competitorCount: 5 + Math.floor(Math.random() * 10),
      differentiationFactors: [
        'Unique local experiences',
        'Flexible booking policies',
        'Comprehensive travel insurance',
        'Local expert guides'
      ]
    };
  }

  // Update analytics data
  async updateAnalyticsData() {
    try {
      console.log('🔄 Updating analytics data...');

      // Update all analytics that are older than 24 hours
      const outdatedAnalytics = await TravelAnalytics.find({
        lastUpdated: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      for (const analytics of outdatedAnalytics) {
        // Simulate price changes
        const priceVariation = (Math.random() - 0.5) * 0.1; // -5% to +5%
        const newPrice = Math.round(analytics.analytics.currentPrice * (1 + priceVariation));
        const newPredictedPrice = Math.round(analytics.analytics.predictedPrice * (1 + priceVariation * 1.2));

        analytics.analytics.currentPrice = newPrice;
        analytics.analytics.predictedPrice = newPredictedPrice;
        analytics.analytics.priceChange = ((newPredictedPrice - newPrice) / newPrice) * 100;
        analytics.lastUpdated = new Date();

        await analytics.save();
      }

      console.log(`✅ Updated ${outdatedAnalytics.length} analytics records`);

    } catch (error) {
      console.error('Error updating analytics data:', error);
      throw error;
    }
  }
}

module.exports = new PredictiveAnalyticsService();