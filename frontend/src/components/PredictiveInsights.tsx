import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  CloudSun,
  Users,
  DollarSign,
  Calendar,
  BarChart3,
  LineChart,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  MapPin,
  Zap,
  Brain,
  Target,
  Search,
  Filter,
  Download,
  RefreshCw,
  Globe,
  Thermometer,
  Eye,
  Shield,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  ArrowRight,
  BookOpen,
  Lightbulb,
  Calculator,
  PieChart,
  Activity,
  Compass
} from 'lucide-react';

interface PredictiveInsightsProps {}

interface WeatherPrediction {
  confidence: number;
  dailyForecasts: Array<{
    date: string;
    temperature: number;
    conditions: string;
    travelSuitability: number;
  }>;
  bestWeatherWindows: Array<{
    start: string;
    end: string;
    score: number;
  }>;
  extremeWeatherAlerts: any[];
  travelComfortIndex: number;
}

interface CrowdPrediction {
  confidence: number;
  peakPeriods: string[];
  offPeakPeriods: string[];
  averageCrowdLevel: number;
  venueSpecificPredictions: any[];
  trafficPatterns: any;
  alternativeTimings: any[];
}

interface PricingPrediction {
  confidence: number;
  flightPricing: any;
  hotelPricing: any;
  bestBookingWindows: any;
  priceDropPredictions: any[];
  budgetRecommendations: any;
  overallScore: number;
}

interface OptimalTiming {
  bestWindows: Array<{
    startDate: string;
    endDate: string;
    reason: string;
    confidence: number;
    score: number;
  }>;
  riskAssessment: any;
  bookingTimeline: any;
  overallScore: number;
}

interface TravelPredictions {
  destination: string;
  generatedAt: string;
  weather: WeatherPrediction;
  crowds: CrowdPrediction;
  pricing: PricingPrediction;
  optimalTiming: OptimalTiming;
  seasonalInsights: any;
  personalizedRecommendations: any;
  confidence: number;
  metadata: {
    travelStyle: string;
    budget: string;
    duration: number;
    travelers: number;
  };
}

const PredictiveInsights: React.FC<PredictiveInsightsProps> = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'search' | 'predictions' | 'compare' | 'trends'>('search');
  const [destination, setDestination] = useState('');
  const [predictions, setPredictions] = useState<TravelPredictions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search parameters
  const [searchParams, setSearchParams] = useState({
    travelStyle: 'leisure',
    budget: 'medium',
    duration: 7,
    travelers: 2,
    flexibility: 7,
    travelDates: [] as string[]
  });

  // Comparison state  
  const [comparisonResults, setComparisonResults] = useState<any>(null);

  // UI state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    weather: true,
    crowds: false,
    pricing: false,
    timing: false
  });

  // Generate travel predictions
  const generatePredictions = async () => {
    if (!destination.trim()) {
      setError('Please enter a destination');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predictive-insights/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          destination,
          ...searchParams
        })
      });

      const data = await response.json();

      if (data.success) {
        setPredictions(data.data);
        setActiveTab('predictions');
      } else {
        setError(data.message || 'Failed to generate predictions');
      }
    } catch (error) {
      console.error('Error generating predictions:', error);
      setError('Failed to generate predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Render confidence badge
  const renderConfidenceBadge = (confidence: number) => {
    const getColor = (conf: number) => {
      if (conf >= 0.8) return 'bg-green-100 text-green-800';
      if (conf >= 0.6) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };

    const getLabel = (conf: number) => {
      if (conf >= 0.8) return 'High Confidence';
      if (conf >= 0.6) return 'Medium Confidence';
      return 'Low Confidence';
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getColor(confidence)}`}>
        <Shield className="w-3 h-3 mr-1" />
        {getLabel(confidence)} ({Math.round(confidence * 100)}%)
      </span>
    );
  };

  // Render score indicator
  const renderScoreIndicator = (score: number, label: string) => {
    const getColor = (s: number) => {
      if (s >= 80) return 'text-green-600';
      if (s >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600">{label}:</span>
        <span className={`text-lg font-bold ${getColor(score)}`}>
          {score}/100
        </span>
        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Predictive Travel Insights</h1>
                <p className="text-sm text-gray-600">AI-powered travel predictions and analytics</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
          {[
            { id: 'search', label: 'Search & Predict', icon: Search },
            { id: 'predictions', label: 'Predictions', icon: TrendingUp },
            { id: 'compare', label: 'Compare', icon: BarChart3 },
            { id: 'trends', label: 'Trends', icon: LineChart }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === id
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Search & Predict Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-purple-500" />
                Travel Prediction Search
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter destination (e.g., Paris, Tokyo, New York)"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Travel Style
                      </label>
                      <select
                        value={searchParams.travelStyle}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, travelStyle: e.target.value }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="leisure">Leisure</option>
                        <option value="adventure">Adventure</option>
                        <option value="business">Business</option>
                        <option value="luxury">Luxury</option>
                        <option value="budget">Budget</option>
                        <option value="family">Family</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget Level
                      </label>
                      <select
                        value={searchParams.budget}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="budget">Budget</option>
                        <option value="medium">Medium</option>
                        <option value="luxury">Luxury</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration (days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={searchParams.duration}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, duration: parseInt(e.target.value) || 7 }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Travelers
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={searchParams.travelers}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, travelers: parseInt(e.target.value) || 2 }))}
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Flexibility (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={searchParams.flexibility}
                      onChange={(e) => setSearchParams(prev => ({ ...prev, flexibility: parseInt(e.target.value) || 7 }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="How flexible are your dates?"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <Info className="w-4 h-4 inline mr-1" />
                  AI will analyze weather, crowds, pricing, and optimal timing
                </div>
                <button
                  onClick={generatePredictions}
                  disabled={loading || !destination.trim()}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    loading || !destination.trim()
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Generating Predictions...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>Generate AI Predictions</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Start Examples */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                Quick Start Examples
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { dest: 'Paris, France', style: 'luxury', season: 'Spring luxury getaway' },
                  { dest: 'Tokyo, Japan', style: 'adventure', season: 'Cherry blossom adventure' },
                  { dest: 'Bali, Indonesia', style: 'leisure', season: 'Beach relaxation trip' }
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDestination(example.dest);
                      setSearchParams(prev => ({ ...prev, travelStyle: example.style }));
                    }}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                  >
                    <div className="font-medium text-gray-900">{example.dest}</div>
                    <div className="text-sm text-gray-600 capitalize">{example.style} • {example.season}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && predictions && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-purple-500" />
                    {predictions.destination}
                  </h2>
                  <p className="text-gray-600">
                    Generated {new Date(predictions.generatedAt).toLocaleString()}
                  </p>
                </div>
                {renderConfidenceBadge(predictions.confidence)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CloudSun className="w-5 h-5 text-blue-500 mr-2" />
                    <span className="font-medium text-blue-900">Weather</span>
                  </div>
                  {renderScoreIndicator(predictions.weather.travelComfortIndex || 75, 'Comfort')}
                </div>

                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Users className="w-5 h-5 text-orange-500 mr-2" />
                    <span className="font-medium text-orange-900">Crowds</span>
                  </div>
                  {renderScoreIndicator(100 - (predictions.crowds.averageCrowdLevel * 10), 'Avoidance')}
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <DollarSign className="w-5 h-5 text-green-500 mr-2" />
                    <span className="font-medium text-green-900">Pricing</span>
                  </div>
                  {renderScoreIndicator(predictions.pricing.overallScore || 70, 'Value')}
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Clock className="w-5 h-5 text-purple-500 mr-2" />
                    <span className="font-medium text-purple-900">Timing</span>
                  </div>
                  {renderScoreIndicator(predictions.optimalTiming.overallScore || 80, 'Optimal')}
                </div>
              </div>
            </div>

            {/* Detailed Predictions */}
            <div className="space-y-4">
              {/* Weather Predictions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection('weather')}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <CloudSun className="w-6 h-6 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Weather Predictions</h3>
                      <p className="text-sm text-gray-600">
                        {predictions.weather.dailyForecasts?.length || 0} day forecast with comfort analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderConfidenceBadge(predictions.weather.confidence)}
                    {expandedSections.weather ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSections.weather && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200"
                    >
                      <div className="p-6">
                        {/* Weather forecast grid */}
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
                          {predictions.weather.dailyForecasts?.slice(0, 7).map((forecast, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-sm font-medium text-gray-600 mb-1">
                                {new Date(forecast.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </div>
                              <div className="text-lg font-bold text-gray-900 mb-1">
                                {forecast.temperature}°C
                              </div>
                              <div className="text-xs text-gray-600 capitalize">
                                {forecast.conditions}
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-500 h-1 rounded-full"
                                  style={{ width: `${forecast.travelSuitability}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Weather insights */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="font-medium text-blue-900 mb-2">Weather Insights</h4>
                          <div className="text-sm text-blue-800 space-y-1">
                            <div>• Travel Comfort Index: {predictions.weather.travelComfortIndex}/100</div>
                            <div>• Best weather windows: {predictions.weather.bestWeatherWindows?.length || 0} identified</div>
                            <div>• Extreme weather alerts: {predictions.weather.extremeWeatherAlerts?.length || 0}</div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Additional prediction sections would follow similar pattern */}
              {/* For brevity, showing structure for other sections */}
              
              {/* Crowd Predictions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection('crowds')}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="w-6 h-6 text-orange-500" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Crowd Level Predictions</h3>
                      <p className="text-sm text-gray-600">
                        Average crowd level: {predictions.crowds.averageCrowdLevel}/10
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {renderConfidenceBadge(predictions.crowds.confidence)}
                    {expandedSections.crowds ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSections.crowds && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-200 p-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Peak Periods</h4>
                          <div className="space-y-2">
                            {predictions.crowds.peakPeriods?.map((period, index) => (
                              <div key={index} className="bg-red-50 text-red-800 px-3 py-2 rounded-lg text-sm">
                                {period}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">Off-Peak Periods</h4>
                          <div className="space-y-2">
                            {predictions.crowds.offPeakPeriods?.map((period, index) => (
                              <div key={index} className="bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm">
                                {period}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* Empty state for other tabs */}
        {activeTab === 'compare' && !comparisonResults && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Compare Destinations</h3>
            <p className="text-gray-600 mb-6">Compare multiple destinations to find the best option for your trip</p>
            <button 
              onClick={() => setActiveTab('search')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              Start Comparison
            </button>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Travel Trends Analysis</h3>
            <p className="text-gray-600 mb-6">Analyze historical trends and patterns for better travel planning</p>
            <button 
              onClick={() => setActiveTab('search')}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
            >
              Explore Trends
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictiveInsights;