import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Camera,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Calendar,
  CreditCard,
  Wallet,
  Receipt,
  Target,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Brain,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  MapPin,
  Star,
  X,
  Check,
  AlertCircle,
  Info
} from 'lucide-react';

// TypeScript interfaces
interface Expense {
  _id: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: string;
  location?: string;
  receiptUrl?: string;
  tripId?: string;
  tags?: string[];
  aiCategorized?: boolean;
}

interface Budget {
  _id: string;
  totalAmount: number;
  currency: string;
  categories: {
    [key: string]: {
      allocated: number;
      spent: number;
      remaining: number;
    };
  };
  period: string;
  tripId?: string;
  active: boolean;
  aiOptimized?: boolean;
}

interface FinancialOverview {
  totalSpent: number;
  totalBudget: number;
  monthlySpending: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  spendingTrend: string;
  budgetUtilization: number;
}

interface SpendingAnalytics {
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: string;
  }>;
  monthlyTrends: Array<{
    month: string;
    amount: number;
  }>;
  averageDaily: number;
  peakSpendingDay: string;
  comparisonToPrevious: number;
}

interface FinancialInsights {
  insights: Array<{
    type: 'warning' | 'success' | 'info' | 'recommendation';
    title: string;
    description: string;
    actionable?: boolean;
    priority: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    potentialSavings?: number;
    category?: string;
  }>;
  score: number;
  improvements: string[];
}

const AIFinanceTracker: React.FC = () => {
  const { state } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'budgets' | 'analytics' | 'insights'>('overview');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [analytics, setAnalytics] = useState<SpendingAnalytics | null>(null);
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [exchangeRates, setExchangeRates] = useState<{[key: string]: number}>({});
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showReceiptUpload, setShowReceiptUpload] = useState(false);
  const [showCurrencyConverter, setShowCurrencyConverter] = useState(false);
  const [showBudgetOptimizer, setShowBudgetOptimizer] = useState(false);
  
  // Filter and search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  
  // Form state
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    currency: 'USD',
    description: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    location: '',
    tags: [] as string[]
  });
  
  const [newBudget, setNewBudget] = useState({
    totalAmount: 0,
    currency: 'USD',
    period: 'monthly',
    categories: {
      food: 30,
      transport: 25,
      accommodation: 35,
      entertainment: 10
    }
  });
  
  const [currencyConverter, setCurrencyConverter] = useState({
    amount: 0,
    fromCurrency: 'USD',
    toCurrency: 'EUR',
    result: 0
  });
  
  const [budgetOptimizer, setBudgetOptimizer] = useState({
    destination: '',
    duration: 7,
    totalBudget: 0,
    preferences: {
      accommodation: 'mid-range',
      dining: 'mix',
      activities: 'moderate'
    }
  });
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Expense categories
  const expenseCategories = [
    'food', 'transport', 'accommodation', 'entertainment', 'shopping',
    'health', 'communication', 'visa', 'insurance', 'tips', 'other'
  ];

  // Currency options
  const currencies = [
    'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KRW'
  ];

  // API calls
  const fetchOverview = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-finance/overview', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setOverview(data.data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (currencyFilter !== 'all') params.append('currency', currencyFilter);
      if (dateFilter !== 'all') {
        const now = new Date();
        if (dateFilter === 'week') {
          params.append('dateFrom', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString());
        } else if (dateFilter === 'month') {
          params.append('dateFrom', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());
        }
      }

      const response = await fetch(`/api/ai-finance/expenses?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setExpenses(data.data.expenses || []);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, currencyFilter, dateFilter]);

  const fetchBudgets = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-finance/budgets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setBudgets(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-finance/analytics/spending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, []);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-finance/insights', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  }, []);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch('/api/ai-finance/currency/rates', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setExchangeRates(data.data.rates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  }, []);

  // Actions
  const handleAddExpense = async () => {
    if (!newExpense.amount || !newExpense.description) {
      setError('Amount and description are required');
      return;
    }

    try {
      const response = await fetch('/api/ai-finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newExpense)
      });

      const data = await response.json();
      if (data.success) {
        setExpenses(prev => [data.data, ...prev]);
        setShowAddExpense(false);
        setNewExpense({
          amount: 0,
          currency: 'USD',
          description: '',
          category: 'food',
          date: new Date().toISOString().split('T')[0],
          location: '',
          tags: []
        });
        setSuccess('Expense added successfully!');
        fetchOverview(); // Refresh overview
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to add expense');
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/ai-finance/expenses/${expenseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      const data = await response.json();
      if (data.success) {
        setExpenses(prev => prev.filter(exp => exp._id !== expenseId));
        setSuccess('Expense deleted successfully!');
        fetchOverview(); // Refresh overview
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to delete expense');
      console.error('Error deleting expense:', error);
    }
  };

  const handleCreateBudget = async () => {
    if (!newBudget.totalAmount) {
      setError('Total amount is required');
      return;
    }

    try {
      const response = await fetch('/api/ai-finance/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newBudget)
      });

      const data = await response.json();
      if (data.success) {
        setBudgets(prev => [data.data, ...prev]);
        setShowAddBudget(false);
        setNewBudget({
          totalAmount: 0,
          currency: 'USD',
          period: 'monthly',
          categories: {
            food: 30,
            transport: 25,
            accommodation: 35,
            entertainment: 10
          }
        });
        setSuccess('Budget created successfully!');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to create budget');
      console.error('Error creating budget:', error);
    }
  };

  const handleReceiptUpload = async () => {
    if (!receiptFile) {
      setError('Please select a receipt image');
      return;
    }

    const formData = new FormData();
    formData.append('receipt', receiptFile);
    formData.append('currency', newExpense.currency);

    try {
      setLoading(true);
      const response = await fetch('/api/ai-finance/receipts/process', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        const extractedData = data.data;
        setNewExpense(prev => ({
          ...prev,
          amount: extractedData.amount || prev.amount,
          description: extractedData.description || prev.description,
          category: extractedData.category || prev.category,
          date: extractedData.date || prev.date
        }));
        setShowReceiptUpload(false);
        setShowAddExpense(true);
        setSuccess('Receipt processed successfully! Please review the extracted data.');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to process receipt');
      console.error('Error processing receipt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyConversion = async () => {
    if (!currencyConverter.amount) {
      setError('Please enter an amount to convert');
      return;
    }

    try {
      const response = await fetch('/api/ai-finance/currency/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: currencyConverter.amount,
          fromCurrency: currencyConverter.fromCurrency,
          toCurrency: currencyConverter.toCurrency
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrencyConverter(prev => ({
          ...prev,
          result: data.data.convertedAmount
        }));
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to convert currency');
      console.error('Error converting currency:', error);
    }
  };

  const handleBudgetOptimization = async () => {
    if (!budgetOptimizer.destination || !budgetOptimizer.totalBudget) {
      setError('Destination and total budget are required');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/ai-finance/budgets/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          destination: budgetOptimizer.destination,
          duration: budgetOptimizer.duration,
          totalBudget: budgetOptimizer.totalBudget,
          preferences: budgetOptimizer.preferences
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewBudget(prev => ({
          ...prev,
          totalAmount: budgetOptimizer.totalBudget,
          categories: data.data.allocation
        }));
        setShowBudgetOptimizer(false);
        setShowAddBudget(true);
        setSuccess('Budget optimized successfully! Review the AI-generated allocation.');
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Failed to optimize budget');
      console.error('Error optimizing budget:', error);
    } finally {
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchOverview();
    fetchExchangeRates();
  }, [fetchOverview, fetchExchangeRates]);

  useEffect(() => {
    if (activeTab === 'expenses') {
      fetchExpenses();
    } else if (activeTab === 'budgets') {
      fetchBudgets();
    } else if (activeTab === 'analytics') {
      fetchAnalytics();
    } else if (activeTab === 'insights') {
      fetchInsights();
    }
  }, [activeTab, fetchExpenses, fetchBudgets, fetchAnalytics, fetchInsights]);

  // Filter expenses based on search
  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Clear notifications
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading && !expenses.length && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Brain className="w-8 h-8 mr-3 text-green-500" />
                AI Finance Tracker
              </h1>
              
              <nav className="hidden md:flex space-x-6">
                {[
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'expenses', label: 'Expenses', icon: Receipt },
                  { id: 'budgets', label: 'Budgets', icon: Target },
                  { id: 'analytics', label: 'Analytics', icon: PieChart },
                  { id: 'insights', label: 'AI Insights', icon: Zap }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === id
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCurrencyConverter(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span>Convert</span>
              </button>
              
              <button
                onClick={() => setShowReceiptUpload(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Camera className="w-5 h-5" />
                <span>Scan Receipt</span>
              </button>
              
              <button
                onClick={() => setShowAddExpense(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add Expense</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 m-4 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${overview?.totalSpent?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Budget</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${overview?.totalBudget?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${overview?.monthlySpending?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Budget Used</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {overview?.budgetUtilization?.toFixed(1) || '0'}%
                    </p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <PieChart className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <Plus className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-700">Add Expense</span>
                </button>
                
                <button
                  onClick={() => setShowReceiptUpload(true)}
                  className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Camera className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-700">Scan Receipt</span>
                </button>
                
                <button
                  onClick={() => setShowBudgetOptimizer(true)}
                  className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Brain className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-700">AI Budget</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('insights')}
                  className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <Zap className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-700">AI Insights</span>
                </button>
              </div>
            </div>

            {/* Top Categories */}
            {overview?.topCategories && overview.topCategories.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Spending Categories</h3>
                <div className="space-y-4">
                  {overview.topCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full bg-${['blue', 'green', 'purple', 'orange', 'red'][index] || 'gray'}-500`}></div>
                        <span className="font-medium text-gray-900 capitalize">{category.category}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${category.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search expenses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full"
                    />
                  </div>
                </div>
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Categories</option>
                  {expenseCategories.map(category => (
                    <option key={category} value={category} className="capitalize">
                      {category}
                    </option>
                  ))}
                </select>
                
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                
                <button
                  onClick={fetchExpenses}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Expenses List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {filteredExpenses.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {filteredExpenses.map((expense) => (
                    <motion.div
                      key={expense._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="bg-green-100 p-2 rounded-full">
                              <Receipt className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{expense.description}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                  <span className="capitalize flex items-center space-x-1">
                                    <span>{expense.category}</span>
                                    {expense.aiCategorized && (
                                      <span title="AI Categorized">
                                        <Brain className="w-3 h-3 text-blue-500" />
                                      </span>
                                    )}
                                  </span>
                                <span>{new Date(expense.date).toLocaleDateString()}</span>
                                {expense.location && (
                                  <span className="flex items-center space-x-1">
                                    <MapPin className="w-3 h-3" />
                                    <span>{expense.location}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {expense.currency} {expense.amount.toFixed(2)}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="text-red-600 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
                  <p className="text-gray-600 mb-6">Start tracking your travel expenses!</p>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Add Your First Expense
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Add remaining tabs content (budgets, analytics, insights) here... */}
        {/* For brevity, I'll show just the structure */}
        
        {activeTab === 'budgets' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Your Budgets</h3>
                <button
                  onClick={() => setShowAddBudget(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Budget</span>
                </button>
              </div>
              
              {budgets.length > 0 ? (
                <div className="grid gap-6">
                  {budgets.map((budget) => (
                    <div key={budget._id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {budget.currency} {budget.totalAmount.toFixed(2)} Budget
                          </h4>
                          <p className="text-sm text-gray-600 capitalize">{budget.period}</p>
                        </div>
                        {budget.aiOptimized && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                            <Brain className="w-3 h-3" />
                            <span>AI Optimized</span>
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {Object.entries(budget.categories).map(([category, data]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="capitalize font-medium text-gray-700">{category}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${Math.min((data.spent / data.allocated) * 100, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">
                                {data.spent.toFixed(0)} / {data.allocated.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No budgets yet</h3>
                  <p className="text-gray-600 mb-6">Create your first budget to track spending limits!</p>
                  <button
                    onClick={() => setShowAddBudget(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
                  >
                    Create Budget
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Modals */}
      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Add New Expense</h3>
                  <button
                    onClick={() => setShowAddExpense(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={newExpense.amount || ''}
                        onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={newExpense.currency}
                        onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <input
                      type="text"
                      value={newExpense.description}
                      onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                      placeholder="Lunch at restaurant..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        {expenseCategories.map(category => (
                          <option key={category} value={category} className="capitalize">
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location (optional)
                    </label>
                    <input
                      type="text"
                      value={newExpense.location}
                      onChange={(e) => setNewExpense({ ...newExpense, location: e.target.value })}
                      placeholder="Paris, France"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowAddExpense(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddExpense}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Upload Modal */}
      <AnimatePresence>
        {showReceiptUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Upload Receipt</h3>
                  <button
                    onClick={() => setShowReceiptUpload(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Receipt Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="receipt-upload"
                      />
                      <label htmlFor="receipt-upload" className="cursor-pointer">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Click to upload receipt image</p>
                        <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                      </label>
                      {receiptFile && (
                        <p className="text-green-600 mt-2 font-medium">{receiptFile.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowReceiptUpload(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleReceiptUpload}
                      disabled={!receiptFile || loading}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Brain className="w-4 h-4" />
                      )}
                      <span>{loading ? 'Processing...' : 'Process Receipt'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Currency Converter Modal */}
      <AnimatePresence>
        {showCurrencyConverter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Currency Converter</h3>
                  <button
                    onClick={() => setShowCurrencyConverter(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={currencyConverter.amount || ''}
                      onChange={(e) => setCurrencyConverter({ ...currencyConverter, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="100.00"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                      <select
                        value={currencyConverter.fromCurrency}
                        onChange={(e) => setCurrencyConverter({ ...currencyConverter, fromCurrency: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                      <select
                        value={currencyConverter.toCurrency}
                        onChange={(e) => setCurrencyConverter({ ...currencyConverter, toCurrency: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {currencies.map(currency => (
                          <option key={currency} value={currency}>{currency}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {currencyConverter.result > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-center">
                        <p className="text-sm text-blue-600">Converted Amount</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {currencyConverter.toCurrency} {currencyConverter.result.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={() => setShowCurrencyConverter(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleCurrencyConversion}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Convert
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIFinanceTracker;