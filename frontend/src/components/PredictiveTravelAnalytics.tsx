import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Plane,
  Hotel,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Filter,
  Download,
  Share2,
  RefreshCw,
  Zap,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  Eye,
  Settings,
  Bell,
  Bookmark,
  Star,
  Navigation,
  Sun,
  Cloud,
  Umbrella,
  Thermometer
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TravelTrend {
  destination: string;
  country: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  currentPrice: number;
  predictedPrice: number;
  optimalMonth: string;
  confidence: number;
  popularity: number;
  weatherScore: number;
  crowdLevel: 'low' | 'medium' | 'high';
}

interface PriceAnalysis {
  destination: string;
  historical: Array<{
    month: string;
    avgPrice: number;
    flightPrice: number;
    hotelPrice: number;
    activities: number;
  }>;
  predictions: Array<{
    month: string;
    predictedPrice: number;
    confidence: number;
    factors: string[];
  }>;
  optimalBooking: {
    month: string;
    savings: number;
    reasoning: string;
  };
}

interface UserInsights {
  spendingPattern: 'budget' | 'moderate' | 'luxury';
  preferredMonths: string[];
  destinationTypes: string[];
  averageTripCost: number;
  totalSavings: number;
  travelFrequency: number;
  budgetEfficiency: number;
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    potential_savings: number;
  }>;
}

interface MarketAnalytics {
  globalTrends: Array<{
    region: string;
    growth: number;
    avgCost: number;
    popularityIndex: number;
  }>;
  seasonalPatterns: Array<{
    month: string;
    totalTravelers: number;
    avgSpending: number;
    satisfaction: number;
  }>;
  emergingDestinations: Array<{
    destination: string;
    growthRate: number;
    avgCost: number;
    riskLevel: 'low' | 'medium' | 'high';
  }>;
}

const PredictiveTravelAnalytics: React.FC = () => {
  const { state } = useAuth();
  const [activeTab, setActiveTab] = useState<'trends' | 'pricing' | 'insights' | 'market'>('trends');
  const [loading, setLoading] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '1y' | '2y'>('1y');
  const [travelTrends, setTravelTrends] = useState<TravelTrend[]>([]);
  const [priceAnalysis, setPriceAnalysis] = useState<PriceAnalysis | null>(null);
  const [userInsights, setUserInsights] = useState<UserInsights | null>(null);
  const [marketAnalytics, setMarketAnalytics] = useState<MarketAnalytics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: 'all',
    trendDirection: 'all',
    season: 'all',
    region: 'all'
  });

  useEffect(() => {
    initializeAnalytics();
  }, [timeRange]);

  const initializeAnalytics = async () => {
    try {
      setLoading(true);
      
      // Generate comprehensive analytics data
      await Promise.all([
        loadTravelTrends(),
        loadPriceAnalysis(),
        loadUserInsights(),
        loadMarketAnalytics()
      ]);

    } catch (error) {
      console.error('Error initializing analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadTravelTrends = async () => {
    try {
      console.log('📈 Loading travel trends...');

      // Generate mock travel trends data
      const destinations = [
        'Tokyo, Japan', 'Paris, France', 'Bali, Indonesia', 'New York, USA',
        'Barcelona, Spain', 'Santorini, Greece', 'Dubai, UAE', 'London, UK',
        'Rome, Italy', 'Bangkok, Thailand', 'Sydney, Australia', 'Maldives',
        'Iceland', 'Morocco', 'Vietnam', 'Portugal', 'Croatia', 'Norway'
      ];

      const trends = destinations.map((destination, index) => {
        const trendValues = ['up', 'down', 'stable'] as const;
        const crowdLevels = ['low', 'medium', 'high'] as const;
        const trend = trendValues[index % 3];
        
        return {
          destination,
          country: destination.split(', ')[1] || destination,
          trend,
          change: trend === 'up' ? Math.random() * 25 + 5 : 
                 trend === 'down' ? -(Math.random() * 15 + 2) : 
                 Math.random() * 4 - 2,
          currentPrice: Math.floor(Math.random() * 2000 + 500),
          predictedPrice: Math.floor(Math.random() * 2200 + 450),
          optimalMonth: ['March', 'April', 'May', 'September', 'October'][Math.floor(Math.random() * 5)],
          confidence: Math.floor(Math.random() * 20 + 80),
          popularity: Math.floor(Math.random() * 40 + 60),
          weatherScore: Math.floor(Math.random() * 30 + 70),
          crowdLevel: crowdLevels[Math.floor(Math.random() * 3)]
        };
      });

      setTravelTrends(trends);

    } catch (error) {
      console.error('Error loading travel trends:', error);
    }
  };

  const loadPriceAnalysis = async () => {
    try {
      console.log('💰 Loading price analysis...');

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const historical = months.map(month => ({
        month,
        avgPrice: Math.floor(Math.random() * 800 + 600),
        flightPrice: Math.floor(Math.random() * 400 + 300),
        hotelPrice: Math.floor(Math.random() * 300 + 200),
        activities: Math.floor(Math.random() * 200 + 100)
      }));

      const predictions = months.slice(0, 6).map(month => ({
        month,
        predictedPrice: Math.floor(Math.random() * 900 + 550),
        confidence: Math.floor(Math.random() * 20 + 75),
        factors: ['Seasonal demand', 'Currency rates', 'Local events', 'Weather patterns']
      }));

      const analysis: PriceAnalysis = {
        destination: selectedDestination || 'Paris, France',
        historical,
        predictions,
        optimalBooking: {
          month: 'April',
          savings: Math.floor(Math.random() * 300 + 100),
          reasoning: 'Lower demand period with favorable weather conditions and minimal local events affecting prices.'
        }
      };

      setPriceAnalysis(analysis);

    } catch (error) {
      console.error('Error loading price analysis:', error);
    }
  };

  const loadUserInsights = async () => {
    try {
      console.log('🎯 Loading user insights...');

      const insights: UserInsights = {
        spendingPattern: 'moderate',
        preferredMonths: ['May', 'September', 'October'],
        destinationTypes: ['Cultural', 'Adventure', 'Beach'],
        averageTripCost: 1850,
        totalSavings: 2340,
        travelFrequency: 3.2,
        budgetEfficiency: 87,
        recommendations: [
          {
            type: 'timing',
            title: 'Book 2 months earlier',
            description: 'Based on your travel pattern, booking 2 months in advance could save you $200-400 per trip.',
            potential_savings: 300
          },
          {
            type: 'destination',
            title: 'Consider shoulder seasons',
            description: 'Traveling in May or September instead of peak summer could reduce costs by 25%.',
            potential_savings: 450
          },
          {
            type: 'loyalty',
            title: 'Maximize loyalty programs',
            description: 'Using airline and hotel loyalty programs consistently could provide 15% additional savings.',
            potential_savings: 275
          }
        ]
      };

      setUserInsights(insights);

    } catch (error) {
      console.error('Error loading user insights:', error);
    }
  };

  const loadMarketAnalytics = async () => {
    try {
      console.log('🌍 Loading market analytics...');

      const regions = ['Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const analytics: MarketAnalytics = {
        globalTrends: regions.map(region => ({
          region,
          growth: Math.random() * 20 - 5,
          avgCost: Math.floor(Math.random() * 1500 + 800),
          popularityIndex: Math.floor(Math.random() * 40 + 60)
        })),
        seasonalPatterns: months.map(month => ({
          month,
          totalTravelers: Math.floor(Math.random() * 500000 + 200000),
          avgSpending: Math.floor(Math.random() * 800 + 1000),
          satisfaction: Math.floor(Math.random() * 20 + 80)
        })),
        emergingDestinations: [
          { destination: 'Georgia', growthRate: 45, avgCost: 800, riskLevel: 'low' as const },
          { destination: 'Albania', growthRate: 38, avgCost: 650, riskLevel: 'low' as const },
          { destination: 'Rwanda', growthRate: 42, avgCost: 1200, riskLevel: 'medium' as const },
          { destination: 'Kazakhstan', growthRate: 35, avgCost: 900, riskLevel: 'medium' as const }
        ]
      };

      setMarketAnalytics(analytics);

    } catch (error) {
      console.error('Error loading market analytics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeAnalytics();
    setRefreshing(false);
    toast.success('Analytics refreshed successfully');
  };

  const handleExportData = () => {
    const data = {
      travelTrends,
      priceAnalysis,
      userInsights,
      marketAnalytics,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analytics data exported successfully');
  };

  const getTrendIcon = (trend: string, change: number) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-green-600 bg-green-50';
    if (trend === 'down') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTrends = travelTrends.filter(trend => {
    const matchesSearch = trend.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         trend.country.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilters = 
      (filters.trendDirection === 'all' || trend.trend === filters.trendDirection) &&
      (filters.priceRange === 'all' || 
       (filters.priceRange === 'budget' && trend.currentPrice < 1000) ||
       (filters.priceRange === 'moderate' && trend.currentPrice >= 1000 && trend.currentPrice < 2000) ||
       (filters.priceRange === 'luxury' && trend.currentPrice >= 2000));

    return matchesSearch && matchesFilters;
  });

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  if (loading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BarChart3 className="w-8 h-8 mr-3 text-blue-500" />
                Predictive Travel Analytics
              </h1>
              <p className="text-gray-600 mt-2">
                AI-powered insights for smarter travel decisions
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3m">Last 3 Months</option>
                <option value="6m">Last 6 Months</option>
                <option value="1y">Last Year</option>
                <option value="2y">Last 2 Years</option>
              </select>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

              <button
                onClick={handleExportData}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-6 mt-6 border-b border-gray-200">
            {[
              { id: 'trends', label: 'Travel Trends', icon: TrendingUp },
              { id: 'pricing', label: 'Price Analysis', icon: DollarSign },
              { id: 'insights', label: 'Personal Insights', icon: Target },
              { id: 'market', label: 'Market Analytics', icon: Globe }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {activeTab === 'trends' && (
          <div className="space-y-8">
            {/* Search and Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <MapPin className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search destinations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Showing {filteredTrends.length} destinations
                </div>
              </div>

              {/* Advanced Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 pt-4 mt-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price Range
                        </label>
                        <select
                          value={filters.priceRange}
                          onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Prices</option>
                          <option value="budget">Budget (&lt; $1,000)</option>
                          <option value="moderate">Moderate ($1,000 - $2,000)</option>
                          <option value="luxury">Luxury (&gt; $2,000)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Trend Direction
                        </label>
                        <select
                          value={filters.trendDirection}
                          onChange={(e) => setFilters(prev => ({ ...prev, trendDirection: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Trends</option>
                          <option value="up">Rising</option>
                          <option value="down">Declining</option>
                          <option value="stable">Stable</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Season
                        </label>
                        <select
                          value={filters.season}
                          onChange={(e) => setFilters(prev => ({ ...prev, season: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Seasons</option>
                          <option value="spring">Spring</option>
                          <option value="summer">Summer</option>
                          <option value="fall">Fall</option>
                          <option value="winter">Winter</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Region
                        </label>
                        <select
                          value={filters.region}
                          onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Regions</option>
                          <option value="europe">Europe</option>
                          <option value="asia">Asia</option>
                          <option value="americas">Americas</option>
                          <option value="africa">Africa</option>
                          <option value="oceania">Oceania</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trends Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rising Destinations</p>
                    <p className="text-2xl font-bold text-green-600">
                      {filteredTrends.filter(t => t.trend === 'up').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Declining Destinations</p>
                    <p className="text-2xl font-bold text-red-600">
                      {filteredTrends.filter(t => t.trend === 'down').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Price</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${Math.round(filteredTrends.reduce((sum, t) => sum + t.currentPrice, 0) / filteredTrends.length)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Confidence</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {filteredTrends.filter(t => t.confidence >= 90).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Trends Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Destination Trends Analysis</h3>
                <p className="text-gray-600 text-sm mt-1">Real-time insights and predictions for popular destinations</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trend
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Predicted Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Optimal Month
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Crowd Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTrends.map((trend, index) => (
                      <motion.tr
                        key={trend.destination}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedDestination(trend.destination)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{trend.destination}</div>
                            <div className="text-sm text-gray-500">{trend.country}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(trend.trend)}`}>
                            {getTrendIcon(trend.trend, trend.change)}
                            <span>{Math.abs(trend.change).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${trend.currentPrice.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            <span>${trend.predictedPrice.toLocaleString()}</span>
                            {trend.predictedPrice < trend.currentPrice ? (
                              <ArrowDown className="w-4 h-4 text-green-500" />
                            ) : trend.predictedPrice > trend.currentPrice ? (
                              <ArrowUp className="w-4 h-4 text-red-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900">{trend.optimalMonth}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCrowdLevelColor(trend.crowdLevel)}`}>
                            {trend.crowdLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${trend.confidence}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">{trend.confidence}%</span>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && priceAnalysis && (
          <div className="space-y-8">
            {/* Destination Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-4">
                <MapPin className="w-5 h-5 text-blue-500" />
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a destination</option>
                  {travelTrends.map(trend => (
                    <option key={trend.destination} value={trend.destination}>
                      {trend.destination}
                    </option>
                  ))}
                </select>
                <div className="text-sm text-gray-600">
                  Analyzing: {priceAnalysis.destination}
                </div>
              </div>
            </div>

            {/* Price Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Historical Prices */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Historical Price Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={priceAnalysis.historical}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="avgPrice" stroke="#3B82F6" strokeWidth={2} name="Average Price" />
                    <Line type="monotone" dataKey="flightPrice" stroke="#EF4444" strokeWidth={2} name="Flight Price" />
                    <Line type="monotone" dataKey="hotelPrice" stroke="#10B981" strokeWidth={2} name="Hotel Price" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>

              {/* Price Predictions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Price Predictions</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={priceAnalysis.predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="predictedPrice" 
                      stroke="#8B5CF6" 
                      fill="#8B5CF6" 
                      fillOpacity={0.3}
                      name="Predicted Price"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Breakdown Analysis</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsBarChart data={priceAnalysis.historical}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="flightPrice" stackId="a" fill="#3B82F6" name="Flights" />
                  <Bar dataKey="hotelPrice" stackId="a" fill="#10B981" name="Hotels" />
                  <Bar dataKey="activities" stackId="a" fill="#F59E0B" name="Activities" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>

            {/* Optimal Booking Recommendation */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Optimal Booking Recommendation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Best Month to Book</p>
                      <p className="text-lg font-semibold text-green-700">{priceAnalysis.optimalBooking.month}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Potential Savings</p>
                      <p className="text-lg font-semibold text-green-700">${priceAnalysis.optimalBooking.savings}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                      <p className="text-lg font-semibold text-green-700">High (92%)</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-4 leading-relaxed">
                    {priceAnalysis.optimalBooking.reasoning}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && userInsights && (
          <div className="space-y-8">
            {/* Personal Travel Profile */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Travel Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Spending Pattern</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{userInsights.spendingPattern}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Average Trip Cost</p>
                  <p className="text-lg font-semibold text-gray-900">${userInsights.averageTripCost}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plane className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Trips Per Year</p>
                  <p className="text-lg font-semibold text-gray-900">{userInsights.travelFrequency}</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Budget Efficiency</p>
                  <p className="text-lg font-semibold text-gray-900">{userInsights.budgetEfficiency}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Preferred Travel Months</h4>
                  <div className="flex flex-wrap gap-2">
                    {userInsights.preferredMonths.map(month => (
                      <span 
                        key={month}
                        className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                      >
                        {month}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Destination Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {userInsights.destinationTypes.map(type => (
                      <span 
                        key={type}
                        className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm font-medium"
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Summary */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Total Savings Achieved</h3>
                  <p className="text-gray-600">Based on optimized booking patterns</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-green-600">${userInsights.totalSavings}</p>
                  <p className="text-sm text-gray-600">Last 12 months</p>
                </div>
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-2 text-blue-500" />
                AI-Powered Recommendations
              </h3>

              <div className="space-y-6">
                {userInsights.recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            rec.type === 'timing' ? 'bg-blue-500' :
                            rec.type === 'destination' ? 'bg-green-500' :
                            'bg-purple-500'
                          }`}>
                            {rec.type === 'timing' ? <Clock className="w-4 h-4" /> :
                             rec.type === 'destination' ? <MapPin className="w-4 h-4" /> :
                             <Star className="w-4 h-4" />}
                          </span>
                          <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        </div>
                        <p className="text-gray-600 leading-relaxed">{rec.description}</p>
                      </div>
                      <div className="text-right ml-6">
                        <p className="text-lg font-semibold text-green-600">+${rec.potential_savings}</p>
                        <p className="text-sm text-gray-500">potential savings</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'market' && marketAnalytics && (
          <div className="space-y-8">
            {/* Global Trends Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Regional Growth Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={marketAnalytics.globalTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="region" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="growth" fill="#3B82F6" name="Growth %" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Average Costs by Region</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={marketAnalytics.globalTrends}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="avgCost"
                      nameKey="region"
                    >
                      {marketAnalytics.globalTrends.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seasonal Patterns */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Seasonal Travel Patterns</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={marketAnalytics.seasonalPatterns}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalTravelers" fill="#3B82F6" name="Total Travelers" />
                  <Line yAxisId="right" type="monotone" dataKey="avgSpending" stroke="#EF4444" strokeWidth={2} name="Avg Spending" />
                  <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#10B981" strokeWidth={2} name="Satisfaction %" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>

            {/* Emerging Destinations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Emerging Destinations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {marketAnalytics.emergingDestinations.map((dest, index) => (
                  <motion.div
                    key={dest.destination}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{dest.destination}</h4>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        dest.riskLevel === 'low' ? 'bg-green-100 text-green-800' :
                        dest.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {dest.riskLevel} risk
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Growth Rate</span>
                        <span className="font-semibold text-green-600">+{dest.growthRate}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avg Cost</span>
                        <span className="font-semibold text-gray-900">${dest.avgCost}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(dest.growthRate / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveTravelAnalytics;