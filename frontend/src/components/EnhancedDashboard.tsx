import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Button from './Button';
import { 
  Eye, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Settings, 
  Navigation, 
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Star,
  Sparkles,
  Globe,
  Zap,
  Brain,
  Heart,
  Camera,
  TrendingUp,
  Award,
  Target,
  Compass,
  Sun,
  Moon,
  CloudRain,
  Mountain,
  Plane,
  ArrowRight,
  BarChart3,
  Briefcase,
  Coffee,
  Music,
  Palette,
  Shield,
  Wifi,
  ChevronRight,
  Play,
  MessageCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import EnhancedWeather from './EnhanceWeather';
import CurrencyConverter from './CurrencyConverter';
import LanguageTranslator from './LanguageTranslator';
import AdvancedAIChatbot from './AIChatbot';
import { travelService } from '../services/travelService';
import type { Trip } from '../types/Trip';

interface SavedTrip {
  _id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  travelers: number;
  duration: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  savedAt: string;
  totalCost: number;
  itinerary: Array<{
    day: number;
    theme: string;
    activities: any[];
  }>;
  title?: string;
}

const EnhancedDashboard: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWidget, setActiveWidget] = useState<'weather' | 'currency' | 'translator' | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalExpenses: 0,
    upcomingTrips: 0,
    totalSavings: 0,
    aiInteractions: 156,
    storiesGenerated: 23,
    moodTracked: 89,
    predictionsAccuracy: 94
  });

  useEffect(() => {
    fetchDashboardData();
    loadSavedTrips();
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tripsResponse] = await Promise.all([
        travelService.getTrips()
      ]);

      if (tripsResponse) {
        const normalizedTrips = tripsResponse.map((trip: any) => ({
          ...trip,
          startDate: typeof trip.startDate === 'string' ? trip.startDate : trip.startDate?.toISOString?.() ?? '',
          endDate: typeof trip.endDate === 'string' ? trip.endDate : trip.endDate?.toISOString?.() ?? '',
        }));
        setTrips(normalizedTrips);
        calculateStats(normalizedTrips);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTrips = () => {
    try {
      const trips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const sortedTrips = trips.sort((a: SavedTrip, b: SavedTrip) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
      setSavedTrips(sortedTrips);
    } catch (error) {
      console.error('Error loading saved trips:', error);
    }
  };

  const calculateStats = (apiTrips: Trip[]) => {
    const savedTripsData = JSON.parse(localStorage.getItem('savedTrips') || '[]');
    
    const totalApiExpenses = apiTrips.reduce((sum: number, trip: any) => 
      sum + (trip.totalExpenses || 0), 0
    );
    const totalSavedBudget = savedTripsData.reduce((sum: number, trip: SavedTrip) => 
      sum + (trip.budget || 0), 0
    );

    const upcomingApiTrips = apiTrips.filter((trip: any) => 
      new Date(trip.startDate) > new Date()
    ).length;
    const upcomingSavedTrips = savedTripsData.filter((trip: SavedTrip) => 
      new Date(trip.startDate) > new Date() && trip.status === 'planned'
    ).length;

    setStats(prev => ({
      ...prev,
      totalTrips: apiTrips.length + savedTripsData.length,
      totalExpenses: totalApiExpenses + totalSavedBudget,
      upcomingTrips: upcomingApiTrips + upcomingSavedTrips,
      totalSavings: Math.floor((totalApiExpenses + totalSavedBudget) * 0.15)
    }));
  };

  const viewTripDetails = (trip: SavedTrip) => {
    localStorage.setItem('currentTripData', JSON.stringify(trip));
    navigate(`/trip/dashboard/${trip._id}`);
  };

  const cancelTrip = async (trip: SavedTrip) => {
    try {
      const updatedTrips = savedTrips.map(t => 
        t._id === trip._id ? { ...t, status: 'cancelled' as const } : t
      );
      
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
      setSavedTrips(updatedTrips);
      setSelectedTrip(null);
      setShowDeleteModal(false);
      
      toast.success(`Trip to ${trip.destination} cancelled successfully`);
      calculateStats(trips);
    } catch (error) {
      console.error('Error cancelling trip:', error);
      toast.error('Failed to cancel trip');
    }
  };

  const deleteTrip = async (trip: SavedTrip) => {
    try {
      const updatedTrips = savedTrips.filter(t => t._id !== trip._id);
      
      localStorage.setItem('savedTrips', JSON.stringify(updatedTrips));
      setSavedTrips(updatedTrips);
      setSelectedTrip(null);
      setShowDeleteModal(false);
      
      toast.success(`Trip to ${trip.destination} deleted successfully`);
      calculateStats(trips);
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast.error('Failed to delete trip');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return <Calendar className="w-4 h-4" />;
      case 'active': return <Navigation className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const calculateDaysRemaining = (startDate: string) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return { text: 'Good night', icon: <Moon className="w-6 h-6" />, gradient: 'from-indigo-600 to-purple-600' };
    if (hour < 12) return { text: 'Good morning', icon: <Sun className="w-6 h-6" />, gradient: 'from-yellow-400 to-orange-500' };
    if (hour < 18) return { text: 'Good afternoon', icon: <Sun className="w-6 h-6" />, gradient: 'from-blue-400 to-cyan-500' };
    return { text: 'Good evening', icon: <Moon className="w-6 h-6" />, gradient: 'from-purple-600 to-pink-600' };
  };

  const aiFeatures = [
    {
      title: 'AI Trip Creator',
      description: 'Complete AI-powered trip planning from scratch',
      icon: '🚀',
      gradient: 'from-blue-500 to-purple-600',
      action: () => navigate('/trip-creator'),
      badge: 'CREATOR',
      stats: 'Full planning'
    },
    {
      title: 'AI Dynamic Trip Planner',
      description: 'Intelligent real-time trip optimization',
      icon: '🧠',
      gradient: 'from-purple-500 to-indigo-600',
      action: () => navigate('/dynamic-planner'),
      badge: 'SMART',
      stats: '98% accuracy'
    },
    {
      title: 'AI Travel Companion',
      description: 'Voice-enabled 24/7 travel assistant',
      icon: '🎤',
      gradient: 'from-pink-500 to-purple-600',
      action: () => navigate('/ai-companion'),
      badge: 'VOICE AI',
      stats: '24/7 support'
    },
    {
      title: 'Multi-Modal AI Assistant',
      description: 'Advanced AI with vision & voice capabilities',
      icon: '🤖',
      gradient: 'from-cyan-500 to-blue-600',
      action: () => navigate('/multimodal-ai'),
      badge: 'GPT-4V',
      stats: 'Vision + Voice'
    },
    {
      title: 'Adaptive AI Companion',
      description: 'Learns your preferences over time',
      icon: '✨',
      gradient: 'from-emerald-500 to-teal-600',
      action: () => navigate('/adaptive-ai'),
      badge: 'LEARNING',
      stats: '94% personalized'
    },
    {
      title: 'AI Mood & Story Generator',
      description: 'Emotional travel journaling with AI',
      icon: '💭',
      gradient: 'from-rose-500 to-pink-600',
      action: () => navigate('/ai-mood-story'),
      badge: 'EMOTIONAL AI',
      stats: '23 stories'
    },
    {
      title: 'AI Finance Tracker',
      description: 'Intelligent expense management',
      icon: '💰',
      gradient: 'from-green-500 to-emerald-600',
      action: () => navigate('/ai-finance'),
      badge: 'FINANCIAL AI',
      stats: '$1,234 saved'
    },
    {
      title: 'Predictive Travel Analytics',
      description: 'Market insights & trend predictions',
      icon: '📊',
      gradient: 'from-violet-500 to-purple-600',
      action: () => navigate('/predictive-analytics'),
      badge: 'PREDICTIVE',
      stats: '89% accurate'
    },
    {
      title: 'Smart Packing Assistant',
      description: 'AI-driven packing optimization',
      icon: '🎒',
      gradient: 'from-orange-500 to-red-600',
      action: () => navigate('/smart-packing'),
      badge: 'SMART PACK',
      stats: '15% lighter'
    },
    {
      title: 'LLM Review Analyzer',
      description: 'AI-powered sentiment analysis',
      icon: '📝',
      gradient: 'from-blue-500 to-indigo-600',
      action: () => navigate('/review-analyzer'),
      badge: 'NLP',
      stats: '96% sentiment'
    },
    {
      title: 'Predictive Insights',
      description: 'Future travel predictions & recommendations',
      icon: '🔮',
      gradient: 'from-teal-500 to-cyan-600',
      action: () => navigate('/predictive-insights'),
      badge: 'FUTURE AI',
      stats: '92% precision'
    }
  ];

  const explorationFeatures = [
    {
      title: '3D Interactive World Map',
      description: 'Explore destinations in immersive 3D',
      icon: '🌍',
      gradient: 'from-blue-500 to-green-500',
      action: () => navigate('/world-map'),
      badge: '3D',
      interactive: true
    },
    {
      title: 'AR Location Discovery',
      description: 'Augmented reality exploration',
      icon: '📱',
      gradient: 'from-purple-500 to-pink-500',
      action: () => navigate('/ar-discovery'),
      badge: 'AR',
      interactive: true
    },
    {
      title: 'Social Travel Network',
      description: 'Connect with fellow travelers',
      icon: '👥',
      gradient: 'from-indigo-500 to-purple-500',
      action: () => navigate('/social-network'),
      badge: 'SOCIAL',
      interactive: true
    },
    {
      title: 'Smart Reminders & Calendar',
      description: 'Never miss important travel moments',
      icon: '🔔',
      gradient: 'from-yellow-500 to-orange-500',
      action: () => navigate('/smart-reminders'),
      badge: 'SMART',
      interactive: true
    }
  ];

  const travelWidgets = [
    {
      id: 'weather',
      title: 'Weather & Climate',
      icon: '🌤',
      component: <EnhancedWeather />,
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      id: 'currency',
      title: 'Currency Exchange',
      icon: '💱',
      component: <CurrencyConverter />,
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      id: 'translator',
      title: 'Language Translator',
      icon: '🗣',
      component: <LanguageTranslator />,
      gradient: 'from-purple-400 to-pink-500'
    }
  ];

  const allTrips = [
    ...savedTrips.map(trip => ({
      ...trip,
      isFromLocalStorage: true
    })),
    ...trips.map(trip => ({
      ...trip,
      isFromLocalStorage: false,
      status: trip.status || 'planned'
    }))
  ].sort((a, b) => {
    const aDate = new Date((a as any).savedAt || (a as any).createdAt || a.startDate);
    const bDate = new Date((b as any).savedAt || (b as any).createdAt || b.startDate);
    return bDate.getTime() - aDate.getTime();
  });

  const greeting = getTimeGreeting();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-4 animate-pulse"></div>
            <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto animate-ping opacity-20"></div>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Loading your travel universe...
          </h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className={`bg-gradient-to-br ${greeting.gradient} text-white`}>
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white bg-opacity-10 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full blur-xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white bg-opacity-5 rounded-full blur-2xl"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center mb-4"
                >
                  {greeting.icon}
                  <span className="ml-3 text-lg opacity-90">{greeting.text}</span>
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-bold mb-4"
                >
                  Welcome back, {state.user?.firstName}! ✨
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-xl opacity-90 mb-8"
                >
                  Your AI-powered travel companion is ready to make your next adventure extraordinary
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex space-x-4"
                >
                  <Button 
                    onClick={() => navigate('/dynamic-planner')}
                    className="bg-white text-gray-800 hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Plan with AI
                  </Button>
                  <Button 
                    onClick={() => navigate('/multimodal-ai')}
                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-800 transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Explore AI Features
                  </Button>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="text-8xl mb-4 animate-bounce">🌟</div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-3xl font-bold">{stats.totalTrips}</div>
                      <div className="text-sm opacity-80">Trips Planned</div>
                    </div>
                    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
                      <div className="text-3xl font-bold">{stats.aiInteractions}</div>
                      <div className="text-sm opacity-80">AI Interactions</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {[
            { 
              title: 'Total Trips', 
              value: stats.totalTrips, 
              icon: <Globe className="w-8 h-8" />, 
              gradient: 'from-blue-500 to-cyan-500',
              suffix: '',
              trend: '+12%'
            },
            { 
              title: 'AI Interactions', 
              value: stats.aiInteractions, 
              icon: <Brain className="w-8 h-8" />, 
              gradient: 'from-purple-500 to-pink-500',
              suffix: '',
              trend: '+28%'
            },
            { 
              title: 'Money Saved', 
              value: stats.totalSavings, 
              icon: <DollarSign className="w-8 h-8" />, 
              gradient: 'from-green-500 to-emerald-500',
              suffix: '$',
              trend: '+15%'
            },
            { 
              title: 'Prediction Accuracy', 
              value: stats.predictionsAccuracy, 
              icon: <Target className="w-8 h-8" />, 
              gradient: 'from-orange-500 to-red-500',
              suffix: '%',
              trend: '+3%'
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="relative group"
            >
              <div className={`bg-gradient-to-br ${stat.gradient} p-6 rounded-2xl text-white shadow-xl overflow-hidden relative`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white bg-opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full transform -translate-x-4 translate-y-4"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                      {stat.icon}
                    </div>
                    <div className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded-full">
                      {stat.trend}
                    </div>
                  </div>
                  
                  <div className="text-3xl font-bold mb-1">
                    {stat.suffix === '$' && stat.suffix}{stat.value}{stat.suffix !== '$' && stat.suffix}
                  </div>
                  <div className="text-sm opacity-90">{stat.title}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* AI Features Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                🤖 AI-Powered Features
              </h2>
              <p className="text-gray-600">Experience the future of travel with artificial intelligence</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
            >
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.slice(0, 6).map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                onClick={feature.action}
                className="group cursor-pointer relative"
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full transform translate-x-12 -translate-y-12 opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`text-4xl p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}>
                        {feature.icon}
                      </div>
                      <div className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                        {feature.badge}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">{feature.stats}</span>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="text-purple-500 group-hover:text-purple-700"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Exploration Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🌍 Exploration & Discovery
              </h2>
              <p className="text-gray-600">Immersive tools to discover and connect with the world</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {explorationFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, rotate: 1 }}
                onClick={feature.action}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 h-full">
                  <div className={`text-4xl p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg mb-4 inline-block`}>
                    {feature.icon}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-800 group-hover:text-blue-600 transition-colors text-sm">
                        {feature.title}
                      </h3>
                      <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {feature.badge}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Travel Widgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              🛠 Travel Tools
            </h2>
            <div className="flex space-x-2">
              {travelWidgets.map((widget) => (
                <motion.button
                  key={widget.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveWidget(activeWidget === widget.id ? null : widget.id as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    activeWidget === widget.id
                      ? `bg-gradient-to-r ${widget.gradient} text-white shadow-lg`
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {widget.icon} {widget.title}
                </motion.button>
              ))}
            </div>
          </div>

          <AnimatePresence>
            {activeWidget && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  {travelWidgets.find(w => w.id === activeWidget)?.component}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Trips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                ✈️ Your Travel Journey
              </h2>
              <p className="text-gray-600">
                {allTrips.length > 0 
                  ? `Managing ${allTrips.length} trip${allTrips.length > 1 ? 's' : ''} with AI assistance`
                  : 'Start your AI-powered travel adventure'
                }
              </p>
            </div>
            <Button 
              onClick={() => navigate('/dynamic-planner')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
            >
              <Plane className="w-5 h-5 mr-2" />
              Plan New Trip
            </Button>
          </div>

          {allTrips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {allTrips.slice(0, 6).map((trip: any, index) => {
                  const daysRemaining = calculateDaysRemaining(trip.startDate);
                  const isLocalTrip = trip.isFromLocalStorage;
                  
                  return (
                    <motion.div
                      key={trip._id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      className="group cursor-pointer"
                    >
                      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300">
                        {/* Trip Header Image */}
                        <div className={`h-48 relative ${
                          isLocalTrip 
                            ? 'bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-500' 
                            : 'bg-gradient-to-br from-blue-400 via-cyan-400 to-teal-500'
                        }`}>
                          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                          <div className="absolute inset-0 flex items-center justify-center text-white text-6xl">
                            {isLocalTrip ? '🤖' : '🏖️'}
                          </div>
                          
                          {/* Badges */}
                          <div className="absolute top-4 left-4">
                            {isLocalTrip && (
                              <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium mb-2">
                                AI Planned
                              </div>
                            )}
                          </div>
                          
                          <div className="absolute top-4 right-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(trip.status)}`}>
                              {getStatusIcon(trip.status)}
                              <span>{trip.status.toUpperCase()}</span>
                            </div>
                          </div>

                          {daysRemaining > 0 && trip.status === 'planned' && (
                            <div className="absolute bottom-4 left-4 bg-white bg-opacity-20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                              {daysRemaining} days to go
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6">
                          <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-purple-600 transition-colors">
                            {trip.title || trip.destination}
                          </h3>
                          
                          {trip.destination && trip.title && (
                            <p className="text-gray-600 text-sm mb-3 flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {trip.destination}
                            </p>
                          )}
                          
                          <div className="space-y-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                              <span>{new Date(trip.startDate).toLocaleDateString()}</span>
                              {trip.endDate && <span> - {new Date(trip.endDate).toLocaleDateString()}</span>}
                            </div>
                            
                            {(trip.budget || trip.totalExpenses) && (
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                                <span>${trip.budget || trip.totalExpenses || 0}</span>
                              </div>
                            )}

                            {trip.travelers && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Users className="w-4 h-4 mr-2 text-purple-500" />
                                <span>{trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* AI Trip Preview */}
                          {isLocalTrip && trip.itinerary && trip.itinerary.length > 0 && (
                            <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                              <p className="text-xs font-medium text-purple-700 mb-2">AI ITINERARY</p>
                              <div className="space-y-1">
                                {trip.itinerary.slice(0, 2).map((day: any, i: number) => (
                                  <div key={i} className="flex items-center text-xs text-gray-600">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                                    <span className="truncate">Day {day.day}: {day.theme}</span>
                                  </div>
                                ))}
                                {trip.itinerary.length > 2 && (
                                  <div className="text-xs text-purple-600 font-medium">
                                    +{trip.itinerary.length - 2} more days...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-2 mt-6">
                            {isLocalTrip ? (
                              <>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewTripDetails(trip);
                                  }}
                                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all text-sm shadow-lg"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </motion.button>
                                
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTrip(trip);
                                    setShowDeleteModal(true);
                                  }}
                                  className="flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all text-sm"
                                >
                                  <Settings className="w-4 h-4" />
                                </motion.button>
                              </>
                            ) : (
                              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2 flex items-center justify-center">
                                View Details <ArrowRight className="w-4 h-4 ml-1" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md mx-auto">
                <div className="text-6xl mb-6">🌟</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready for Adventure?</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Let our AI create personalized travel experiences tailored just for you
                </p>
                <Button 
                  onClick={() => navigate('/dynamic-planner')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start AI Trip Planning
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* AI Insights Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white bg-opacity-10 rounded-full transform translate-x-20 -translate-y-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white bg-opacity-10 rounded-full transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">🧠 AI Travel Intelligence</h2>
                <p className="text-lg opacity-90 mb-6">
                  Our advanced AI has analyzed your travel patterns and preferences to provide personalized insights
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-2xl font-bold">{stats.storiesGenerated}</div>
                    <div className="text-sm opacity-80">Stories Created</div>
                  </div>
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4">
                    <div className="text-2xl font-bold">{stats.moodTracked}</div>
                    <div className="text-sm opacity-80">Moods Tracked</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/ai-mood-story')}
                  className="w-full bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 text-left hover:bg-opacity-30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Capture Travel Emotions</h3>
                      <p className="text-sm opacity-80">Turn feelings into beautiful stories</p>
                    </div>
                    <Heart className="w-6 h-6" />
                  </div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate('/predictive-analytics')}
                  className="w-full bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 text-left hover:bg-opacity-30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">Predictive Insights</h3>
                      <p className="text-sm opacity-80">AI-powered travel predictions</p>
                    </div>
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trip Management Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedTrip && (
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
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Manage Trip to {selectedTrip.destination}
                </h3>
                
                <p className="text-gray-600 mb-8">
                  What would you like to do with this AI-planned trip?
                </p>

                <div className="space-y-3">
                  {selectedTrip.status === 'planned' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => cancelTrip(selectedTrip)}
                      className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300 shadow-lg"
                    >
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Cancel Trip
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => deleteTrip(selectedTrip)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-xl hover:from-red-500 hover:to-pink-600 transition-all duration-300 shadow-lg"
                  >
                    <Trash2 className="w-5 h-5 mr-2" />
                    Delete Trip
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedTrip(null);
                    }}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300"
                  >
                    Keep Trip
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Assistant */}
      <AdvancedAIChatbot />
    </div>
  );
};

export default EnhancedDashboard;