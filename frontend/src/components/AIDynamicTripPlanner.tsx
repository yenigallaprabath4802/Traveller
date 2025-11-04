import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  RefreshCw, 
  MapPin, 
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  Cloud,
  Sun,
  CloudRain,
  Navigation,
  Coffee,
  Camera,
  Utensils,
  Hotel,
  Plane,
  Car,
  Palmtree,
  Mountain,
  Waves,
  Compass,
  Map,
  Sparkles,
  Zap,
  Target,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './Button';

interface TripDay {
  day: number;
  date: string;
  activities: Activity[];
  weather: {
    condition: string;
    temp: number;
    icon: string;
  };
  budget: number;
  optimizationScore: number;
}

interface Activity {
  time: string;
  title: string;
  description: string;
  location: string;
  cost: number;
  duration: string;
  category: 'sightseeing' | 'dining' | 'adventure' | 'relaxation' | 'shopping' | 'culture';
  priority: 'high' | 'medium' | 'low';
}

const AIDynamicTripPlanner: React.FC = () => {
  const [destination, setDestination] = useState('Paris, France');
  const [startDate, setStartDate] = useState('2025-11-15');
  const [endDate, setEndDate] = useState('2025-11-20');
  const [budget, setBudget] = useState(2000);
  const [travelers, setTravelers] = useState(2);
  const [interests, setInterests] = useState<string[]>(['culture', 'food', 'adventure']);
  const [tripPlan, setTripPlan] = useState<TripDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const interestOptions = [
    { id: 'culture', label: '🏛️ Culture & History', icon: '🏛️' },
    { id: 'food', label: '🍽️ Food & Dining', icon: '🍽️' },
    { id: 'adventure', label: '🏔️ Adventure', icon: '🏔️' },
    { id: 'relaxation', label: '🧘 Relaxation', icon: '🧘' },
    { id: 'shopping', label: '🛍️ Shopping', icon: '🛍️' },
    { id: 'nightlife', label: '🌃 Nightlife', icon: '🌃' },
    { id: 'nature', label: '🌲 Nature', icon: '🌲' },
    { id: 'photography', label: '📸 Photography', icon: '📸' }
  ];

  const toggleInterest = (interest: string) => {
    setInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const generateMockItinerary = (): TripDay[] => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const mockDays: TripDay[] = [];

    const activities: Record<string, Activity[]> = {
      morning: [
        { time: '08:00', title: 'Breakfast at Café de Flore', description: 'Start your day with authentic French pastries and coffee', location: 'Saint-Germain-des-Prés', cost: 25, duration: '1h', category: 'dining', priority: 'high' },
        { time: '09:00', title: 'Visit the Louvre Museum', description: 'Explore world-famous art including the Mona Lisa', location: 'Louvre Museum', cost: 17, duration: '3h', category: 'culture', priority: 'high' },
        { time: '08:30', title: 'Seine River Cruise', description: 'Enjoy a peaceful morning cruise along the Seine', location: 'Seine River', cost: 15, duration: '1.5h', category: 'sightseeing', priority: 'medium' }
      ],
      afternoon: [
        { time: '13:00', title: 'Lunch at Le Marais', description: 'Traditional French cuisine in a historic district', location: 'Le Marais', cost: 45, duration: '1.5h', category: 'dining', priority: 'high' },
        { time: '14:30', title: 'Eiffel Tower Visit', description: 'Ascend the iconic Eiffel Tower for panoramic views', location: 'Champ de Mars', cost: 26, duration: '2h', category: 'sightseeing', priority: 'high' },
        { time: '15:00', title: 'Montmartre Walking Tour', description: 'Explore the artistic quarter and Sacré-Cœur', location: 'Montmartre', cost: 0, duration: '2h', category: 'culture', priority: 'medium' }
      ],
      evening: [
        { time: '19:00', title: 'Dinner at Bistro Paul Bert', description: 'Classic French bistro experience', location: '11th Arrondissement', cost: 60, duration: '2h', category: 'dining', priority: 'high' },
        { time: '21:00', title: 'Evening at Moulin Rouge', description: 'Experience the famous cabaret show', location: 'Pigalle', cost: 100, duration: '2.5h', category: 'culture', priority: 'medium' },
        { time: '20:00', title: 'Champs-Élysées Stroll', description: 'Walk along the illuminated avenue', location: 'Champs-Élysées', cost: 0, duration: '1h', category: 'relaxation', priority: 'low' }
      ]
    };

    const weatherConditions = [
      { condition: 'Sunny', temp: 22, icon: '☀️' },
      { condition: 'Partly Cloudy', temp: 20, icon: '⛅' },
      { condition: 'Cloudy', temp: 18, icon: '☁️' },
      { condition: 'Light Rain', temp: 16, icon: '🌧️' }
    ];

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      const dayActivities: Activity[] = [
        activities.morning[Math.floor(Math.random() * activities.morning.length)],
        activities.afternoon[Math.floor(Math.random() * activities.afternoon.length)],
        activities.evening[Math.floor(Math.random() * activities.evening.length)]
      ];

      const dayBudget = dayActivities.reduce((sum, act) => sum + act.cost, 0);
      const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

      mockDays.push({
        day: i + 1,
        date: currentDate.toISOString().split('T')[0],
        activities: dayActivities,
        weather,
        budget: dayBudget,
        optimizationScore: Math.floor(Math.random() * 15) + 85
      });
    }

    return mockDays;
  };

  const handleGenerateTrip = async () => {
    setLoading(true);
    toast.loading('AI is crafting your perfect itinerary...', { id: 'generate' });
    
    // Simulate API call
    setTimeout(() => {
      const itinerary = generateMockItinerary();
      setTripPlan(itinerary);
      setLoading(false);
      toast.success('Your AI-optimized trip is ready! 🎉', { id: 'generate' });
    }, 2000);
  };

  const handleOptimize = async () => {
    if (tripPlan.length === 0) {
      toast.error('Please generate a trip first!');
      return;
    }

    setOptimizing(true);
    toast.loading('AI is optimizing your itinerary...', { id: 'optimize' });
    
    setTimeout(() => {
      // Update optimization scores
      const optimized = tripPlan.map(day => ({
        ...day,
        optimizationScore: Math.min(100, day.optimizationScore + Math.floor(Math.random() * 10) + 5)
      }));
      setTripPlan(optimized);
      setOptimizing(false);
      toast.success('Trip optimized for best experience! ✨', { id: 'optimize' });
    }, 1500);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      sightseeing: Camera,
      dining: Utensils,
      adventure: Mountain,
      relaxation: Coffee,
      shopping: '🛍️',
      culture: '🏛️'
    };
    return icons[category] || MapPin;
  };

  const totalCost = tripPlan.reduce((sum, day) => sum + day.budget, 0);
  const avgOptimization = tripPlan.length > 0 
    ? Math.round(tripPlan.reduce((sum, day) => sum + day.optimizationScore, 0) / tripPlan.length)
    : 0;

  // Floating travel icons for background
  const floatingIcons = [
    { Icon: Plane, delay: 0, duration: 20, x: [0, 100, 0], y: [0, -50, 0] },
    { Icon: Palmtree, delay: 2, duration: 25, x: [0, -80, 0], y: [0, 60, 0] },
    { Icon: Mountain, delay: 4, duration: 30, x: [0, 60, 0], y: [0, -40, 0] },
    { Icon: Waves, delay: 1, duration: 22, x: [0, -50, 0], y: [0, 50, 0] },
    { Icon: Compass, delay: 3, duration: 28, x: [0, 70, 0], y: [0, -60, 0] },
    { Icon: Map, delay: 5, duration: 24, x: [0, -90, 0], y: [0, 40, 0] },
    { Icon: Camera, delay: 2.5, duration: 26, x: [0, 80, 0], y: [0, -30, 0] },
    { Icon: Hotel, delay: 4.5, duration: 27, x: [0, -70, 0], y: [0, 70, 0] }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Travel Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map(({ Icon, delay, duration, x, y }, index) => (
          <motion.div
            key={index}
            className="absolute text-blue-200/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x,
              y,
              rotate: [0, 360]
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Icon size={60 + Math.random() * 40} />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 container-custom py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="inline-block text-6xl mb-4"
          >
            🧠
          </motion.div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            AI Dynamic Trip Planner
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powered by advanced AI to create personalized, optimized itineraries that adapt to real-time conditions
          </p>
        </motion.div>

        {/* Trip Configuration Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <Sparkles className="w-8 h-8 text-purple-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Configure Your Trip</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="Where to?"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Budget (USD)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="2000"
              />
            </div>

            {/* Travelers */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-2" />
                Travelers
              </label>
              <input
                type="number"
                value={travelers}
                onChange={(e) => setTravelers(Number(e.target.value))}
                min="1"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                placeholder="2"
              />
            </div>
          </div>

          {/* Interests */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              <Target className="w-4 h-4 inline mr-2" />
              Your Interests
            </label>
            <div className="flex flex-wrap gap-3">
              {interestOptions.map((option) => (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleInterest(option.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    interests.includes(option.id)
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerateTrip}
              disabled={loading}
              className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate AI Trip
                </>
              )}
            </motion.button>

            {tripPlan.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleOptimize}
                disabled={optimizing}
                className="flex-1 min-w-[200px] bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {optimizing ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Optimize Itinerary
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Trip Summary Stats */}
        {tripPlan.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <Calendar className="w-10 h-10 mx-auto mb-3 text-blue-600" />
              <div className="text-3xl font-bold text-gray-900">{tripPlan.length}</div>
              <div className="text-sm text-gray-600 mt-1">Days Planned</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <DollarSign className="w-10 h-10 mx-auto mb-3 text-green-600" />
              <div className="text-3xl font-bold text-gray-900">${totalCost}</div>
              <div className="text-sm text-gray-600 mt-1">Total Cost</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-3 text-purple-600" />
              <div className="text-3xl font-bold text-gray-900">{avgOptimization}%</div>
              <div className="text-sm text-gray-600 mt-1">Optimization Score</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <Award className="w-10 h-10 mx-auto mb-3 text-yellow-600" />
              <div className="text-3xl font-bold text-gray-900">{tripPlan.reduce((sum, day) => sum + day.activities.length, 0)}</div>
              <div className="text-sm text-gray-600 mt-1">Activities</div>
            </div>
          </motion.div>
        )}

        {/* Itinerary Display */}
        <AnimatePresence>
          {tripPlan.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {tripPlan.map((day, dayIndex) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIndex * 0.1 }}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                  {/* Day Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                    <div className="flex flex-wrap items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">
                          Day {day.day} - {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>
                        <p className="text-blue-100">
                          {day.weather.icon} {day.weather.condition} • {day.weather.temp}°C
                        </p>
                      </div>
                      <div className="text-right mt-4 md:mt-0">
                        <div className="text-3xl font-bold">${day.budget}</div>
                        <div className="text-sm text-blue-100">Daily Budget</div>
                        <div className="mt-2 inline-flex items-center bg-white/20 rounded-full px-3 py-1">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm font-semibold">{day.optimizationScore}% Optimized</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="p-6 space-y-4">
                    {day.activities.map((activity, actIndex) => {
                      const CategoryIcon = getCategoryIcon(activity.category);
                      return (
                        <motion.div
                          key={actIndex}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: dayIndex * 0.1 + actIndex * 0.05 }}
                          className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors border-l-4 border-blue-500"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                              {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{activity.title}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                activity.priority === 'high' ? 'bg-red-100 text-red-700' :
                                activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {activity.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3">{activity.description}</p>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                {activity.location}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {activity.duration}
                              </div>
                              <div className="flex items-center font-semibold text-green-600">
                                <DollarSign className="w-4 h-4 mr-1" />
                                ${activity.cost}
                              </div>
                              <div className="flex items-center">
                                {typeof CategoryIcon === 'string' ? (
                                  <span className="mr-1">{CategoryIcon}</span>
                                ) : (
                                  <CategoryIcon className="w-4 h-4 mr-1" />
                                )}
                                {activity.category}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {tripPlan.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl p-16 text-center"
          >
            <motion.div
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-8xl mb-6"
            >
              🗺️
            </motion.div>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Plan Your Dream Trip?
            </h3>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Our AI will analyze your preferences, budget, and interests to create a personalized itinerary with real-time optimization
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="p-6">
                <div className="text-4xl mb-3">🤖</div>
                <h4 className="font-bold text-gray-900 mb-2">AI-Powered</h4>
                <p className="text-sm text-gray-600">Advanced algorithms optimize every aspect of your trip</p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-3">⚡</div>
                <h4 className="font-bold text-gray-900 mb-2">Real-Time Updates</h4>
                <p className="text-sm text-gray-600">Adapts to weather, traffic, and local events</p>
              </div>
              <div className="p-6">
                <div className="text-4xl mb-3">💰</div>
                <h4 className="font-bold text-gray-900 mb-2">Budget Optimized</h4>
                <p className="text-sm text-gray-600">Get the most value from every dollar spent</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AIDynamicTripPlanner;
