import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  ThumbsUp, 
  ThumbsDown, 
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Users,
  Calendar,
  MapPin,
  Eye,
  Heart,
  MessageSquare,
  Award,
  Target,
  Zap,
  Brain
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

interface Review {
  id: string;
  text: string;
  rating: number;
  author: string;
  date: string;
  platform: string;
  verified: boolean;
  helpful_votes: number;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  aspects: {
    [key: string]: {
      sentiment: number;
      mentions: string[];
    };
  };
  summary?: string;
}

interface ReviewAnalysis {
  overall_sentiment: {
    positive: number;
    negative: number;
    neutral: number;
    average_score: number;
  };
  aspects: {
    [key: string]: {
      average_sentiment: number;
      mention_count: number;
      trending: 'up' | 'down' | 'stable';
    };
  };
  pros: string[];
  cons: string[];
  insights: string[];
  rating_distribution: { [key: number]: number };
  temporal_trends: Array<{
    date: string;
    sentiment: number;
    review_count: number;
  }>;
  recommended: boolean;
  confidence_score: number;
}

const LLMReviewAnalyzer: React.FC = () => {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSource, setSelectedSource] = useState('all');
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'insights'>('overview');
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);

  // Sample data for demonstration
  const [sampleData] = useState({
    reviews: [
      {
        id: '1',
        text: 'Amazing hotel with excellent service! The staff was incredibly helpful and the location was perfect. The breakfast was outstanding and the rooms were very clean. Highly recommended!',
        rating: 5,
        author: 'Sarah M.',
        date: '2024-03-15',
        platform: 'TripAdvisor',
        verified: true,
        helpful_votes: 23,
        sentiment: { score: 0.92, label: 'positive' as const, confidence: 0.95 },
        aspects: {
          service: { sentiment: 0.95, mentions: ['excellent service', 'incredibly helpful staff'] },
          location: { sentiment: 0.88, mentions: ['perfect location'] },
          cleanliness: { sentiment: 0.90, mentions: ['very clean rooms'] },
          food: { sentiment: 0.85, mentions: ['outstanding breakfast'] }
        }
      },
      {
        id: '2',
        text: 'The hotel was okay but nothing special. The room was small and the Wi-Fi was slow. The staff was friendly though. The price was reasonable for what you get.',
        rating: 3,
        author: 'John D.',
        date: '2024-03-10',
        platform: 'Google Reviews',
        verified: true,
        helpful_votes: 8,
        sentiment: { score: 0.15, label: 'neutral' as const, confidence: 0.78 },
        aspects: {
          room: { sentiment: -0.3, mentions: ['small room'] },
          wifi: { sentiment: -0.6, mentions: ['slow Wi-Fi'] },
          service: { sentiment: 0.4, mentions: ['friendly staff'] },
          value: { sentiment: 0.2, mentions: ['reasonable price'] }
        }
      },
      {
        id: '3',
        text: 'Terrible experience! The room was dirty, the air conditioning didn\'t work, and the customer service was awful. Would not recommend to anyone. Complete waste of money.',
        rating: 1,
        author: 'Mike R.',
        date: '2024-03-08',
        platform: 'Booking.com',
        verified: true,
        helpful_votes: 45,
        sentiment: { score: -0.85, label: 'negative' as const, confidence: 0.96 },
        aspects: {
          cleanliness: { sentiment: -0.9, mentions: ['dirty room'] },
          facilities: { sentiment: -0.8, mentions: ['air conditioning didn\'t work'] },
          service: { sentiment: -0.9, mentions: ['awful customer service'] },
          value: { sentiment: -0.7, mentions: ['waste of money'] }
        }
      }
    ]
  });

  const aspectColors = {
    service: '#3B82F6',
    location: '#10B981',
    cleanliness: '#F59E0B',
    food: '#EF4444',
    value: '#8B5CF6',
    room: '#06B6D4',
    facilities: '#F97316',
    wifi: '#84CC16'
  };

  useEffect(() => {
    // Initialize with sample data
    setReviews(sampleData.reviews);
    analyzeReviews(sampleData.reviews);
  }, []);

  const searchReviews = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      console.log(`🔍 Searching reviews for: ${searchQuery}`);

      const response = await axios.post('/api/review-analyzer/search', {
        query: searchQuery,
        source: selectedSource,
        limit: 50
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setReviews(response.data.reviews);
        await analyzeReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error searching reviews:', error);
      // Use sample data as fallback
      setReviews(sampleData.reviews);
      await analyzeReviews(sampleData.reviews);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeReviews = async (reviewsToAnalyze: Review[]) => {
    if (reviewsToAnalyze.length === 0) return;

    setIsAnalyzing(true);
    try {
      console.log(`🧠 Analyzing ${reviewsToAnalyze.length} reviews...`);

      // For demo purposes, generate analysis from sample data
      const mockAnalysis: ReviewAnalysis = {
        overall_sentiment: {
          positive: 40,
          negative: 20,
          neutral: 40,
          average_score: 0.25
        },
        aspects: {
          service: { average_sentiment: 0.48, mention_count: 3, trending: 'up' },
          location: { average_sentiment: 0.88, mention_count: 1, trending: 'stable' },
          cleanliness: { average_sentiment: 0.0, mention_count: 2, trending: 'down' },
          food: { average_sentiment: 0.85, mention_count: 1, trending: 'up' },
          value: { average_sentiment: -0.25, mention_count: 2, trending: 'stable' },
          room: { average_sentiment: -0.3, mention_count: 1, trending: 'down' },
          facilities: { average_sentiment: -0.8, mention_count: 1, trending: 'down' },
          wifi: { average_sentiment: -0.6, mention_count: 1, trending: 'stable' }
        },
        pros: [
          'Excellent customer service and helpful staff',
          'Perfect location for exploring the area',
          'Outstanding breakfast and food quality',
          'Very clean and well-maintained rooms'
        ],
        cons: [
          'Some rooms reported as small and cramped',
          'Wi-Fi connectivity issues reported',
          'Air conditioning problems in some rooms',
          'Inconsistent customer service experiences'
        ],
        insights: [
          'Service quality is the most polarizing aspect with mixed reviews',
          'Location consistently receives positive feedback',
          'Cleanliness standards appear to vary significantly',
          'Recent reviews show declining facility maintenance'
        ],
        rating_distribution: { 1: 1, 2: 0, 3: 1, 4: 0, 5: 1 },
        temporal_trends: [
          { date: '2024-03-08', sentiment: -0.85, review_count: 1 },
          { date: '2024-03-10', sentiment: 0.15, review_count: 1 },
          { date: '2024-03-15', sentiment: 0.92, review_count: 1 }
        ],
        recommended: true,
        confidence_score: 0.78
      };

      setAnalysis(mockAnalysis);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 0.3) return <ThumbsUp className="w-4 h-4 text-green-500" />;
    if (sentiment < -0.3) return <ThumbsDown className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return 'text-green-600 bg-green-100';
    if (sentiment < -0.3) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-300 rounded-full" />;
    }
  };

  const exportAnalysis = () => {
    const data = {
      search_query: searchQuery,
      analysis_date: new Date().toISOString(),
      reviews_analyzed: reviews.length,
      analysis,
      reviews: reviews.map(r => ({ ...r, text: r.text.substring(0, 100) + '...' }))
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `review-analysis-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const pieData = analysis ? [
    { name: 'Positive', value: analysis.overall_sentiment.positive, color: '#10B981' },
    { name: 'Neutral', value: analysis.overall_sentiment.neutral, color: '#F59E0B' },
    { name: 'Negative', value: analysis.overall_sentiment.negative, color: '#EF4444' }
  ] : [];

  const ratingData = analysis ? Object.entries(analysis.rating_distribution).map(([rating, count]) => ({
    rating: `${rating} Stars`,
    count
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">LLM-Powered Review Analyzer</h1>
                <p className="text-gray-600">Intelligent sentiment analysis and insights for travel reviews</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'overview' ? 'detailed' : 'overview')}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all"
              >
                {viewMode === 'overview' ? 'Detailed View' : 'Overview'}
              </button>
              <button
                onClick={exportAnalysis}
                className="px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-all"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Export
              </button>
            </div>
          </div>

          {/* Search Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter hotel, restaurant, or attraction name..."
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && searchReviews()}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              
              <button
                onClick={searchReviews}
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Analyze Reviews'}
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 text-sm">
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="all">All Sources</option>
                <option value="tripadvisor">TripAdvisor</option>
                <option value="google">Google Reviews</option>
                <option value="booking">Booking.com</option>
                <option value="yelp">Yelp</option>
              </select>

              <select
                value={filterRating}
                onChange={(e) => setFilterRating(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value={0}>All Ratings</option>
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="relevance">Relevance</option>
                <option value="date">Date</option>
                <option value="rating">Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Analysis Results */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Overview Cards */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Overall Sentiment</h3>
                <div className={`px-3 py-1 rounded-full text-sm ${getSentimentColor(analysis.overall_sentiment.average_score)}`}>
                  {analysis.overall_sentiment.average_score > 0.3 ? 'Positive' : 
                   analysis.overall_sentiment.average_score < -0.3 ? 'Negative' : 'Mixed'}
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rating Distribution</h3>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recommendation</h3>
                {analysis.recommended ? (
                  <Award className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
              </div>
              
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${analysis.recommended ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.recommended ? 'Recommended' : 'Not Recommended'}
                </div>
                <div className="text-gray-600 mb-4">
                  Confidence: {(analysis.confidence_score * 100).toFixed(1)}%
                </div>
                <div className="bg-gray-100 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${analysis.recommended ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${analysis.confidence_score * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Based on analysis of {reviews.length} reviews
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Detailed Analysis */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Aspect Analysis */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Aspect Analysis</h3>
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              
              <div className="space-y-3">
                {Object.entries(analysis.aspects).map(([aspect, data]) => (
                  <div key={aspect} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: aspectColors[aspect] || '#6B7280' }}
                      />
                      <span className="font-medium capitalize">{aspect}</span>
                      <span className="text-sm text-gray-500">({data.mention_count} mentions)</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getSentimentIcon(data.average_sentiment)}
                      {getTrendingIcon(data.trending)}
                      <span className={`text-sm font-medium ${getSentimentColor(data.average_sentiment)}`}>
                        {(data.average_sentiment * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Temporal Trends */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Sentiment Trends</h3>
                <Calendar className="w-5 h-5 text-purple-500" />
              </div>
              
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analysis.temporal_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[-1, 1]} />
                  <Tooltip 
                    formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Sentiment']}
                    labelFormatter={(date) => `Date: ${date}`}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="sentiment" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Pros and Cons */}
        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ThumbsUp className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-gray-900">Key Strengths</h3>
              </div>
              
              <div className="space-y-3">
                {analysis.pros.map((pro, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <p className="text-gray-800">{pro}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <ThumbsDown className="w-5 h-5 text-red-500" />
                <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
              </div>
              
              <div className="space-y-3">
                {analysis.cons.map((con, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1 }}
                    className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
                    <p className="text-gray-800">{con}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* AI Insights */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">AI-Generated Insights</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500"
                >
                  <p className="text-gray-800">{insight}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading States */}
        {(isLoading || isAnalyzing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-2xl p-8 text-center">
              <RefreshCw className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isLoading ? 'Searching Reviews...' : 'Analyzing Reviews...'}
              </h3>
              <p className="text-gray-600">
                {isLoading ? 'Fetching reviews from multiple sources' : 'Running AI sentiment analysis and extracting insights'}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LLMReviewAnalyzer;