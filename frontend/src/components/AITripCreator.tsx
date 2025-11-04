import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Brain,
  Sparkles,
  Zap,
  Camera,
  Star,
  Plane,
  Heart,
  Coffee,
  Mountain,
  Waves,
  Building,
  Utensils,
  ShoppingBag,
  Music,
  TreePine,
  Sunset,
  Car,
  Train,
  Ship,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  Save,
  Share2,
  ArrowRight,
  ArrowLeft,
  Play,
  Plus,
  Minus,
  X
} from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';

interface TripPlan {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  duration: number;
  budget: number;
  travelers: number;
  preferences: string[];
  travelStyle: string;
  accommodation: string;
  transportation: string;
  generatedItinerary?: ItineraryDay[];
  optimizations?: OptimizationResult;
  aiInsights?: AIInsights;
}

interface ItineraryDay {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
  meals: Meal[];
  transportation: Transportation[];
  accommodation: Accommodation;
  totalCost: number;
  highlights: string[];
}

interface Activity {
  id: string;
  name: string;
  description: string;
  type: string;
  location: {
    address: string;
    coordinates: [number, number];
  };
  startTime: string;
  endTime: string;
  duration: number;
  cost: number;
  rating: number;
  difficulty: 'easy' | 'moderate' | 'challenging';
  category: string;
  bookingRequired: boolean;
  images?: string[];
  tips?: string[];
}

interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine: string;
  location: string;
  cost: number;
  rating: number;
  dietaryOptions: string[];
}

interface Transportation {
  from: string;
  to: string;
  mode: 'walking' | 'driving' | 'train' | 'bus' | 'flight' | 'taxi';
  duration: number;
  cost: number;
  provider?: string;
  notes?: string;
}

interface Accommodation {
  name: string;
  type: string;
  location: string;
  rating: number;
  amenities: string[];
  costPerNight: number;
  checkin: string;
  checkout: string;
}

interface OptimizationResult {
  budgetSavings: number;
  timeOptimization: number;
  experienceEnhancement: string[];
  alternatives: Alternative[];
}

interface Alternative {
  category: string;
  original: string;
  alternative: string;
  savings: number;
  reasoning: string;
}

interface AIInsights {
  destinationInsights: string[];
  seasonalTips: string[];
  localCulture: string[];
  hiddenGems: string[];
  budgetTips: string[];
  packingAdvice: string[];
  weatherPredictions: WeatherPrediction[];
}

interface WeatherPrediction {
  date: string;
  condition: string;
  temperature: number;
  advice: string;
}

const AITripCreator: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [tripPlan, setTripPlan] = useState<TripPlan>({
    id: `trip_${Date.now()}`,
    destination: '',
    startDate: '',
    endDate: '',
    duration: 0,
    budget: 0,
    travelers: 1,
    preferences: [],
    travelStyle: '',
    accommodation: '',
    transportation: ''
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showItinerary, setShowItinerary] = useState(false);
  const [activeDay, setActiveDay] = useState(1);
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<any>(null);

  const totalSteps = 6;

  const travelPreferences = [
    { id: 'adventure', label: 'Adventure', icon: <Mountain className="w-5 h-5" />, color: 'orange' },
    { id: 'culture', label: 'Culture & History', icon: <Building className="w-5 h-5" />, color: 'purple' },
    { id: 'relaxation', label: 'Relaxation', icon: <Waves className="w-5 h-5" />, color: 'blue' },
    { id: 'food', label: 'Food & Dining', icon: <Utensils className="w-5 h-5" />, color: 'green' },
    { id: 'nightlife', label: 'Nightlife', icon: <Music className="w-5 h-5" />, color: 'pink' },
    { id: 'nature', label: 'Nature & Wildlife', icon: <TreePine className="w-5 h-5" />, color: 'emerald' },
    { id: 'photography', label: 'Photography', icon: <Camera className="w-5 h-5" />, color: 'indigo' },
    { id: 'shopping', label: 'Shopping', icon: <ShoppingBag className="w-5 h-5" />, color: 'red' },
    { id: 'wellness', label: 'Wellness & Spa', icon: <Heart className="w-5 h-5" />, color: 'rose' },
    { id: 'local', label: 'Local Experiences', icon: <Coffee className="w-5 h-5" />, color: 'amber' }
  ];

  const travelStyles = [
    { id: 'luxury', label: 'Luxury', description: 'Premium experiences and accommodations', icon: '✨' },
    { id: 'comfortable', label: 'Comfortable', description: 'Balance of comfort and value', icon: '🏨' },
    { id: 'budget', label: 'Budget', description: 'Cost-effective travel with great experiences', icon: '💰' },
    { id: 'backpacker', label: 'Backpacker', description: 'Adventure-focused, budget-friendly', icon: '🎒' }
  ];

  const accommodationTypes = [
    { id: 'hotel', label: 'Hotel', icon: '🏨' },
    { id: 'resort', label: 'Resort', icon: '🏖️' },
    { id: 'boutique', label: 'Boutique Hotel', icon: '🏛️' },
    { id: 'hostel', label: 'Hostel', icon: '🛏️' },
    { id: 'airbnb', label: 'Vacation Rental', icon: '🏠' },
    { id: 'guesthouse', label: 'Guesthouse', icon: '🏡' }
  ];

  const transportationModes = [
    { id: 'flight', label: 'Flight', icon: <Plane className="w-5 h-5" /> },
    { id: 'train', label: 'Train', icon: <Train className="w-5 h-5" /> },
    { id: 'car', label: 'Car/Rental', icon: <Car className="w-5 h-5" /> },
    { id: 'bus', label: 'Bus', icon: <Car className="w-5 h-5" /> },
    { id: 'cruise', label: 'Cruise', icon: <Ship className="w-5 h-5" /> }
  ];

  useEffect(() => {
    if (tripPlan.startDate && tripPlan.endDate) {
      const start = new Date(tripPlan.startDate);
      const end = new Date(tripPlan.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTripPlan(prev => ({ ...prev, duration: diffDays }));
    }
  }, [tripPlan.startDate, tripPlan.endDate]);

  useEffect(() => {
    if (tripPlan.destination && tripPlan.destination.length > 2) {
      fetchDestinationSuggestions(tripPlan.destination);
    }
  }, [tripPlan.destination]);

  const fetchDestinationSuggestions = async (query: string) => {
    try {
      // Mock API call - replace with real destination API
      const suggestions = [
        'Paris, France',
        'Tokyo, Japan',
        'New York, USA',
        'Rome, Italy',
        'London, UK',
        'Barcelona, Spain',
        'Dubai, UAE',
        'Sydney, Australia'
      ].filter(dest => dest.toLowerCase().includes(query.toLowerCase()));
      
      setDestinationSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
    }
  };

  const updateTripPlan = (updates: Partial<TripPlan>) => {
    setTripPlan(prev => ({ ...prev, ...updates }));
  };

  const togglePreference = (preferenceId: string) => {
    const currentPreferences = tripPlan.preferences || [];
    const isSelected = currentPreferences.includes(preferenceId);
    
    if (isSelected) {
      updateTripPlan({
        preferences: currentPreferences.filter(p => p !== preferenceId)
      });
    } else {
      updateTripPlan({
        preferences: [...currentPreferences, preferenceId]
      });
    }
  };

  const generateTripPlan = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Simulate AI generation progress
      const progressSteps = [
        { progress: 10, message: 'Analyzing destination data...' },
        { progress: 25, message: 'Fetching real-time information...' },
        { progress: 40, message: 'Generating personalized itinerary...' },
        { progress: 60, message: 'Optimizing routes and timing...' },
        { progress: 80, message: 'Calculating budget breakdown...' },
        { progress: 95, message: 'Finalizing recommendations...' },
        { progress: 100, message: 'Trip plan generated!' }
      ];

      for (const step of progressSteps) {
        setGenerationProgress(step.progress);
        toast.loading(step.message, { id: 'generation' });
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call AI service to generate trip plan
      const response = await fetch('http://localhost:5000/api/ai-itinerary/generate-comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          destination: tripPlan.destination,
          startDate: tripPlan.startDate,
          endDate: tripPlan.endDate,
          duration: tripPlan.duration,
          budget: tripPlan.budget,
          travelers: tripPlan.travelers,
          preferences: tripPlan.preferences,
          travelStyle: tripPlan.travelStyle,
          accommodation: tripPlan.accommodation,
          transportation: tripPlan.transportation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate trip plan');
      }

      const result = await response.json();
      
      updateTripPlan({
        generatedItinerary: result.itinerary,
        optimizations: result.optimizations,
        aiInsights: result.insights
      });

      setBudgetBreakdown(result.budgetBreakdown);
      setShowItinerary(true);
      toast.success('🎉 Your AI-powered trip plan is ready!', { id: 'generation' });

    } catch (error) {
      console.error('Error generating trip plan:', error);
      toast.error('Failed to generate trip plan. Please try again.', { id: 'generation' });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const saveTripPlan = () => {
    try {
      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
      const newTrip = {
        ...tripPlan,
        savedAt: new Date().toISOString(),
        status: 'planned'
      };
      
      savedTrips.push(newTrip);
      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
      
      toast.success('Trip plan saved successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error saving trip plan:', error);
      toast.error('Failed to save trip plan');
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return tripPlan.destination.trim().length > 0;
      case 2:
        return tripPlan.startDate && tripPlan.endDate && tripPlan.duration > 0;
      case 3:
        return tripPlan.budget > 0 && tripPlan.travelers > 0;
      case 4:
        return tripPlan.preferences.length > 0;
      case 5:
        return tripPlan.travelStyle && tripPlan.accommodation && tripPlan.transportation;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <DestinationStep />;
      case 2:
        return <DatesStep />;
      case 3:
        return <BudgetTravelersStep />;
      case 4:
        return <PreferencesStep />;
      case 5:
        return <StyleAccommodationStep />;
      case 6:
        return <ReviewGenerateStep />;
      default:
        return null;
    }
  };

  const DestinationStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Where would you like to go?</h2>
        <p className="text-gray-600">Let our AI help you discover the perfect destination</p>
      </div>

      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={tripPlan.destination}
          onChange={(e) => updateTripPlan({ destination: e.target.value })}
          placeholder="Enter a city, country, or region..."
          className="w-full pl-10 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {destinationSuggestions.length > 0 && tripPlan.destination && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl shadow-lg"
        >
          {destinationSuggestions.slice(0, 6).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => updateTripPlan({ destination: suggestion })}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{suggestion}</span>
              </div>
            </button>
          ))}
        </motion.div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Lightbulb className="w-6 h-6 text-blue-500" />
          <h3 className="font-semibold text-gray-900">AI Destination Insights</h3>
        </div>
        <p className="text-gray-600 mb-3">
          Our AI analyzes millions of travel data points to suggest the best destinations based on:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Weather conditions and seasonal trends</li>
          <li>• Local events and festivals</li>
          <li>• Safety and travel advisories</li>
          <li>• Value for money and budget optimization</li>
        </ul>
      </div>
    </motion.div>
  );

  const DatesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">When do you want to travel?</h2>
        <p className="text-gray-600">Choose your travel dates for optimal planning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={tripPlan.startDate}
              onChange={(e) => updateTripPlan({ startDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={tripPlan.endDate}
              onChange={(e) => updateTripPlan({ endDate: e.target.value })}
              min={tripPlan.startDate || new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {tripPlan.duration > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4"
        >
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-green-500" />
            <div>
              <h3 className="font-semibold text-gray-900">Trip Duration</h3>
              <p className="text-gray-600">{tripPlan.duration} day{tripPlan.duration > 1 ? 's' : ''}</p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Zap className="w-6 h-6 text-amber-500" />
          <h3 className="font-semibold text-gray-900">Smart Date Optimization</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Our AI will suggest the best dates based on weather, prices, crowds, and local events.
        </p>
      </div>
    </motion.div>
  );

  const BudgetTravelersStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Budget & Travelers</h2>
        <p className="text-gray-600">Help us personalize your trip planning</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Total Budget (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="number"
              value={tripPlan.budget || ''}
              onChange={(e) => updateTripPlan({ budget: Number(e.target.value) })}
              placeholder="0"
              min="0"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Travelers</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <div className="flex items-center">
              <button
                onClick={() => updateTripPlan({ travelers: Math.max(1, tripPlan.travelers - 1) })}
                className="px-3 py-3 border border-gray-300 rounded-l-xl hover:bg-gray-50 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={tripPlan.travelers}
                onChange={(e) => updateTripPlan({ travelers: Math.max(1, Number(e.target.value)) })}
                min="1"
                className="w-full px-4 py-3 border-t border-b border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => updateTripPlan({ travelers: tripPlan.travelers + 1 })}
                className="px-3 py-3 border border-gray-300 rounded-r-xl hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {tripPlan.budget > 0 && tripPlan.duration > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <h3 className="font-semibold text-gray-900">Budget Breakdown</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Per day:</span>
              <span className="font-semibold ml-2">${Math.round(tripPlan.budget / tripPlan.duration)}</span>
            </div>
            <div>
              <span className="text-gray-600">Per person:</span>
              <span className="font-semibold ml-2">${Math.round(tripPlan.budget / tripPlan.travelers)}</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <h3 className="font-semibold text-gray-900">AI Budget Optimization</h3>
        </div>
        <p className="text-gray-600 text-sm">
          Our AI will optimize your budget allocation across accommodation, activities, food, and transportation for the best value.
        </p>
      </div>
    </motion.div>
  );

  const PreferencesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">What interests you?</h2>
        <p className="text-gray-600">Select your travel preferences (choose multiple)</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {travelPreferences.map((preference) => {
          const isSelected = tripPlan.preferences.includes(preference.id);
          return (
            <motion.button
              key={preference.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => togglePreference(preference.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? `border-${preference.color}-500 bg-${preference.color}-50 text-${preference.color}-700`
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                {preference.icon}
                <span className="text-sm font-medium text-center">{preference.label}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {tripPlan.preferences.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-3">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <h3 className="font-semibold text-gray-900">Selected Preferences</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tripPlan.preferences.map((prefId) => {
              const pref = travelPreferences.find(p => p.id === prefId);
              return (
                <span
                  key={prefId}
                  className={`px-3 py-1 rounded-full text-sm font-medium bg-${pref?.color}-100 text-${pref?.color}-700`}
                >
                  {pref?.label}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const StyleAccommodationStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-8"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Travel Style & Preferences</h2>
        <p className="text-gray-600">Choose your travel style and preferences</p>
      </div>

      {/* Travel Style */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Travel Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {travelStyles.map((style) => (
            <motion.button
              key={style.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => updateTripPlan({ travelStyle: style.id })}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                tripPlan.travelStyle === style.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{style.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{style.label}</h4>
                  <p className="text-sm text-gray-600">{style.description}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Accommodation Type */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accommodation Preference</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {accommodationTypes.map((acc) => (
            <motion.button
              key={acc.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateTripPlan({ accommodation: acc.id })}
              className={`p-4 rounded-xl border-2 transition-all ${
                tripPlan.accommodation === acc.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <span className="text-2xl mb-2 block">{acc.icon}</span>
                <span className="text-sm font-medium">{acc.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Transportation Mode */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Transportation</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {transportationModes.map((transport) => (
            <motion.button
              key={transport.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => updateTripPlan({ transportation: transport.id })}
              className={`p-4 rounded-xl border-2 transition-all ${
                tripPlan.transportation === transport.id
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex flex-col items-center space-y-2">
                {transport.icon}
                <span className="text-sm font-medium text-center">{transport.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const ReviewGenerateStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Trip Details</h2>
        <p className="text-gray-600">Ready to generate your AI-powered itinerary?</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-6">
        {/* Trip Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <div>
                <span className="text-sm text-gray-600">Destination</span>
                <div className="font-semibold text-gray-900">{tripPlan.destination}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <span className="text-sm text-gray-600">Dates</span>
                <div className="font-semibold text-gray-900">
                  {new Date(tripPlan.startDate).toLocaleDateString()} - {new Date(tripPlan.endDate).toLocaleDateString()}
                  <span className="text-sm text-gray-600 ml-2">({tripPlan.duration} days)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <span className="text-sm text-gray-600">Budget</span>
                <div className="font-semibold text-gray-900">${tripPlan.budget.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-orange-500" />
              <div>
                <span className="text-sm text-gray-600">Travelers</span>
                <div className="font-semibold text-gray-900">{tripPlan.travelers} person{tripPlan.travelers > 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm text-gray-600">Travel Style</span>
              <div className="font-semibold text-gray-900 capitalize">{tripPlan.travelStyle}</div>
            </div>

            <div>
              <span className="text-sm text-gray-600">Accommodation</span>
              <div className="font-semibold text-gray-900 capitalize">{tripPlan.accommodation}</div>
            </div>

            <div>
              <span className="text-sm text-gray-600">Transportation</span>
              <div className="font-semibold text-gray-900 capitalize">{tripPlan.transportation}</div>
            </div>

            <div>
              <span className="text-sm text-gray-600">Interests</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {tripPlan.preferences.map((prefId) => {
                  const pref = travelPreferences.find(p => p.id === prefId);
                  return (
                    <span
                      key={prefId}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                    >
                      {pref?.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* AI Features Preview */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Powered Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
              <Brain className="w-6 h-6 text-blue-500 mb-2" />
              <h4 className="font-medium text-gray-900">Smart Optimization</h4>
              <p className="text-sm text-gray-600">Routes, timing, and budget optimization</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <Zap className="w-6 h-6 text-green-500 mb-2" />
              <h4 className="font-medium text-gray-900">Real-time Adaptation</h4>
              <p className="text-sm text-gray-600">Weather, events, and crowd monitoring</p>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-500 mb-2" />
              <h4 className="font-medium text-gray-900">Personalized Insights</h4>
              <p className="text-sm text-gray-600">Hidden gems and local recommendations</p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="border-t pt-6">
          {!isGenerating ? (
            <Button
              onClick={generateTripPlan}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 text-lg font-semibold shadow-lg"
            >
              <Brain className="w-6 h-6 mr-3" />
              Generate AI Trip Plan
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${generationProgress}%` }}
                  transition={{ duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                />
              </div>
              <div className="text-center">
                <div className="inline-flex items-center space-x-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-gray-600">Generating your personalized trip plan...</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">{generationProgress}% complete</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (showItinerary && tripPlan.generatedItinerary) {
    return <GeneratedItineraryView tripPlan={tripPlan} onSave={saveTripPlan} onBack={() => setShowItinerary(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Trip Planner</h1>
            <span className="text-sm text-gray-600">Step {currentStep} of {totalSteps}</span>
          </div>
          
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border p-8 mb-8">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div className="w-24"></div> // Spacer for alignment
          )}
        </div>
      </div>
    </div>
  );
};

// Generated Itinerary View Component
const GeneratedItineraryView: React.FC<{
  tripPlan: TripPlan;
  onSave: () => void;
  onBack: () => void;
}> = ({ tripPlan, onSave, onBack }) => {
  const [activeDay, setActiveDay] = useState(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Your AI-Generated Trip Plan
              </h1>
              <p className="text-gray-600">
                {tripPlan.destination} • {tripPlan.duration} days • ${tripPlan.budget.toLocaleString()} budget
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={onBack}
                className="bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
              
              <Button
                onClick={onSave}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Trip Plan
              </Button>
              
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Day Selector */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Trip Days</h3>
              <div className="space-y-2">
                {tripPlan.generatedItinerary?.map((day) => (
                  <button
                    key={day.day}
                    onClick={() => setActiveDay(day.day)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      activeDay === day.day
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">Day {day.day}</div>
                    <div className="text-sm opacity-75">{day.theme}</div>
                    <div className="text-xs mt-1">${day.totalCost}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Day Details */}
          <div className="lg:col-span-3">
            {tripPlan.generatedItinerary?.find(day => day.day === activeDay) && (
              <DayDetailView 
                day={tripPlan.generatedItinerary.find(day => day.day === activeDay)!}
                insights={tripPlan.aiInsights}
              />
            )}
          </div>
        </div>

        {/* AI Insights Panel */}
        {tripPlan.aiInsights && (
          <div className="mt-6 bg-white rounded-xl shadow-lg border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-purple-500" />
              AI Travel Insights
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Destination Insights</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tripPlan.aiInsights.destinationInsights?.map((insight, index) => (
                    <li key={index}>• {insight}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Hidden Gems</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tripPlan.aiInsights.hiddenGems?.map((gem, index) => (
                    <li key={index}>• {gem}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Budget Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {tripPlan.aiInsights.budgetTips?.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Day Detail View Component
const DayDetailView: React.FC<{
  day: ItineraryDay;
  insights?: AIInsights;
}> = ({ day, insights }) => {
  return (
    <motion.div
      key={day.day}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Day Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Day {day.day}: {day.theme}</h2>
            <p className="opacity-90">{new Date(day.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">${day.totalCost}</div>
            <div className="text-sm opacity-90">Total Cost</div>
          </div>
        </div>

        <div className="mt-4 flex space-x-6 text-sm">
          <div>
            <span className="opacity-75">Activities: </span>
            <span className="font-medium">{day.activities?.length || 0}</span>
          </div>
          <div>
            <span className="opacity-75">Highlights: </span>
            <span className="font-medium">{day.highlights?.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white rounded-xl shadow-lg border">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">Activities & Timeline</h3>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {day.activities?.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-16 text-center">
                  <div className="text-sm font-medium text-gray-900">{activity.startTime}</div>
                  <div className="text-xs text-gray-500">{activity.duration}m</div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-gray-900">{activity.name}</h4>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {activity.category}
                    </span>
                    {activity.bookingRequired && (
                      <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                        Booking Required
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{activity.location.address}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{activity.rating}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-3 h-3" />
                        <span>${activity.cost}</span>
                      </div>
                    </div>
                  </div>

                  {activity.tips && activity.tips.length > 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div className="flex items-center space-x-1 mb-1">
                        <Lightbulb className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs font-medium text-yellow-700">AI Tips</span>
                      </div>
                      <ul className="text-xs text-yellow-700 space-y-1">
                        {activity.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Meals */}
      {day.meals && day.meals.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Recommended Meals</h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {day.meals.map((meal) => (
                <div key={meal.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{meal.name}</h4>
                    <span className="text-sm font-medium text-orange-700 capitalize">{meal.type}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{meal.cuisine} cuisine</p>
                  <p className="text-sm text-gray-600 mb-2">{meal.location}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{meal.rating}</span>
                    </div>
                    <span className="font-medium">${meal.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transportation */}
      {day.transportation && day.transportation.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-6 border-b">
            <h3 className="text-xl font-semibold text-gray-900">Transportation</h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-3">
              {day.transportation.map((transport, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      {transport.mode === 'walking' ? '🚶' : 
                       transport.mode === 'driving' ? '🚗' : 
                       transport.mode === 'train' ? '🚊' : 
                       transport.mode === 'bus' ? '🚌' : '🚕'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {transport.from} → {transport.to}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        {transport.mode} • {transport.duration} min
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">${transport.cost}</div>
                    {transport.provider && (
                      <div className="text-xs text-gray-500">{transport.provider}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AITripCreator;