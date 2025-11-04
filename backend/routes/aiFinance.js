const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const aiFinanceService = require('../services/aiFinanceService');
const multer = require('multer');
const path = require('path');

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/receipts/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// All routes require authentication
router.use(authMiddleware);

// Get user financial overview
router.get('/overview', async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.userId;
    
    const overview = await aiFinanceService.getFinancialOverview(userId, { month, year });
    
    res.json({
      success: true,
      data: overview,
      message: 'Financial overview retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting financial overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial overview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get expenses with filtering and pagination
router.get('/expenses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      category,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      currency,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filters = {
      category,
      dateFrom,
      dateTo,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      currency,
      sortBy,
      sortOrder
    };

    const expenses = await aiFinanceService.getExpenses(userId, filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: expenses,
      message: 'Expenses retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expenses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add expense manually
router.post('/expenses', async (req, res) => {
  try {
    const userId = req.user.userId;
    const expenseData = {
      ...req.body,
      userId,
      date: req.body.date || new Date()
    };

    // Validate required fields
    if (!expenseData.amount || !expenseData.description) {
      return res.status(400).json({
        success: false,
        message: 'Amount and description are required'
      });
    }

    const expense = await aiFinanceService.addExpense(expenseData);

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense added successfully'
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update expense
router.put('/expenses/:expenseId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;
    const updateData = req.body;

    const expense = await aiFinanceService.updateExpense(expenseId, updateData, userId);

    res.json({
      success: true,
      data: expense,
      message: 'Expense updated successfully'
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    const statusCode = error.message.includes('not found') || error.message.includes('authorized') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Delete expense
router.delete('/expenses/:expenseId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { expenseId } = req.params;

    await aiFinanceService.deleteExpense(expenseId, userId);

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting expense:', error);
    const statusCode = error.message.includes('not found') || error.message.includes('authorized') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete expense',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Process receipt with OCR
router.post('/receipts/process', upload.single('receipt'), async (req, res) => {
  try {
    const userId = req.user.userId;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Receipt image is required'
      });
    }

    const receiptPath = req.file.path;
    const { tripId, currency = 'USD' } = req.body;

    const result = await aiFinanceService.processReceipt(receiptPath, {
      userId,
      tripId,
      currency
    });

    res.json({
      success: true,
      data: result,
      message: 'Receipt processed successfully'
    });
  } catch (error) {
    console.error('Error processing receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process receipt',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get budgets
router.get('/budgets', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { tripId, active = true } = req.query;

    const budgets = await aiFinanceService.getBudgets(userId, { tripId, active: active === 'true' });

    res.json({
      success: true,
      data: budgets,
      message: 'Budgets retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get budgets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Create or update budget
router.post('/budgets', async (req, res) => {
  try {
    const userId = req.user.userId;
    const budgetData = {
      ...req.body,
      userId
    };

    // Validate required fields
    if (!budgetData.totalAmount || !budgetData.currency) {
      return res.status(400).json({
        success: false,
        message: 'Total amount and currency are required'
      });
    }

    const budget = await aiFinanceService.createBudget(budgetData);

    res.status(201).json({
      success: true,
      data: budget,
      message: 'Budget created successfully'
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Update budget
router.put('/budgets/:budgetId', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { budgetId } = req.params;
    const updateData = req.body;

    const budget = await aiFinanceService.updateBudget(budgetId, updateData, userId);

    res.json({
      success: true,
      data: budget,
      message: 'Budget updated successfully'
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    const statusCode = error.message.includes('not found') || error.message.includes('authorized') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get AI budget optimization
router.post('/budgets/optimize', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { destination, duration, totalBudget, preferences = {} } = req.body;

    if (!destination || !duration || !totalBudget) {
      return res.status(400).json({
        success: false,
        message: 'Destination, duration, and total budget are required'
      });
    }

    const optimization = await aiFinanceService.optimizeBudgetAllocation({
      userId,
      destination,
      duration,
      totalBudget,
      preferences
    });

    res.json({
      success: true,
      data: optimization,
      message: 'Budget optimization completed successfully'
    });
  } catch (error) {
    console.error('Error optimizing budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Currency conversion
router.post('/currency/convert', async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Amount, from currency, and to currency are required'
      });
    }

    const result = await aiFinanceService.convertCurrency(amount, fromCurrency, toCurrency);

    res.json({
      success: true,
      data: result,
      message: 'Currency conversion completed successfully'
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get exchange rates
router.get('/currency/rates', async (req, res) => {
  try {
    const { baseCurrency = 'USD', targetCurrencies } = req.query;
    
    const currencies = targetCurrencies ? targetCurrencies.split(',') : undefined;
    const rates = await aiFinanceService.getExchangeRates(baseCurrency, currencies);

    res.json({
      success: true,
      data: rates,
      message: 'Exchange rates retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exchange rates',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get spending analytics
router.get('/analytics/spending', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      period = 'month', 
      startDate, 
      endDate, 
      groupBy = 'category' 
    } = req.query;

    const analytics = await aiFinanceService.getSpendingAnalytics(userId, {
      period,
      startDate,
      endDate,
      groupBy
    });

    res.json({
      success: true,
      data: analytics,
      message: 'Spending analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting spending analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get spending analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get financial insights
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { period = 'month', includeRecommendations = true } = req.query;

    const insights = await aiFinanceService.generateFinancialInsights(userId, {
      period,
      includeRecommendations: includeRecommendations === 'true'
    });

    res.json({
      success: true,
      data: insights,
      message: 'Financial insights generated successfully'
    });
  } catch (error) {
    console.error('Error generating financial insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial insights',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Detect spending anomalies
router.get('/analytics/anomalies', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30, sensitivity = 'medium' } = req.query;

    const anomalies = await aiFinanceService.detectSpendingAnomalies(userId, {
      lookbackDays: parseInt(days),
      sensitivity
    });

    res.json({
      success: true,
      data: anomalies,
      message: 'Spending anomalies detected successfully'
    });
  } catch (error) {
    console.error('Error detecting spending anomalies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect spending anomalies',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get expense categories
router.get('/categories', async (req, res) => {
  try {
    const userId = req.user.userId;
    const categories = await aiFinanceService.getExpenseCategories(userId);

    res.json({
      success: true,
      data: categories,
      message: 'Expense categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting expense categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense categories',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Export spending data
router.get('/export', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { format = 'csv', startDate, endDate } = req.query;

    const exportData = await aiFinanceService.exportFinancialData(userId, {
      format,
      startDate,
      endDate
    });

    // Set appropriate headers for file download
    const filename = `travel_expenses_${new Date().toISOString().split('T')[0]}.${format}`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');

    res.send(exportData);
  } catch (error) {
    console.error('Error exporting financial data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export financial data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get expense predictions
router.post('/predictions', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { destination, duration, travelType = 'leisure' } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Destination and duration are required'
      });
    }

    const predictions = await aiFinanceService.predictExpenses(userId, {
      destination,
      duration,
      travelType
    });

    res.json({
      success: true,
      data: predictions,
      message: 'Expense predictions generated successfully'
    });
  } catch (error) {
    console.error('Error generating expense predictions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate expense predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Set up expense alerts
router.post('/alerts', async (req, res) => {
  try {
    const userId = req.user.userId;
    const alertData = {
      ...req.body,
      userId
    };

    if (!alertData.type || !alertData.threshold) {
      return res.status(400).json({
        success: false,
        message: 'Alert type and threshold are required'
      });
    }

    const alert = await aiFinanceService.createExpenseAlert(alertData);

    res.status(201).json({
      success: true,
      data: alert,
      message: 'Expense alert created successfully'
    });
  } catch (error) {
    console.error('Error creating expense alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense alert',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get user's expense alerts
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { active = true } = req.query;

    const alerts = await aiFinanceService.getExpenseAlerts(userId, {
      active: active === 'true'
    });

    res.json({
      success: true,
      data: alerts,
      message: 'Expense alerts retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting expense alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expense alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;