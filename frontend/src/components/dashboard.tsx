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
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import EnhancedWeather from './EnhanceWeather';
import CurrencyConverter from './CurrencyConverter';
import LanguageTranslator from './LanguageTranslator';
import AdvancedAIChatbot from './AIChatbot';
import { travelService } from '../services/travelService';
// Import Trip type from the appropriate location, adjust the path as needed
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

const Dashboard: React.FC = () => {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWidget, setActiveWidget] = useState<'weather' | 'currency' | 'translator' | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<SavedTrip | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalExpenses: 0,
    upcomingTrips: 0,
    totalSavings: 0
  });

  useEffect(() => {
    fetchDashboardData();
    loadSavedTrips();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [tripsResponse] = await Promise.all([
        travelService.getTrips()
      ]);

      if (tripsResponse) {
        // Ensure all date fields are strings
        const normalizedTrips = tripsResponse.map((trip: any) => ({
          ...trip,
          startDate: typeof trip.startDate === 'string' ? trip.startDate : trip.startDate?.toISOString?.() ?? '',
          endDate: typeof trip.endDate === 'string' ? trip.endDate : trip.endDate?.toISOString?.() ?? '',
        }));
        setTrips(normalizedTrips);

        // Calculate stats from both API trips and saved trips
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
    
    // Combine stats from both sources
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

    setStats({
      totalTrips: apiTrips.length + savedTripsData.length,
      totalExpenses: totalApiExpenses + totalSavedBudget,
      upcomingTrips: upcomingApiTrips + upcomingSavedTrips,
      totalSavings: Math.floor((totalApiExpenses + totalSavedBudget) * 0.15) // Mock savings calculation
    });
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

  const quickActions = [
    {
      title: 'Plan New Trip',
      description: 'AI-powered trip planning',
      icon: '✈',
      color: 'bg-blue-500',
      action: () => navigate('/trip-planner')
    },
    {
      title: 'AI Travel Companion',
      description: 'Voice-enabled travel assistant',
      icon: '🎤',
      color: 'bg-purple-500',
      action: () => navigate('/ai-companion')
    },
    {
      title: 'Dynamic Trip Optimizer',
      description: 'Real-time AI optimization',
      icon: '🧠',
      color: 'bg-indigo-500',
      action: () => navigate('/dynamic-planner')
    },
    {
      title: 'LLM Review Analyzer',
      description: 'AI-powered sentiment analysis',
      icon: '📊',
      color: 'bg-teal-500',
      action: () => navigate('/review-analyzer')
    },
    {
      title: '3D Interactive World Map',
      description: 'Explore your travels in 3D',
      icon: '🌍',
      color: 'bg-emerald-500',
      action: () => navigate('/world-map')
    },
    {
      title: 'Smart Reminders & Calendar',
      description: 'AI-powered travel reminders',
      icon: '🔔',
      color: 'bg-rose-500',
      action: () => navigate('/smart-reminders')
    },
    {
      title: 'AR Location Discovery',
      description: 'Augmented reality exploration',
      icon: '📱',
      color: 'bg-orange-500',
      action: () => navigate('/ar-discovery')
    },
    {
      title: 'Social Travel Network',
      description: 'Connect with fellow travelers',
      icon: '👥',
      color: 'bg-purple-500',
      action: () => navigate('/social-network')
    },
    {
      title: 'Predictive Travel Analytics',
      description: 'AI-powered market insights',
      icon: '📈',
      color: 'bg-violet-500',
      action: () => navigate('/predictive-analytics')
    },
    {
      title: 'Multi-Modal AI Assistant',
      description: 'Advanced AI with vision & voice',
      icon: '🤖',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      action: () => navigate('/multimodal-ai')
    },
    {
      title: 'Adaptive AI Companion',
      description: 'Hyper-personalized AI that learns your preferences',
      icon: '✨',
      color: 'bg-gradient-to-r from-indigo-500 to-purple-500',
      action: () => navigate('/adaptive-ai')
    },
    {
      title: 'AI Mood & Story Generator',
      description: 'Capture emotions & create travel stories',
      icon: '✨💭',
      color: 'bg-gradient-to-r from-pink-500 to-purple-500',
      action: () => navigate('/ai-mood-story')
    },
    {
      title: 'Book Flights',
      description: 'Search & compare flights',
      icon: '🛫',
      color: 'bg-green-500',
      action: () => navigate('/booking')
    },
    {
      title: 'Find Hotels',
      description: 'Best accommodation deals',
      icon: '🏨',
      color: 'bg-red-500',
      action: () => navigate('/booking')
    },
    {
      title: 'AI Finance Tracker',
      description: 'Intelligent expense management with AI insights',
      icon: '🧠💰',
      color: 'bg-gradient-to-r from-green-500 to-emerald-500',
      action: () => navigate('/ai-finance')
    },
    {
      title: 'Predictive Travel Insights',
      description: 'AI-powered travel predictions & analytics',
      icon: '📊🔮',
      color: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      action: () => navigate('/predictive-insights')
    },
    {
      title: 'Smart Packing Assistant',
      description: 'AI-driven packing recommendations & optimization',
      icon: '🧠🎒',
      color: 'bg-gradient-to-r from-teal-500 to-cyan-500',
      action: () => navigate('/smart-packing')
    },
    {
      title: 'Weather Forecast',
      description: 'Check destination weather',
      icon: '🌤',
      color: 'bg-teal-500',
      action: () => setActiveWidget('weather')
    }
  ];

  const travelWidgets = [
    {
      id: 'weather',
      title: 'Weather & Travel Conditions',
      icon: '🌤',
      component: <EnhancedWeather />
    },
    {
      id: 'currency',
      title: 'Currency Converter',
      icon: '💱',
      component: <CurrencyConverter />
    },
    {
      id: 'translator',
      title: 'Language Translator',
      icon: '🗣',
      component: <LanguageTranslator />
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Combine trips for display
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

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Floating Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: [
                'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
                'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
                'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
                'radial-gradient(circle, rgba(251, 191, 36, 0.15) 0%, transparent 70%)',
              ][i % 4]
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          />
        ))}
      </div>

      {/* Hero Welcome Section with Enhanced Parallax */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%']
            }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Animated Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {['✈️', '🌍', '🎒', '📸', '🗺️', '⛰️', '🏖️', '🎨'].map((emoji, i) => (
            <motion.div
              key={i}
              className="absolute text-4xl md:text-6xl opacity-20"
              style={{
                left: `${(i * 12.5)}%`,
                top: `${20 + (i % 3) * 20}%`
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 20, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 10 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>

        <div className="container-custom relative z-10 py-20 md:py-24">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-center"
          >
            {/* Animated Welcome Icon */}
            <motion.div
              className="inline-block mb-6"
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="text-8xl md:text-9xl relative">
                <motion.span
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(255,255,255,0.5)',
                      '0 0 40px rgba(255,255,255,0.8)',
                      '0 0 20px rgba(255,255,255,0.5)'
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ✈️
                </motion.span>
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-extrabold mb-4 tracking-tight"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <span className="block mb-2">{getGreeting()},</span>
              <motion.span 
                className="block bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200"
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 5, repeat: Infinity }}
                style={{
                  backgroundSize: '200% 200%'
                }}
              >
                {state.user?.firstName}
              </motion.span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-3xl text-blue-100 mb-8 font-light max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              The world is your canvas. Let's paint it with unforgettable memories! 🌍✨
            </motion.p>
            
            {/* Enhanced Quick Stats Bar */}
            <motion.div 
              className="flex flex-wrap justify-center gap-6 md:gap-10 mt-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {[
                { value: stats.totalTrips, label: 'Adventures', icon: '🗺️', gradient: 'from-blue-400 to-cyan-400' },
                { value: stats.upcomingTrips, label: 'Upcoming', icon: '🎒', gradient: 'from-green-400 to-emerald-400' },
                { value: `$${stats.totalExpenses}`, label: 'Invested', icon: '💳', gradient: 'from-purple-400 to-pink-400' },
                { value: `$${stats.totalSavings}`, label: 'Saved', icon: '💰', gradient: 'from-yellow-400 to-orange-400' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ scale: 1.15, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative group"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + i * 0.1, type: "spring" }}
                >
                  <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white border-opacity-30 shadow-2xl hover:shadow-3xl transition-all duration-300">
                    <motion.div
                      className="text-4xl mb-3"
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    >
                      {stat.icon}
                    </motion.div>
                    <motion.div 
                      className="text-4xl md:text-5xl font-extrabold text-white mb-2"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm md:text-base text-blue-100 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                  {/* Glow effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-30 blur-xl rounded-2xl transition-opacity duration-300`} />
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className="mt-12"
            >
              <motion.button
                whileHover={{ scale: 1.1, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/trip-planner')}
                className="inline-flex items-center px-10 py-5 bg-white text-purple-600 rounded-full text-lg md:text-xl font-bold shadow-2xl hover:bg-gradient-to-r hover:from-yellow-300 hover:to-pink-300 hover:text-purple-700 transition-all duration-300 group"
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mr-3 text-2xl"
                >
                  ✨
                </motion.span>
                Plan Your Next Adventure
                <motion.span 
                  className="ml-3 group-hover:ml-5 transition-all"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Enhanced Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-16 md:h-24">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(239 246 255)" />
                <stop offset="50%" stopColor="rgb(243 232 255)" />
                <stop offset="100%" stopColor="rgb(252 231 243)" />
              </linearGradient>
            </defs>
            <motion.path 
              fill="url(#waveGradient)"
              d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
              animate={{
                d: [
                  "M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z",
                  "M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,74.7C672,75,768,53,864,42.7C960,32,1056,32,1152,37.3C1248,43,1344,53,1392,58.7L1440,64L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z",
                  "M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
                ]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </svg>
        </div>
      </motion.div>

      <div className="container-custom py-12 space-y-12 relative z-10">

      {/* Ultra-Enhanced Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 -mt-24 relative z-20"
      >
        {[
          { 
            value: stats.totalTrips, 
            label: 'Total Adventures', 
            sublabel: 'Your journey so far',
            icon: '🗺️', 
            gradient: 'from-blue-500 via-cyan-500 to-teal-500',
            borderColor: 'border-blue-400',
            shadowColor: 'shadow-blue-500/50',
            animation: { rotate: [0, 360] },
            duration: 20
          },
          { 
            value: stats.upcomingTrips, 
            label: 'Upcoming Trips', 
            sublabel: 'Ready for adventure',
            icon: '🎒', 
            gradient: 'from-green-500 via-emerald-500 to-teal-500',
            borderColor: 'border-green-400',
            shadowColor: 'shadow-green-500/50',
            animation: { y: [0, -15, 0] },
            duration: 2
          },
          { 
            value: `$${stats.totalExpenses}`, 
            label: 'Total Invested', 
            sublabel: 'Memories created',
            icon: '💳', 
            gradient: 'from-purple-500 via-pink-500 to-rose-500',
            borderColor: 'border-purple-400',
            shadowColor: 'shadow-purple-500/50',
            animation: { scale: [1, 1.15, 1] },
            duration: 2.5
          },
          { 
            value: `$${stats.totalSavings}`, 
            label: 'Smart Savings', 
            sublabel: 'Optimized spending',
            icon: '💰', 
            gradient: 'from-yellow-500 via-orange-500 to-red-500',
            borderColor: 'border-yellow-400',
            shadowColor: 'shadow-yellow-500/50',
            animation: { rotate: [0, 15, -15, 0] },
            duration: 3
          }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6 + index * 0.1, type: "spring", stiffness: 200 }}
            whileHover={{ 
              scale: 1.08, 
              y: -15,
              rotateY: 5,
              transition: { type: "spring", stiffness: 300 }
            }}
            className="group relative"
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-20 blur-2xl rounded-3xl transition-all duration-500`} />
            
            {/* Card */}
            <div className={`relative bg-white rounded-3xl shadow-2xl ${stat.shadowColor} hover:shadow-3xl transition-all duration-300 overflow-hidden border-2 ${stat.borderColor}`}>
              {/* Animated Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <motion.div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `radial-gradient(circle at 20% 50%, currentColor 1px, transparent 1px), radial-gradient(circle at 80% 80%, currentColor 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }}
                  animate={{
                    backgroundPosition: ['0px 0px', '20px 20px']
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>

              <div className="relative p-8 text-center">
                {/* Icon */}
                <motion.div
                  animate={stat.animation}
                  transition={{ 
                    duration: stat.duration, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                  className={`relative w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${stat.gradient} rounded-2xl flex items-center justify-center text-4xl shadow-xl group-hover:shadow-2xl transition-shadow`}
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity" />
                  {stat.icon}
                </motion.div>

                {/* Value */}
                <motion.div 
                  className={`text-5xl font-extrabold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-3`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                >
                  {stat.value}
                </motion.div>

                {/* Label */}
                <div className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">
                  {stat.label}
                </div>

                {/* Sublabel */}
                <div className={`text-xs bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent font-semibold`}>
                  {stat.sublabel}
                </div>

                {/* Progress Bar Effect */}
                <motion.div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Ultra-Enhanced Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="relative"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
            className="inline-block"
          >
            <motion.h2 
              className="text-5xl font-extrabold mb-4 relative inline-block"
              animate={{
                textShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.3)',
                  '0 0 40px rgba(236, 72, 153, 0.3)',
                  '0 0 20px rgba(139, 92, 246, 0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                🚀 Explore Features
              </span>
              {/* Decorative Line */}
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full"
                animate={{
                  scaleX: [0.5, 1, 0.5],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.h2>
          </motion.div>
          <motion.p 
            className="text-xl text-gray-600 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Discover AI-powered tools to elevate your travel experience to new heights ✨
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ 
                delay: 0.9 + index * 0.05,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              whileHover={{ 
                scale: 1.06, 
                y: -12,
                rotateY: 2,
                transition: { type: "spring", stiffness: 400, damping: 10 }
              }}
              onClick={action.action}
              className="group relative cursor-pointer"
            >
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-0 group-hover:opacity-30 blur-lg transition-all duration-500" />
              
              {/* Card Container */}
              <div className="relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 group-hover:border-purple-200">
                {/* Gradient Background on Hover */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  initial={false}
                />
                
                {/* Animated Pattern Overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500">
                  <motion.div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                    animate={{
                      backgroundPosition: ['0px 0px', '60px 60px']
                    }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                </div>

                <div className="relative p-7">
                  {/* Icon Container */}
                  <div className="flex items-start space-x-5 mb-4">
                    <motion.div
                      whileHover={{ 
                        rotate: [0, -15, 15, -10, 10, 0],
                        scale: 1.2
                      }}
                      transition={{ duration: 0.6 }}
                      className={`relative w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg flex-shrink-0 group-hover:shadow-2xl transition-shadow`}
                    >
                      {/* Icon Glow */}
                      <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity" />
                      <span className="relative z-10">{action.icon}</span>
                      
                      {/* Pulse Ring */}
                      <motion.div
                        className={`absolute inset-0 ${action.color} rounded-2xl opacity-0 group-hover:opacity-75`}
                        animate={{
                          scale: [1, 1.5, 1.5],
                          opacity: [0.75, 0, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                      />
                    </motion.div>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:bg-clip-text transition-all duration-300">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom Bar with Arrow */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 group-hover:border-purple-200 transition-colors">
                    <span className="text-xs font-semibold text-gray-400 group-hover:text-purple-600 transition-colors uppercase tracking-wider">
                      Explore Now
                    </span>
                    <motion.div
                      className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-shadow"
                      animate={{
                        x: [0, 5, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </div>
                </div>

                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-40"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                    ease: "easeInOut"
                  }}
                  style={{
                    transform: 'skewX(-20deg)'
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Travel Widgets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="bg-white rounded-3xl shadow-xl p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">🛠️ Travel Tools</h2>
            <p className="text-gray-600">Essential utilities for your journey</p>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
            {travelWidgets.map((widget) => (
              <motion.button
                key={widget.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveWidget(activeWidget === widget.id ? null : widget.id as any)}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  activeWidget === widget.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                <span className="mr-2">{widget.icon}</span>
                {widget.title}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Active Widget */}
        <AnimatePresence>
          {activeWidget && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl">
                {travelWidgets.find(w => w.id === activeWidget)?.component}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Enhanced Trips Section - Shows both API and saved trips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Your Trips ({allTrips.length})
            {savedTrips.length > 0 && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                • {savedTrips.length} AI-planned trips
              </span>
            )}
          </h2>
          <Button onClick={() => navigate('/trip-planner')}>
            Plan New Trip
          </Button>
        </div>

        {allTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {allTrips.slice(0, 9).map((trip: any, index) => {
                const daysRemaining = calculateDaysRemaining(trip.startDate);
                const isLocalTrip = trip.isFromLocalStorage;
                
                return (
                  <motion.div
                    key={trip._id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    className="card hover:shadow-lg transition-shadow relative group"
                  >
                    {/* Trip Visual */}
                    <div className={`h-48 ${
                      isLocalTrip 
                        ? 'bg-gradient-to-br from-indigo-400 to-purple-500' 
                        : 'bg-gradient-to-br from-blue-400 to-purple-500'
                    } rounded-t-lg flex items-center justify-center text-white text-4xl relative`}>
                      {isLocalTrip ? '🤖' : '🏖'}
                      
                      {/* AI Badge for locally saved trips */}
                      {isLocalTrip && (
                        <div className="absolute top-2 left-2 bg-white bg-opacity-20 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium">
                          AI Planned
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(trip.status)}`}>
                        {getStatusIcon(trip.status)}
                        <span>{trip.status.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-indigo-500" />
                        {trip.title || trip.destination}
                      </h3>
                      
                      {trip.destination && trip.title && (
                        <p className="text-gray-600 text-sm mb-2">📍 {trip.destination}</p>
                      )}
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(trip.startDate).toLocaleDateString()}
                          {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
                        </div>
                        
                        {(trip.budget || trip.totalExpenses) && (
                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="w-4 h-4 mr-2" />
                            ${trip.budget || trip.totalExpenses || 0}
                          </div>
                        )}

                        {trip.travelers && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2" />
                            {trip.travelers} traveler{trip.travelers > 1 ? 's' : ''}
                          </div>
                        )}

                        {daysRemaining > 0 && trip.status === 'planned' && (
                          <div className="flex items-center text-sm text-green-600">
                            <Clock className="w-4 h-4 mr-2" />
                            {daysRemaining} days remaining
                          </div>
                        )}
                      </div>

                      {/* Trip Preview for AI-planned trips */}
                      {isLocalTrip && trip.itinerary && trip.itinerary.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-2">ITINERARY PREVIEW</p>
                          <div className="space-y-1">
                            {trip.itinerary.slice(0, 2).map((day: any, i: number) => (
                              <div key={i} className="text-sm text-gray-600 flex items-center">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                                <span className="truncate">Day {day.day}: {day.theme}</span>
                              </div>
                            ))}
                            {trip.itinerary.length > 2 && (
                              <div className="text-sm text-gray-500 flex items-center">
                                <div className="w-2 h-2 bg-gray-300 rounded-full mr-2"></div>
                                <span>+{trip.itinerary.length - 2} more days...</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        {isLocalTrip ? (
                          <>
                            <button
                              onClick={() => viewTripDetails(trip)}
                              className="flex-1 flex items-center justify-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </button>
                            
                            {trip.status === 'planned' && (
                              <button
                                onClick={() => navigate(`/trip/map/${trip._id}`)}
                                className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                <Navigation className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedTrip(trip);
                                setShowDeleteModal(true);
                              }}
                              className="flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
                            View Details →
                          </button>
                        )}
                      </div>

                      {/* Saved Date for AI-planned trips */}
                      {isLocalTrip && trip.savedAt && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400">
                            AI Planned: {new Date(trip.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips planned yet</h3>
            <p className="text-gray-600 mb-6">Start planning your next adventure with AI!</p>
            <Button onClick={() => navigate('/trip-planner')}>
              Create Your First AI Trip
            </Button>
          </div>
        )}
      </motion.div>

      {/* AI Features Showcase */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="relative z-10 p-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 360]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block text-6xl mb-4"
            >
              �
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              AI-Powered Travel Revolution
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Experience the future of travel planning with cutting-edge artificial intelligence
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            {[
              {
                icon: '🧠',
                title: 'Smart Recommendations',
                description: 'AI analyzes your preferences to suggest perfect destinations, activities, and experiences tailored just for you.',
                gradient: 'from-pink-500 to-rose-500'
              },
              {
                icon: '📅',
                title: 'Intelligent Itineraries',
                description: 'Generate optimized day-by-day plans based on your budget, interests, and unique travel style.',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: '💬',
                title: '24/7 AI Assistant',
                description: 'Get instant answers to travel questions, emergency assistance, and real-time support anytime, anywhere.',
                gradient: 'from-purple-500 to-indigo-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300"
              >
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  className="text-5xl mb-4"
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-blue-100 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.9 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/trip-planner')}
              className="inline-flex items-center px-10 py-5 bg-white text-purple-600 rounded-full text-lg font-bold shadow-2xl hover:bg-gradient-to-r hover:from-yellow-400 hover:to-pink-400 hover:text-white transition-all duration-300"
            >
              <span className="mr-3">✨</span>
              Start Your AI Journey Now
              <motion.span 
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="ml-3"
              >
                →
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

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
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Manage Trip to {selectedTrip.destination}
                </h3>
                
                <p className="text-gray-600 mb-6">
                  What would you like to do with this AI-planned trip?
                </p>

                <div className="space-y-3">
                  {selectedTrip.status === 'planned' && (
                    <button
                      onClick={() => cancelTrip(selectedTrip)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Cancel Trip
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteTrip(selectedTrip)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Trip
                  </button>

                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setSelectedTrip(null);
                    }}
                    className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Keep Trip
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chatbot - Always available */}
      <AdvancedAIChatbot />
      </div>
    </div>
  );
};

export default Dashboard;