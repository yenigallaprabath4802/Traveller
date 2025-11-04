import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Download,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  PieChart,
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Receipt,
  Tag,
  MapPin,
  X
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie
} from 'recharts';
import Button from './Button';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  subcategory?: string;
  description: string;
  date: string;
  location?: string;
  tripId?: string;
  receipt?: string;
  tags: string[];
  aiCategorized: boolean;
  convertedAmount?: number; // Amount in base currency
}

interface ExpenseCategory {
  name: string;
  color: string;
  icon: string;
  subcategories: string[];
}

const AdvancedExpenseTracker: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [viewMode, setViewMode] = useState('overview');
  const [filters, setFilters] = useState({
    category: 'all',
    dateRange: 'all',
    minAmount: '',
    maxAmount: ''
  });

  const categories: ExpenseCategory[] = [
    {
      name: 'Transportation',
      color: '#3B82F6',
      icon: '🚗',
      subcategories: ['Flights', 'Trains', 'Buses', 'Taxis', 'Car Rental', 'Fuel', 'Parking']
    },
    {
      name: 'Accommodation',
      color: '#10B981',
      icon: '🏨',
      subcategories: ['Hotels', 'Hostels', 'Airbnb', 'Resorts', 'Camping']
    },
    {
      name: 'Food & Dining',
      color: '#F59E0B',
      icon: '🍽️',
      subcategories: ['Restaurants', 'Street Food', 'Groceries', 'Bars', 'Cafes', 'Fast Food']
    },
    {
      name: 'Activities',
      color: '#EF4444',
      icon: '🎯',
      subcategories: ['Tours', 'Museums', 'Shows', 'Sports', 'Adventure', 'Sightseeing']
    },
    {
      name: 'Shopping',
      color: '#8B5CF6',
      icon: '🛍️',
      subcategories: ['Souvenirs', 'Clothing', 'Electronics', 'Books', 'Gifts']
    },
    {
      name: 'Health & Insurance',
      color: '#06B6D4',
      icon: '💊',
      subcategories: ['Medical', 'Insurance', 'Pharmacy', 'Vaccination']
    },
    {
      name: 'Communication',
      color: '#84CC16',
      icon: '📱',
      subcategories: ['Phone', 'Internet', 'SIM Cards', 'Roaming']
    },
    {
      name: 'Miscellaneous',
      color: '#6B7280',
      icon: '📦',
      subcategories: ['Visa', 'Tips', 'Laundry', 'Currency Exchange', 'Other']
    }
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
  ];

  // Mock exchange rates - replace with real API
  const exchangeRates = {
    USD: 1,
    EUR: 0.92,
    INR: 83.2,
    GBP: 0.79,
    JPY: 150,
    CAD: 1.36,
    AUD: 1.52
  };

  // Load expenses from localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('travelExpenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save expenses to localStorage
  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('travelExpenses', JSON.stringify(newExpenses));
  };

  // AI-powered category prediction
  const predictCategory = (description: string): { category: string; subcategory: string; confidence: number } => {
    const desc = description.toLowerCase();
    
    // Simple keyword-based categorization (replace with real ML model)
    const categoryKeywords = {
      'Transportation': ['flight', 'train', 'bus', 'taxi', 'uber', 'lyft', 'car', 'fuel', 'gas', 'parking'],
      'Accommodation': ['hotel', 'hostel', 'airbnb', 'booking', 'resort', 'room', 'stay'],
      'Food & Dining': ['restaurant', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'cafe', 'bar', 'drink'],
      'Activities': ['tour', 'museum', 'ticket', 'show', 'activity', 'adventure', 'visit'],
      'Shopping': ['shop', 'buy', 'purchase', 'souvenir', 'gift', 'clothing', 'market'],
      'Health & Insurance': ['medical', 'hospital', 'pharmacy', 'insurance', 'health'],
      'Communication': ['phone', 'internet', 'sim', 'wifi', 'data', 'roaming'],
      'Miscellaneous': ['visa', 'tip', 'laundry', 'exchange', 'atm', 'fee']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          const categoryData = categories.find(c => c.name === category);
          const subcategory = categoryData?.subcategories[0] || '';
          return { category, subcategory, confidence: 0.8 };
        }
      }
    }

    return { category: 'Miscellaneous', subcategory: 'Other', confidence: 0.3 };
  };

  // Convert amount to base currency
  const convertToBaseCurrency = (amount: number, fromCurrency: string): number => {
    const rate = exchangeRates[fromCurrency as keyof typeof exchangeRates] || 1;
    const baseRate = exchangeRates[selectedCurrency as keyof typeof exchangeRates] || 1;
    return (amount / rate) * baseRate;
  };

  // Add new expense
  const addExpense = (expenseData: Omit<Expense, 'id' | 'aiCategorized' | 'convertedAmount'>) => {
    const prediction = predictCategory(expenseData.description);
    
    const newExpense: Expense = {
      ...expenseData,
      id: Date.now().toString(),
      category: expenseData.category || prediction.category,
      subcategory: expenseData.subcategory || prediction.subcategory,
      aiCategorized: !expenseData.category,
      convertedAmount: convertToBaseCurrency(expenseData.amount, expenseData.currency)
    };

    const updatedExpenses = [...expenses, newExpense];
    saveExpenses(updatedExpenses);
    
    if (newExpense.aiCategorized) {
      toast.success(`Expense categorized as ${newExpense.category} (${(prediction.confidence * 100).toFixed(0)}% confidence)`);
    } else {
      toast.success('Expense added successfully!');
    }
  };

  // Delete expense
  const deleteExpense = (id: string) => {
    const updatedExpenses = expenses.filter(e => e.id !== id);
    saveExpenses(updatedExpenses);
    toast.success('Expense deleted successfully!');
  };

  // Get filtered expenses
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      if (filters.category !== 'all' && expense.category !== filters.category) return false;
      if (filters.minAmount && expense.convertedAmount! < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && expense.convertedAmount! > parseFloat(filters.maxAmount)) return false;
      
      if (filters.dateRange !== 'all') {
        const expenseDate = new Date(expense.date);
        const now = new Date();
        const diffTime = now.getTime() - expenseDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (filters.dateRange) {
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
          case 'year':
            if (diffDays > 365) return false;
            break;
        }
      }
      
      return true;
    });
  };

  // Calculate analytics
  const getAnalytics = () => {
    const filteredExpenses = getFilteredExpenses();
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0);
    
    // Category breakdown
    const categoryBreakdown = categories.map(category => {
      const categoryExpenses = filteredExpenses.filter(e => e.category === category.name);
      const amount = categoryExpenses.reduce((sum, expense) => sum + (expense.convertedAmount || 0), 0);
      return {
        name: category.name,
        value: amount,
        color: category.color,
        icon: category.icon,
        count: categoryExpenses.length
      };
    }).filter(item => item.value > 0);

    // Daily spending trend
    const dailySpending = filteredExpenses.reduce((acc, expense) => {
      const date = expense.date.split('T')[0];
      acc[date] = (acc[date] || 0) + (expense.convertedAmount || 0);
      return acc;
    }, {} as Record<string, number>);

    const spendingTrend = Object.entries(dailySpending)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date,
        amount,
        formattedDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }));

    // Budget analysis
    const avgDailySpending = totalAmount / Math.max(spendingTrend.length, 1);
    const projection = avgDailySpending * 30; // 30-day projection

    return {
      totalAmount,
      totalTransactions: filteredExpenses.length,
      categoryBreakdown,
      spendingTrend,
      avgDailySpending,
      projection
    };
  };

  // Export expenses to CSV
  const exportToCSV = () => {
    const filteredExpenses = getFilteredExpenses();
    const headers = ['Date', 'Amount', 'Currency', 'Category', 'Subcategory', 'Description', 'Location', 'Tags'];
    const csvContent = [
      headers.join(','),
      ...filteredExpenses.map(expense => [
        expense.date.split('T')[0],
        expense.amount,
        expense.currency,
        expense.category,
        expense.subcategory || '',
        `"${expense.description}"`,
        expense.location || '',
        expense.tags.join(';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `travel-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success('Expenses exported to CSV!');
  };

  const analytics = getAnalytics();

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Spent</p>
              <p className="text-2xl font-bold">
                {currencies.find(c => c.code === selectedCurrency)?.symbol}
                {analytics.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-lg shadow-md border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTransactions}</p>
            </div>
            <Receipt className="w-8 h-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-lg shadow-md border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Daily Average</p>
              <p className="text-2xl font-bold text-gray-900">
                {currencies.find(c => c.code === selectedCurrency)?.symbol}
                {analytics.avgDailySpending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-lg shadow-md border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">30-Day Projection</p>
              <p className="text-2xl font-bold text-orange-600">
                {currencies.find(c => c.code === selectedCurrency)?.symbol}
                {analytics.projection.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-500" />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.spendingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="formattedDate" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [
                  `${currencies.find(c => c.code === selectedCurrency)?.symbol}${value.toFixed(2)}`,
                  'Amount'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="#3B82F6" 
                fill="#93C5FD" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={analytics.categoryBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {analytics.categoryBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [
                  `${currencies.find(c => c.code === selectedCurrency)?.symbol}${value.toFixed(2)}`,
                  'Amount'
                ]}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.categoryBreakdown.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg p-4"
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{category.icon}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.count} transactions</p>
                </div>
              </div>
              <div className="text-lg font-bold" style={{ color: category.color }}>
                {currencies.find(c => c.code === selectedCurrency)?.symbol}
                {category.value.toFixed(2)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: category.color,
                    width: `${(category.value / analytics.totalAmount) * 100}%`
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExpenseList = () => {
    const filteredExpenses = getFilteredExpenses();
    
    return (
      <div className="space-y-4">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
            <p className="text-gray-600 mb-4">Add your first expense or adjust your filters</p>
            <Button
              onClick={() => setIsAddingExpense(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense, index) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">
                        {categories.find(c => c.name === expense.category)?.icon || '📦'}
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">{expense.description}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>{expense.category}</span>
                          {expense.subcategory && (
                            <>
                              <span>•</span>
                              <span>{expense.subcategory}</span>
                            </>
                          )}
                          {expense.aiCategorized && (
                            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              AI Categorized
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                      {expense.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{expense.location}</span>
                        </div>
                      )}
                      {expense.tags.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <div className="flex space-x-1">
                            {expense.tags.map(tag => (
                              <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {currencies.find(c => c.code === expense.currency)?.symbol}
                      {expense.amount.toFixed(2)}
                    </div>
                    {expense.currency !== selectedCurrency && (
                      <div className="text-sm text-gray-600">
                        {currencies.find(c => c.code === selectedCurrency)?.symbol}
                        {expense.convertedAmount?.toFixed(2)}
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <button className="p-1 text-gray-400 hover:text-blue-500">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteExpense(expense.id)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">💰 Advanced Expense Tracker</h1>
          <p className="text-gray-600">Track, analyze, and optimize your travel expenses with AI-powered insights</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md border p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {[
                  { key: 'overview', label: 'Overview', icon: PieChart },
                  { key: 'list', label: 'Expenses', icon: Receipt }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === key
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* Currency Selector */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsAddingExpense(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
              <Button
                onClick={exportToCSV}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.name} value={category.name}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="year">Last Year</option>
            </select>

            <input
              type="number"
              placeholder="Min Amount"
              value={filters.minAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <input
              type="number"
              placeholder="Max Amount"
              value={filters.maxAmount}
              onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'overview' ? renderOverview() : renderExpenseList()}
        </AnimatePresence>

        {/* Add Expense Modal */}
        <AnimatePresence>
          {isAddingExpense && (
            <ExpenseForm
              categories={categories}
              currencies={currencies}
              onSubmit={addExpense}
              onClose={() => setIsAddingExpense(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Expense Form Component
interface ExpenseFormProps {
  categories: ExpenseCategory[];
  currencies: any[];
  onSubmit: (expense: Omit<Expense, 'id' | 'aiCategorized' | 'convertedAmount'>) => void;
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ categories, currencies, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'USD',
    category: '',
    subcategory: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    tags: [] as string[],
    newTag: ''
  });

  const selectedCategory = categories.find(c => c.name === formData.category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }

    onSubmit({
      amount: parseFloat(formData.amount),
      currency: formData.currency,
      category: formData.category,
      subcategory: formData.subcategory,
      description: formData.description,
      date: formData.date,
      location: formData.location,
      tags: formData.tags
    });

    onClose();
  };

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: ''
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Add New Expense</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {currencies.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="What did you spend on?"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category (Leave empty for AI prediction)
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subcategory: '' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Let AI predict category</option>
                {categories.map(category => (
                  <option key={category.name} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            {selectedCategory && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <select
                  value={formData.subcategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select subcategory</option>
                  {selectedCategory.subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Date and Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Where?"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={formData.newTag}
                  onChange={(e) => setFormData(prev => ({ ...prev, newTag: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  className="bg-gray-500 hover:bg-gray-600 text-white"
                >
                  Add
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center space-x-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                Add Expense
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedExpenseTracker;