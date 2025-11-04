const { OpenAI } = require('openai');
const mongoose = require('mongoose');
const axios = require('axios');

class AIFinanceService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize schemas
    this.initializeSchemas();
    
    // Cache for exchange rates and financial insights
    this.exchangeRateCache = new Map();
    this.financeCache = new Map();
    
    // Initialize exchange rate service
    this.exchangeApiKey = process.env.EXCHANGE_API_KEY || 'demo-key';
    this.exchangeApiUrl = 'https://api.exchangerate-api.com/v4/latest/';
  }

  initializeSchemas() {
    // Travel Budget Schema
    const travelBudgetSchema = new mongoose.Schema({
      userId: { type: String, required: true },
      tripId: { type: String, required: true },
      totalBudget: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      categories: {
        accommodation: { allocated: Number, spent: { type: Number, default: 0 } },
        transportation: { allocated: Number, spent: { type: Number, default: 0 } },
        food: { allocated: Number, spent: { type: Number, default: 0 } },
        activities: { allocated: Number, spent: { type: Number, default: 0 } },
        shopping: { allocated: Number, spent: { type: Number, default: 0 } },
        emergency: { allocated: Number, spent: { type: Number, default: 0 } },
        other: { allocated: Number, spent: { type: Number, default: 0 } }
      },
      aiRecommendations: {
        budgetOptimization: [String],
        savingTips: [String],
        spendingWarnings: [String],
        lastUpdated: { type: Date, default: Date.now }
      },
      alerts: [{
        type: { type: String, enum: ['warning', 'danger', 'info'] },
        category: String,
        message: String,
        threshold: Number,
        triggered: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
      }],
      settings: {
        autoAlerts: { type: Boolean, default: true },
        spendingThreshold: { type: Number, default: 0.8 }, // 80% threshold
        dailyLimit: Number,
        weeklyLimit: Number
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Expense Entry Schema
    const expenseSchema = new mongoose.Schema({
      userId: { type: String, required: true },
      tripId: String,
      budgetId: String,
      amount: { type: Number, required: true },
      currency: { type: String, default: 'USD' },
      exchangeRate: Number,
      convertedAmount: Number, // Amount in base currency
      category: { 
        type: String, 
        enum: ['accommodation', 'transportation', 'food', 'activities', 'shopping', 'emergency', 'other'],
        required: true 
      },
      subcategory: String,
      description: { type: String, required: true },
      merchant: String,
      location: {
        name: String,
        city: String,
        country: String,
        coordinates: {
          lat: Number,
          lng: Number
        }
      },
      paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'digital_wallet', 'bank_transfer', 'other']
      },
      receipt: {
        imageUrl: String,
        ocrText: String,
        processed: { type: Boolean, default: false }
      },
      aiAnalysis: {
        categoryConfidence: Number,
        suggestedCategory: String,
        merchantAnalysis: String,
        spendingPattern: String,
        anomalyScore: Number, // 0-1, higher means more unusual
        tags: [String]
      },
      metadata: {
        isRecurring: { type: Boolean, default: false },
        isPlanned: { type: Boolean, default: false },
        isRefundable: { type: Boolean, default: false },
        notes: String
      },
      date: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });

    // Financial Insight Schema
    const financialInsightSchema = new mongoose.Schema({
      userId: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['spending_pattern', 'budget_prediction', 'savings_opportunity', 'expense_optimization'],
        required: true 
      },
      title: String,
      description: String,
      insight: String,
      confidence: { type: Number, min: 0, max: 1 },
      actionable: { type: Boolean, default: true },
      priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      category: String,
      data: mongoose.Schema.Types.Mixed, // Flexible data structure
      recommendations: [String],
      potentialSavings: Number,
      timeframe: String,
      status: { type: String, enum: ['active', 'implemented', 'dismissed'], default: 'active' },
      createdAt: { type: Date, default: Date.now },
      expiresAt: Date
    });

    // Currency Exchange Rate Schema
    const exchangeRateSchema = new mongoose.Schema({
      baseCurrency: { type: String, required: true },
      targetCurrency: { type: String, required: true },
      rate: { type: Number, required: true },
      provider: String,
      timestamp: { type: Date, default: Date.now },
      validUntil: Date
    });

    // Create models safely (check if already exists)
    this.TravelBudget = mongoose.models.TravelBudget || mongoose.model('TravelBudget', travelBudgetSchema);
    this.Expense = mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
    this.FinancialInsight = mongoose.models.FinancialInsight || mongoose.model('FinancialInsight', financialInsightSchema);
    this.ExchangeRate = mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', exchangeRateSchema);
  }

  // Budget Management
  async createBudget(userId, budgetData) {
    try {
      console.log(`💰 Creating budget for user: ${userId}`);

      // AI-powered budget allocation optimization
      const optimizedAllocation = await this.optimizeBudgetAllocation(budgetData);
      
      const budget = new this.TravelBudget({
        userId,
        tripId: budgetData.tripId,
        totalBudget: budgetData.totalBudget,
        currency: budgetData.currency || 'USD',
        categories: optimizedAllocation,
        settings: {
          autoAlerts: budgetData.autoAlerts !== false,
          spendingThreshold: budgetData.spendingThreshold || 0.8,
          dailyLimit: budgetData.dailyLimit,
          weeklyLimit: budgetData.weeklyLimit
        }
      });

      // Generate AI recommendations
      budget.aiRecommendations = await this.generateBudgetRecommendations(budgetData);
      
      await budget.save();

      // Create initial financial insights
      await this.generateFinancialInsights(userId, 'budget_prediction');

      return budget;

    } catch (error) {
      console.error('Error creating budget:', error);
      throw new Error('Failed to create budget: ' + error.message);
    }
  }

  async optimizeBudgetAllocation(budgetData) {
    try {
      const destination = budgetData.destination || '';
      const duration = budgetData.duration || 7;
      const travelStyle = budgetData.travelStyle || 'moderate';
      const travelers = budgetData.travelers || 1;

      // AI-powered budget allocation based on destination and travel style
      const prompt = `
        As a travel finance expert, optimize budget allocation for:
        - Destination: ${destination}
        - Duration: ${duration} days
        - Travel Style: ${travelStyle}
        - Travelers: ${travelers}
        - Total Budget: $${budgetData.totalBudget}

        Provide optimal percentage allocation for:
        accommodation, transportation, food, activities, shopping, emergency, other

        Return JSON format: {"accommodation": 35, "transportation": 25, ...}
        Consider local costs, typical expenses, and travel style preferences.
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a travel finance optimization expert. Provide precise budget allocations based on destination characteristics and travel preferences."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const allocationText = response.choices[0].message.content;
      const allocationMatch = allocationText.match(/\{[\s\S]*\}/);
      
      if (allocationMatch) {
        const percentages = JSON.parse(allocationMatch[0]);
        
        // Convert percentages to actual amounts
        const allocation = {};
        Object.keys(percentages).forEach(category => {
          allocation[category] = {
            allocated: Math.round((budgetData.totalBudget * percentages[category]) / 100),
            spent: 0
          };
        });

        return allocation;
      } else {
        // Fallback default allocation
        return this.getDefaultBudgetAllocation(budgetData.totalBudget);
      }

    } catch (error) {
      console.error('Error optimizing budget allocation:', error);
      return this.getDefaultBudgetAllocation(budgetData.totalBudget);
    }
  }

  getDefaultBudgetAllocation(totalBudget) {
    const defaultPercentages = {
      accommodation: 35,
      transportation: 25,
      food: 20,
      activities: 15,
      shopping: 3,
      emergency: 2
    };

    const allocation = {};
    Object.keys(defaultPercentages).forEach(category => {
      allocation[category] = {
        allocated: Math.round((totalBudget * defaultPercentages[category]) / 100),
        spent: 0
      };
    });

    return allocation;
  }

  async generateBudgetRecommendations(budgetData) {
    try {
      const prompt = `
        Generate smart travel finance recommendations for:
        - Destination: ${budgetData.destination}
        - Budget: $${budgetData.totalBudget}
        - Duration: ${budgetData.duration} days
        - Style: ${budgetData.travelStyle}

        Provide 3 categories:
        1. Budget Optimization (3 tips)
        2. Saving Tips (3 tips)  
        3. Spending Warnings (2 warnings)

        Return as JSON: {
          "budgetOptimization": ["tip1", "tip2", "tip3"],
          "savingTips": ["tip1", "tip2", "tip3"],
          "spendingWarnings": ["warning1", "warning2"]
        }
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a travel finance advisor providing actionable, destination-specific money management advice."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800
      });

      const recommendationsText = response.choices[0].message.content;
      const recommendationsMatch = recommendationsText.match(/\{[\s\S]*\}/);
      
      if (recommendationsMatch) {
        return JSON.parse(recommendationsMatch[0]);
      } else {
        return this.getDefaultRecommendations();
      }

    } catch (error) {
      console.error('Error generating budget recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  getDefaultRecommendations() {
    return {
      budgetOptimization: [
        "Book accommodations in advance for better rates",
        "Use public transportation when possible",
        "Eat at local restaurants instead of tourist areas"
      ],
      savingTips: [
        "Look for free walking tours and activities",
        "Use travel reward credit cards for purchases",
        "Cook some meals if accommodation allows"
      ],
      spendingWarnings: [
        "Avoid exchanging money at airports - poor rates",
        "Be cautious of hidden fees in tourist areas"
      ]
    };
  }

  // Expense Management
  async addExpense(userId, expenseData) {
    try {
      console.log(`💳 Adding expense for user: ${userId}`);

      // Get current exchange rate if needed
      let exchangeRate = 1;
      let convertedAmount = expenseData.amount;

      if (expenseData.currency && expenseData.currency !== 'USD') {
        exchangeRate = await this.getExchangeRate(expenseData.currency, 'USD');
        convertedAmount = expenseData.amount * exchangeRate;
      }

      // AI-powered expense analysis
      const aiAnalysis = await this.analyzeExpense(expenseData);

      const expense = new this.Expense({
        userId,
        tripId: expenseData.tripId,
        budgetId: expenseData.budgetId,
        amount: expenseData.amount,
        currency: expenseData.currency || 'USD',
        exchangeRate,
        convertedAmount,
        category: expenseData.category,
        subcategory: expenseData.subcategory,
        description: expenseData.description,
        merchant: expenseData.merchant,
        location: expenseData.location,
        paymentMethod: expenseData.paymentMethod || 'card',
        receipt: expenseData.receipt,
        aiAnalysis,
        metadata: expenseData.metadata || {},
        date: expenseData.date || new Date()
      });

      await expense.save();

      // Update budget if provided
      if (expenseData.budgetId) {
        await this.updateBudgetSpending(expenseData.budgetId, expense.category, convertedAmount);
      }

      // Check for spending alerts
      await this.checkSpendingAlerts(userId, expenseData.budgetId, expense);

      // Generate new insights based on spending pattern
      await this.generateFinancialInsights(userId, 'spending_pattern');

      return expense;

    } catch (error) {
      console.error('Error adding expense:', error);
      throw new Error('Failed to add expense: ' + error.message);
    }
  }

  async analyzeExpense(expenseData) {
    try {
      const prompt = `
        Analyze this travel expense:
        - Amount: ${expenseData.amount} ${expenseData.currency || 'USD'}
        - Category: ${expenseData.category}
        - Description: ${expenseData.description}
        - Merchant: ${expenseData.merchant || 'Unknown'}
        - Location: ${expenseData.location?.city || 'Unknown'}

        Provide analysis in JSON format:
        {
          "categoryConfidence": 0.95,
          "suggestedCategory": "food",
          "merchantAnalysis": "Restaurant chain known for...",
          "spendingPattern": "typical/high/low for location",
          "anomalyScore": 0.2,
          "tags": ["dining", "local_cuisine"]
        }

        Anomaly score: 0-1 (0=normal, 1=very unusual)
      `;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a financial analyst specializing in travel expense categorization and pattern recognition."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 400
      });

      const analysisText = response.choices[0].message.content;
      const analysisMatch = analysisText.match(/\{[\s\S]*\}/);
      
      if (analysisMatch) {
        return JSON.parse(analysisMatch[0]);
      } else {
        return this.getDefaultExpenseAnalysis(expenseData);
      }

    } catch (error) {
      console.error('Error analyzing expense:', error);
      return this.getDefaultExpenseAnalysis(expenseData);
    }
  }

  getDefaultExpenseAnalysis(expenseData) {
    return {
      categoryConfidence: 0.8,
      suggestedCategory: expenseData.category,
      merchantAnalysis: "General expense analysis",
      spendingPattern: "typical",
      anomalyScore: 0.1,
      tags: [expenseData.category]
    };
  }

  async updateBudgetSpending(budgetId, category, amount) {
    try {
      const budget = await this.TravelBudget.findById(budgetId);
      if (!budget) return;

      if (budget.categories[category]) {
        budget.categories[category].spent += amount;
        budget.updatedAt = new Date();
        await budget.save();
      }

    } catch (error) {
      console.error('Error updating budget spending:', error);
    }
  }

  async checkSpendingAlerts(userId, budgetId, expense) {
    try {
      if (!budgetId) return;

      const budget = await this.TravelBudget.findById(budgetId);
      if (!budget || !budget.settings.autoAlerts) return;

      const category = expense.category;
      const categoryBudget = budget.categories[category];
      
      if (!categoryBudget) return;

      const spentPercentage = categoryBudget.spent / categoryBudget.allocated;
      const threshold = budget.settings.spendingThreshold;

      // Check if we need to create an alert
      if (spentPercentage >= threshold && spentPercentage < 1.0) {
        const existingAlert = budget.alerts.find(
          alert => alert.category === category && alert.type === 'warning' && !alert.triggered
        );

        if (!existingAlert) {
          budget.alerts.push({
            type: 'warning',
            category,
            message: `You've spent ${Math.round(spentPercentage * 100)}% of your ${category} budget`,
            threshold: spentPercentage,
            triggered: true
          });
          await budget.save();
        }
      } else if (spentPercentage >= 1.0) {
        const existingAlert = budget.alerts.find(
          alert => alert.category === category && alert.type === 'danger' && !alert.triggered
        );

        if (!existingAlert) {
          budget.alerts.push({
            type: 'danger',
            category,
            message: `You've exceeded your ${category} budget by ${Math.round((spentPercentage - 1) * 100)}%`,
            threshold: spentPercentage,
            triggered: true
          });
          await budget.save();
        }
      }

    } catch (error) {
      console.error('Error checking spending alerts:', error);
    }
  }

  // Currency Exchange
  async getExchangeRate(fromCurrency, toCurrency) {
    try {
      const cacheKey = `${fromCurrency}_${toCurrency}`;
      const cached = this.exchangeRateCache.get(cacheKey);

      if (cached && cached.timestamp > Date.now() - 3600000) { // 1 hour cache
        return cached.rate;
      }

      // Try to get from database first
      const dbRate = await this.ExchangeRate.findOne({
        baseCurrency: fromCurrency,
        targetCurrency: toCurrency,
        validUntil: { $gt: new Date() }
      }).sort({ timestamp: -1 });

      if (dbRate) {
        this.exchangeRateCache.set(cacheKey, {
          rate: dbRate.rate,
          timestamp: Date.now()
        });
        return dbRate.rate;
      }

      // Fetch from API
      const response = await axios.get(`${this.exchangeApiUrl}${fromCurrency}`);
      const rate = response.data.rates[toCurrency];

      if (rate) {
        // Cache in memory
        this.exchangeRateCache.set(cacheKey, {
          rate,
          timestamp: Date.now()
        });

        // Save to database
        const exchangeRate = new this.ExchangeRate({
          baseCurrency: fromCurrency,
          targetCurrency: toCurrency,
          rate,
          provider: 'exchangerate-api',
          validUntil: new Date(Date.now() + 3600000) // 1 hour validity
        });
        await exchangeRate.save();

        return rate;
      }

      throw new Error('Exchange rate not found');

    } catch (error) {
      console.error('Error getting exchange rate:', error);
      return 1; // Fallback rate
    }
  }

  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      if (fromCurrency === toCurrency) {
        return { convertedAmount: amount, rate: 1 };
      }

      const rate = await this.getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;

      return {
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error converting currency:', error);
      throw new Error('Failed to convert currency: ' + error.message);
    }
  }

  // Financial Insights and Analytics
  async generateFinancialInsights(userId, type = 'all') {
    try {
      console.log(`📊 Generating financial insights for user: ${userId}, type: ${type}`);

      const expenses = await this.Expense.find({ userId }).sort({ date: -1 }).limit(100);
      const budgets = await this.TravelBudget.find({ userId }).sort({ createdAt: -1 }).limit(10);

      const insights = [];

      if (type === 'all' || type === 'spending_pattern') {
        const spendingInsights = await this.analyzeSpendingPatterns(userId, expenses);
        insights.push(...spendingInsights);
      }

      if (type === 'all' || type === 'budget_prediction') {
        const budgetInsights = await this.analyzeBudgetPredictions(userId, budgets, expenses);
        insights.push(...budgetInsights);
      }

      if (type === 'all' || type === 'savings_opportunity') {
        const savingsInsights = await this.identifySavingsOpportunities(userId, expenses);
        insights.push(...savingsInsights);
      }

      if (type === 'all' || type === 'expense_optimization') {
        const optimizationInsights = await this.analyzeExpenseOptimization(userId, expenses);
        insights.push(...optimizationInsights);
      }

      // Save insights to database
      for (const insight of insights) {
        const existingInsight = await this.FinancialInsight.findOne({
          userId,
          type: insight.type,
          title: insight.title,
          status: 'active'
        });

        if (!existingInsight) {
          const newInsight = new this.FinancialInsight({
            userId,
            ...insight,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          });
          await newInsight.save();
        }
      }

      return insights;

    } catch (error) {
      console.error('Error generating financial insights:', error);
      throw new Error('Failed to generate insights: ' + error.message);
    }
  }

  async analyzeSpendingPatterns(userId, expenses) {
    try {
      if (expenses.length < 5) return [];

      const categorySpending = {};
      const totalSpent = expenses.reduce((sum, exp) => {
        const category = exp.category;
        categorySpending[category] = (categorySpending[category] || 0) + exp.convertedAmount;
        return sum + exp.convertedAmount;
      }, 0);

      const insights = [];

      // Find dominant spending category
      const dominantCategory = Object.keys(categorySpending).reduce((a, b) => 
        categorySpending[a] > categorySpending[b] ? a : b
      );

      const dominantPercentage = Math.round((categorySpending[dominantCategory] / totalSpent) * 100);

      if (dominantPercentage > 40) {
        insights.push({
          type: 'spending_pattern',
          title: 'High Category Concentration',
          description: `${dominantPercentage}% of your spending is on ${dominantCategory}`,
          insight: `You're spending heavily on ${dominantCategory}. Consider if this aligns with your travel priorities.`,
          confidence: 0.8,
          priority: dominantPercentage > 60 ? 'high' : 'medium',
          category: dominantCategory,
          recommendations: [
            `Review your ${dominantCategory} expenses for optimization opportunities`,
            `Consider setting a stricter budget for ${dominantCategory}`,
            `Look for alternative options in the ${dominantCategory} category`
          ]
        });
      }

      // Analyze spending frequency
      const recentExpenses = expenses.filter(exp => 
        new Date(exp.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      if (recentExpenses.length > 15) {
        insights.push({
          type: 'spending_pattern',
          title: 'High Spending Frequency',
          description: `${recentExpenses.length} transactions in the last 7 days`,
          insight: 'You have a high transaction frequency. Consider consolidating purchases to better track spending.',
          confidence: 0.7,
          priority: 'medium',
          recommendations: [
            'Plan daily expenses in advance',
            'Use cash for small purchases to limit frequency',
            'Set daily spending limits'
          ]
        });
      }

      return insights;

    } catch (error) {
      console.error('Error analyzing spending patterns:', error);
      return [];
    }
  }

  async analyzeBudgetPredictions(userId, budgets, expenses) {
    try {
      if (budgets.length === 0) return [];

      const insights = [];
      const currentBudget = budgets[0];

      if (!currentBudget) return [];

      // Calculate burn rate
      const recentExpenses = expenses.filter(exp => exp.budgetId === currentBudget._id.toString());
      const totalSpent = recentExpenses.reduce((sum, exp) => sum + exp.convertedAmount, 0);
      const daysElapsed = Math.max(1, Math.ceil((new Date() - new Date(currentBudget.createdAt)) / (1000 * 60 * 60 * 24)));
      const dailyBurnRate = totalSpent / daysElapsed;

      // Predict if budget will be exceeded
      const estimatedTripDays = 14; // Default assumption
      const projectedSpending = dailyBurnRate * estimatedTripDays;
      
      if (projectedSpending > currentBudget.totalBudget * 1.1) {
        insights.push({
          type: 'budget_prediction',
          title: 'Budget Overrun Risk',
          description: `Current spending pace may exceed budget by ${Math.round(((projectedSpending / currentBudget.totalBudget) - 1) * 100)}%`,
          insight: `At your current spending rate of $${Math.round(dailyBurnRate)}/day, you may exceed your budget.`,
          confidence: 0.7,
          priority: 'high',
          potentialSavings: projectedSpending - currentBudget.totalBudget,
          recommendations: [
            'Reduce daily spending by 20%',
            'Focus on free activities for remaining days',
            'Consider adjusting accommodation to save costs'
          ]
        });
      }

      return insights;

    } catch (error) {
      console.error('Error analyzing budget predictions:', error);
      return [];
    }
  }

  async identifySavingsOpportunities(userId, expenses) {
    try {
      const insights = [];

      // Analyze for expensive categories
      const categoryAverages = {};
      expenses.forEach(exp => {
        const category = exp.category;
        if (!categoryAverages[category]) {
          categoryAverages[category] = { total: 0, count: 0 };
        }
        categoryAverages[category].total += exp.convertedAmount;
        categoryAverages[category].count += 1;
      });

      Object.keys(categoryAverages).forEach(category => {
        const avg = categoryAverages[category].total / categoryAverages[category].count;
        
        if (avg > 50 && category !== 'accommodation') { // Focus on high-value categories
          insights.push({
            type: 'savings_opportunity',
            title: `${category.charAt(0).toUpperCase() + category.slice(1)} Optimization`,
            description: `Average ${category} expense: $${Math.round(avg)}`,
            insight: `Your ${category} expenses are relatively high. Look for cost-effective alternatives.`,
            confidence: 0.6,
            priority: 'medium',
            category,
            potentialSavings: avg * 0.3, // Estimate 30% savings potential
            recommendations: [
              `Research budget-friendly ${category} options`,
              `Look for local alternatives to tourist-oriented ${category} services`,
              `Consider group discounts or package deals for ${category}`
            ]
          });
        }
      });

      return insights;

    } catch (error) {
      console.error('Error identifying savings opportunities:', error);
      return [];
    }
  }

  async analyzeExpenseOptimization(userId, expenses) {
    try {
      const insights = [];

      // Check for duplicate or similar expenses
      const merchantSpending = {};
      expenses.forEach(exp => {
        if (exp.merchant) {
          merchantSpending[exp.merchant] = (merchantSpending[exp.merchant] || 0) + exp.convertedAmount;
        }
      });

      Object.keys(merchantSpending).forEach(merchant => {
        const spent = merchantSpending[merchant];
        const frequency = expenses.filter(exp => exp.merchant === merchant).length;
        
        if (frequency > 3 && spent > 100) {
          insights.push({
            type: 'expense_optimization',
            title: 'Frequent Merchant Usage',
            description: `${frequency} transactions at ${merchant} totaling $${Math.round(spent)}`,
            insight: `You're frequently spending at ${merchant}. Look for loyalty programs or bulk discounts.`,
            confidence: 0.8,
            priority: 'low',
            potentialSavings: spent * 0.1, // 10% potential savings
            recommendations: [
              `Check for loyalty programs at ${merchant}`,
              'Consider bulk purchases for better rates',
              'Look for competitor pricing'
            ]
          });
        }
      });

      return insights;

    } catch (error) {
      console.error('Error analyzing expense optimization:', error);
      return [];
    }
  }

  // Receipt Processing with OCR
  async processReceipt(userId, imageBuffer) {
    try {
      console.log(`📷 Processing receipt for user: ${userId}`);

      // Use OpenAI Vision API to extract receipt information
      const base64Image = imageBuffer.toString('base64');
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract expense information from this receipt. Return JSON format:
                {
                  "merchant": "merchant name",
                  "amount": 123.45,
                  "currency": "USD",
                  "date": "2024-01-15",
                  "category": "food/transportation/accommodation/activities/shopping/other",
                  "items": ["item1", "item2"],
                  "address": "merchant address",
                  "confidence": 0.95
                }
                
                If information is unclear, set confidence lower.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      const extractedText = response.choices[0].message.content;
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const receiptData = JSON.parse(jsonMatch[0]);
        
        return {
          success: true,
          data: receiptData,
          ocrText: extractedText
        };
      } else {
        throw new Error('Failed to extract structured data from receipt');
      }

    } catch (error) {
      console.error('Error processing receipt:', error);
      return {
        success: false,
        error: error.message,
        ocrText: 'Failed to process receipt'
      };
    }
  }

  // Analytics and Reporting
  async getSpendingAnalytics(userId, filters = {}) {
    try {
      console.log(`📊 Getting spending analytics for user: ${userId}`);

      const matchStage = { userId };
      
      if (filters.tripId) matchStage.tripId = filters.tripId;
      if (filters.category) matchStage.category = filters.category;
      if (filters.startDate || filters.endDate) {
        matchStage.date = {};
        if (filters.startDate) matchStage.date.$gte = new Date(filters.startDate);
        if (filters.endDate) matchStage.date.$lte = new Date(filters.endDate);
      }

      const analytics = await this.Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: '$convertedAmount' },
            transactionCount: { $sum: 1 },
            avgTransaction: { $avg: '$convertedAmount' },
            categoryBreakdown: {
              $push: {
                category: '$category',
                amount: '$convertedAmount'
              }
            },
            currencyUsage: {
              $push: {
                currency: '$currency',
                amount: '$amount'
              }
            }
          }
        }
      ]);

      // Category breakdown
      const categoryBreakdown = {};
      const currencyBreakdown = {};

      if (analytics.length > 0) {
        analytics[0].categoryBreakdown.forEach(item => {
          categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.amount;
        });

        analytics[0].currencyUsage.forEach(item => {
          currencyBreakdown[item.currency] = (currencyBreakdown[item.currency] || 0) + item.amount;
        });
      }

      const result = analytics.length > 0 ? analytics[0] : {
        totalSpent: 0,
        transactionCount: 0,
        avgTransaction: 0
      };

      return {
        ...result,
        categoryBreakdown,
        currencyBreakdown,
        trends: await this.getSpendingTrends(userId, filters),
        insights: await this.getQuickInsights(userId)
      };

    } catch (error) {
      console.error('Error getting spending analytics:', error);
      throw new Error('Failed to get analytics: ' + error.message);
    }
  }

  async getSpendingTrends(userId, filters = {}) {
    try {
      const matchStage = { userId };
      if (filters.tripId) matchStage.tripId = filters.tripId;

      const trends = await this.Expense.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' }
            },
            dailySpent: { $sum: '$convertedAmount' },
            transactionCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
        { $limit: 30 } // Last 30 days
      ]);

      return trends.map(trend => ({
        date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
        amount: trend.dailySpent,
        transactions: trend.transactionCount
      }));

    } catch (error) {
      console.error('Error getting spending trends:', error);
      return [];
    }
  }

  async getQuickInsights(userId) {
    try {
      const insights = await this.FinancialInsight.find({
        userId,
        status: 'active',
        expiresAt: { $gt: new Date() }
      }).sort({ priority: 1, createdAt: -1 }).limit(5);

      return insights.map(insight => ({
        type: insight.type,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        recommendations: insight.recommendations.slice(0, 2) // Top 2 recommendations
      }));

    } catch (error) {
      console.error('Error getting quick insights:', error);
      return [];
    }
  }

  // Utility Methods
  getCacheStats() {
    return {
      exchange_rate_cache_size: this.exchangeRateCache.size,
      finance_cache_size: this.financeCache.size,
      memory_usage: process.memoryUsage()
    };
  }

  clearCache() {
    this.exchangeRateCache.clear();
    this.financeCache.clear();
    return { success: true, message: 'AI Finance cache cleared' };
  }
}

module.exports = new AIFinanceService();