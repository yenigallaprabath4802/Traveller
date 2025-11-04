const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const authMiddleware = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware);

// Expense Schema
const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Transportation',
      'Accommodation', 
      'Food & Dining',
      'Activities',
      'Shopping',
      'Health & Insurance',
      'Communication',
      'Miscellaneous'
    ]
  },
  subcategory: {
    type: String
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  location: {
    type: String,
    trim: true
  },
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip'
  },
  receipt: {
    type: String // URL to receipt image
  },
  tags: [{
    type: String,
    trim: true
  }],
  aiCategorized: {
    type: Boolean,
    default: false
  },
  convertedAmount: {
    type: Number // Amount in base currency
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, tripId: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

// AI Category Prediction Service
const predictExpenseCategory = (description) => {
  const desc = description.toLowerCase();
  
  const categoryKeywords = {
    'Transportation': {
      keywords: ['flight', 'train', 'bus', 'taxi', 'uber', 'lyft', 'car', 'fuel', 'gas', 'parking', 'metro', 'subway', 'airline', 'airport'],
      subcategories: ['Flights', 'Trains', 'Buses', 'Taxis', 'Car Rental', 'Fuel', 'Parking']
    },
    'Accommodation': {
      keywords: ['hotel', 'hostel', 'airbnb', 'booking', 'resort', 'room', 'stay', 'lodge', 'inn', 'motel'],
      subcategories: ['Hotels', 'Hostels', 'Airbnb', 'Resorts', 'Camping']
    },
    'Food & Dining': {
      keywords: ['restaurant', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'cafe', 'bar', 'drink', 'pizza', 'coffee', 'snack'],
      subcategories: ['Restaurants', 'Street Food', 'Groceries', 'Bars', 'Cafes', 'Fast Food']
    },
    'Activities': {
      keywords: ['tour', 'museum', 'ticket', 'show', 'activity', 'adventure', 'visit', 'excursion', 'attraction', 'entertainment'],
      subcategories: ['Tours', 'Museums', 'Shows', 'Sports', 'Adventure', 'Sightseeing']
    },
    'Shopping': {
      keywords: ['shop', 'buy', 'purchase', 'souvenir', 'gift', 'clothing', 'market', 'store', 'mall'],
      subcategories: ['Souvenirs', 'Clothing', 'Electronics', 'Books', 'Gifts']
    },
    'Health & Insurance': {
      keywords: ['medical', 'hospital', 'pharmacy', 'insurance', 'health', 'doctor', 'clinic', 'medicine'],
      subcategories: ['Medical', 'Insurance', 'Pharmacy', 'Vaccination']
    },
    'Communication': {
      keywords: ['phone', 'internet', 'sim', 'wifi', 'data', 'roaming', 'call', 'mobile'],
      subcategories: ['Phone', 'Internet', 'SIM Cards', 'Roaming']
    }
  };

  let bestMatch = {
    category: 'Miscellaneous',
    subcategory: 'Other',
    confidence: 0
  };

  for (const [category, data] of Object.entries(categoryKeywords)) {
    let matches = 0;
    for (const keyword of data.keywords) {
      if (desc.includes(keyword)) {
        matches++;
      }
    }
    
    const confidence = matches / data.keywords.length;
    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category,
        subcategory: data.subcategories[0],
        confidence: Math.min(confidence * 2, 0.95) // Cap at 95%
      };
    }
  }

  return bestMatch;
};

// Exchange Rate Service (Mock - replace with real API)
const getExchangeRate = async (fromCurrency, toCurrency) => {
  const rates = {
    USD: 1,
    EUR: 0.92,
    INR: 83.2,
    GBP: 0.79,
    JPY: 150,
    CAD: 1.36,
    AUD: 1.52,
    CHF: 0.88,
    CNY: 7.24
  };
  
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  
  return toRate / fromRate;
};

// GET /api/expenses - Get user expenses with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount, 
      tripId,
      tags,
      limit = 50,
      offset = 0,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const filter = { userId: req.user.id };

    // Apply filters
    if (category && category !== 'all') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.convertedAmount = {};
      if (minAmount) filter.convertedAmount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.convertedAmount.$lte = parseFloat(maxAmount);
    }

    if (tripId) {
      filter.tripId = tripId;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagArray };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(filter)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('tripId', 'title destination');

    const total = await Expense.countDocuments(filter);

    // Calculate summary statistics
    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$convertedAmount' },
          totalExpenses: { $sum: 1 },
          avgAmount: { $avg: '$convertedAmount' },
          categoryBreakdown: {
            $push: {
              category: '$category',
              amount: '$convertedAmount'
            }
          }
        }
      }
    ]);

    res.json({
      expenses,
      total,
      summary: summary[0] || {
        totalAmount: 0,
        totalExpenses: 0,
        avgAmount: 0,
        categoryBreakdown: []
      },
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch expenses',
      details: error.message 
    });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      category,
      subcategory,
      description,
      date,
      location,
      tripId,
      receipt,
      tags = [],
      notes,
      baseCurrency = 'USD'
    } = req.body;

    // Validate required fields
    if (!amount || !description) {
      return res.status(400).json({
        error: 'Amount and description are required'
      });
    }

    // AI category prediction if not provided
    let finalCategory = category;
    let finalSubcategory = subcategory;
    let aiCategorized = false;

    if (!category) {
      const prediction = predictExpenseCategory(description);
      finalCategory = prediction.category;
      finalSubcategory = prediction.subcategory;
      aiCategorized = true;
    }

    // Get exchange rate and convert amount
    const exchangeRate = await getExchangeRate(currency, baseCurrency);
    const convertedAmount = amount * exchangeRate;

    const expense = new Expense({
      userId: req.user.id,
      amount: parseFloat(amount),
      currency,
      category: finalCategory,
      subcategory: finalSubcategory,
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      location: location?.trim(),
      tripId: tripId || null,
      receipt,
      tags: tags.filter(tag => tag.trim()),
      notes: notes?.trim(),
      aiCategorized,
      convertedAmount,
      exchangeRate
    });

    await expense.save();

    // Populate trip info if available
    await expense.populate('tripId', 'title destination');

    res.status(201).json({
      expense,
      message: aiCategorized 
        ? `Expense added and categorized as ${finalCategory}` 
        : 'Expense added successfully'
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ 
      error: 'Failed to create expense',
      details: error.message 
    });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates._id;

    // Recalculate converted amount if amount or currency changed
    if (updates.amount || updates.currency) {
      const expense = await Expense.findById(id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      const currency = updates.currency || expense.currency;
      const amount = updates.amount || expense.amount;
      const baseCurrency = 'USD'; // Default base currency

      const exchangeRate = await getExchangeRate(currency, baseCurrency);
      updates.convertedAmount = amount * exchangeRate;
      updates.exchangeRate = exchangeRate;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updates },
      { new: true }
    ).populate('tripId', 'title destination');

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({
      expense,
      message: 'Expense updated successfully'
    });

  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ 
      error: 'Failed to update expense',
      details: error.message 
    });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });

  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ 
      error: 'Failed to delete expense',
      details: error.message 
    });
  }
});

// GET /api/expenses/analytics - Get expense analytics
router.get('/analytics', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      tripId,
      groupBy = 'category' // category, date, month
    } = req.query;

    const filter = { userId: req.user.id };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (tripId) {
      filter.tripId = tripId;
    }

    let groupField;
    switch (groupBy) {
      case 'date':
        groupField = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
        break;
      case 'month':
        groupField = { $dateToString: { format: "%Y-%m", date: "$date" } };
        break;
      case 'category':
      default:
        groupField = '$category';
        break;
    }

    const analytics = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupField,
          totalAmount: { $sum: '$convertedAmount' },
          totalExpenses: { $sum: 1 },
          avgAmount: { $avg: '$convertedAmount' },
          expenses: { $push: '$$ROOT' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate overall totals
    const overallTotal = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$convertedAmount' },
          totalExpenses: { $sum: 1 },
          avgAmount: { $avg: '$convertedAmount' }
        }
      }
    ]);

    res.json({
      analytics,
      total: overallTotal[0] || {
        totalAmount: 0,
        totalExpenses: 0,
        avgAmount: 0
      }
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ 
      error: 'Failed to generate analytics',
      details: error.message 
    });
  }
});

// POST /api/expenses/bulk - Bulk import expenses
router.post('/bulk', async (req, res) => {
  try {
    const { expenses } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({
        error: 'Expenses array is required and must not be empty'
      });
    }

    const processedExpenses = [];
    const errors = [];

    for (let i = 0; i < expenses.length; i++) {
      try {
        const expenseData = expenses[i];
        
        // Apply AI categorization if needed
        if (!expenseData.category) {
          const prediction = predictExpenseCategory(expenseData.description);
          expenseData.category = prediction.category;
          expenseData.subcategory = prediction.subcategory;
          expenseData.aiCategorized = true;
        }

        // Convert currency
        const exchangeRate = await getExchangeRate(expenseData.currency || 'USD', 'USD');
        expenseData.convertedAmount = expenseData.amount * exchangeRate;
        expenseData.exchangeRate = exchangeRate;
        expenseData.userId = req.user.id;

        const expense = new Expense(expenseData);
        await expense.save();
        processedExpenses.push(expense);

      } catch (error) {
        errors.push({
          index: i,
          expense: expenses[i],
          error: error.message
        });
      }
    }

    res.json({
      message: `Processed ${processedExpenses.length} expenses successfully`,
      successful: processedExpenses.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error bulk importing expenses:', error);
    res.status(500).json({ 
      error: 'Failed to import expenses',
      details: error.message 
    });
  }
});

// GET /api/expenses/export - Export expenses to CSV
router.get('/export', async (req, res) => {
  try {
    const filter = { userId: req.user.id };
    
    // Apply same filters as GET /
    const { category, startDate, endDate, tripId } = req.query;
    
    if (category && category !== 'all') filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (tripId) filter.tripId = tripId;

    const expenses = await Expense.find(filter)
      .sort({ date: -1 })
      .populate('tripId', 'title');

    // Generate CSV
    const csvHeaders = [
      'Date',
      'Description', 
      'Amount',
      'Currency',
      'Converted Amount (USD)',
      'Category',
      'Subcategory',
      'Location',
      'Trip',
      'Tags',
      'AI Categorized',
      'Notes'
    ];

    const csvRows = expenses.map(expense => [
      expense.date.toISOString().split('T')[0],
      `"${expense.description}"`,
      expense.amount,
      expense.currency,
      expense.convertedAmount?.toFixed(2) || '',
      expense.category,
      expense.subcategory || '',
      `"${expense.location || ''}"`,
      expense.tripId?.title || '',
      `"${expense.tags.join(', ')}"`,
      expense.aiCategorized ? 'Yes' : 'No',
      `"${expense.notes || ''}"`
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="expenses-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Error exporting expenses:', error);
    res.status(500).json({ 
      error: 'Failed to export expenses',
      details: error.message 
    });
  }
});

module.exports = router;