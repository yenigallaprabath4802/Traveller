import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock,
  Sparkles,
  Download,
  Edit,
  Save,
  RefreshCw,
  Star,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from './Button';

interface TripDetails {
  destination: string;
  duration: number;
  budget: number;
  travelers: number;
  travelStyle: string;
  interests: string[];
  season: string;
}

interface Activity {
  time: string;
  activity: string;
  location: string;
  cost: number;
  duration: string;
  description: string;
}

interface DayItinerary {
  day: number;
  theme: string;
  activities: Activity[];
  meals: any[];
  accommodation: any;
  transportation: any;
  totalDayCost: number;
}

interface GeneratedItinerary {
  itinerary: DayItinerary[];
  costBreakdown: {
    accommodation: number;
    food: number;
    activities: number;
    transportation: number;
    miscellaneous: number;
    total: number;
  };
  tips: string[];
  essentialInfo: any;
  metadata: any;
}

const SmartItineraryGenerator: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [tripDetails, setTripDetails] = useState<TripDetails>({
    destination: '',
    duration: 3,
    budget: 50000,
    travelers: 2,
    travelStyle: 'mid-range',
    interests: [],
    season: 'summer'
  });
  const [generatedItinerary, setGeneratedItinerary] = useState<GeneratedItinerary | null>(null);
  const [suggestions, setSuggestions] = useState([]);

  const travelStyles = [
    { value: 'budget', label: 'Budget Traveler', icon: '💰', description: 'Cost-effective options' },
    { value: 'mid-range', label: 'Comfort Seeker', icon: '🏨', description: 'Balance of comfort and cost' },
    { value: 'luxury', label: 'Luxury Explorer', icon: '✨', description: 'Premium experiences' },
    { value: 'adventure', label: 'Adventure Lover', icon: '🏔️', description: 'Thrilling activities' },
    { value: 'cultural', label: 'Culture Enthusiast', icon: '🏛️', description: 'Historical and cultural sites' },
    { value: 'relaxation', label: 'Relaxation Focused', icon: '🧘', description: 'Peaceful and rejuvenating' }
  ];

  const interestOptions = [
    'History', 'Art', 'Food', 'Nature', 'Adventure', 'Shopping', 
    'Nightlife', 'Museums', 'Beaches', 'Mountains', 'Architecture', 
    'Wildlife', 'Photography', 'Local Culture', 'Music', 'Sports'
  ];

  const seasons = [
    { value: 'spring', label: 'Spring (Mar-May)', icon: '🌸' },
    { value: 'summer', label: 'Summer (Jun-Aug)', icon: '☀️' },
    { value: 'autumn', label: 'Autumn (Sep-Nov)', icon: '🍂' },
    { value: 'winter', label: 'Winter (Dec-Feb)', icon: '❄️' }
  ];

  const handleInputChange = (field: keyof TripDetails, value: any) => {
    setTripDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    const currentInterests = tripDetails.interests;
    const updatedInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    
    handleInputChange('interests', updatedInterests);
  };

  const generateItinerary = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/itinerary/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tripDetails,
          userId: '507f1f77bcf86cd799439011' // Mock user ID
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setGeneratedItinerary(data.itinerary.itineraryData);
        setStep(3);
        toast.success('🎉 Your AI-powered itinerary is ready!');
      } else {
        toast.error(data.message || 'Failed to generate itinerary');
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast.error('Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/itinerary/suggest-destinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripDetails),
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  const exportItinerary = () => {
    if (!generatedItinerary) return;
    
    const dataStr = JSON.stringify(generatedItinerary, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${tripDetails.destination.replace(/\s+/g, '_')}_itinerary.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Itinerary exported successfully!');
  };

  const regenerateItinerary = async (modifications: string) => {
    setLoading(true);
    try {
      // This would call the regenerate API endpoint
      toast.success('Regenerating itinerary with your preferences...');
      // For now, just show success message
      setLoading(false);
    } catch (error) {
      toast.error('Failed to regenerate itinerary');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 2) {
      getSuggestions();
    }
  }, [step]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🤖 AI-Powered Trip Planning
              </h2>
              <p className="text-gray-600 text-lg">
                Tell us about your dream trip and our AI will create a personalized itinerary
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Destination */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 inline mr-2" />
                  Destination
                </label>
                <input
                  type="text"
                  value={tripDetails.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder="e.g., Bali, Indonesia"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={tripDetails.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  min="1"
                  max="30"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <DollarSign className="w-4 h-4 inline mr-2" />
                  Total Budget (₹)
                </label>
                <input
                  type="number"
                  value={tripDetails.budget}
                  onChange={(e) => handleInputChange('budget', parseInt(e.target.value))}
                  min="1000"
                  step="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Travelers */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <Users className="w-4 h-4 inline mr-2" />
                  Number of Travelers
                </label>
                <input
                  type="number"
                  value={tripDetails.travelers}
                  onChange={(e) => handleInputChange('travelers', parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Travel Style */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Travel Style
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {travelStyles.map((style) => (
                  <motion.div
                    key={style.value}
                    whileHover={{ scale: 1.02 }}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      tripDetails.travelStyle === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('travelStyle', style.value)}
                  >
                    <div className="text-2xl mb-2">{style.icon}</div>
                    <div className="font-medium text-gray-900">{style.label}</div>
                    <div className="text-sm text-gray-600">{style.description}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Interests (select multiple)
              </label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <motion.button
                    key={interest}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      tripDetails.interests.includes(interest)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Season */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Season
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {seasons.map((season) => (
                  <motion.div
                    key={season.value}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-all ${
                      tripDetails.season === season.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleInputChange('season', season.value)}
                  >
                    <div className="text-2xl mb-1">{season.icon}</div>
                    <div className="text-sm font-medium">{season.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={!tripDetails.destination || !tripDetails.duration}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-4 text-lg font-medium"
              >
                Continue to AI Suggestions
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                ✨ AI Destination Suggestions
              </h2>
              <p className="text-gray-600">
                Based on your preferences, here are some perfect destinations
              </p>
            </div>

            {/* Trip Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Your Trip Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-600">Destination</div>
                  <div className="font-medium">{tripDetails.destination}</div>
                </div>
                <div>
                  <div className="text-gray-600">Duration</div>
                  <div className="font-medium">{tripDetails.duration} days</div>
                </div>
                <div>
                  <div className="text-gray-600">Budget</div>
                  <div className="font-medium">₹{tripDetails.budget.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-gray-600">Travelers</div>
                  <div className="font-medium">{tripDetails.travelers} people</div>
                </div>
              </div>
            </div>

            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  🎯 Alternative Destinations You Might Love
                </h3>
                {suggestions.map((suggestion: any, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg text-gray-900">
                        {suggestion.destination}
                      </h4>
                      <div className="text-green-600 font-medium">
                        ₹{suggestion.estimatedCost.toLocaleString()}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{suggestion.reason}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestion.highlights.map((highlight: string, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {highlight}
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      Best time: {suggestion.bestTime}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
              >
                Back to Edit
              </Button>
              <Button
                onClick={generateItinerary}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate AI Itinerary
                    <Sparkles className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Your AI-Generated Itinerary
              </h2>
              <p className="text-gray-600">
                Here's your personalized travel plan for {tripDetails.destination}
              </p>
            </div>

            {generatedItinerary && (
              <>
                {/* Cost Breakdown */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-4">💰 Cost Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{generatedItinerary.costBreakdown.accommodation.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Accommodation</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        ₹{generatedItinerary.costBreakdown.food.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Food</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        ₹{generatedItinerary.costBreakdown.activities.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Activities</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">
                        ₹{generatedItinerary.costBreakdown.transportation.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Transport</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        ₹{generatedItinerary.costBreakdown.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total</div>
                    </div>
                  </div>
                </div>

                {/* Day-by-day Itinerary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">📅 Daily Itinerary</h3>
                  {generatedItinerary.itinerary.map((day, index) => (
                    <motion.div
                      key={day.day}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
                        <h4 className="font-semibold text-lg">
                          Day {day.day}: {day.theme}
                        </h4>
                        <div className="text-blue-100 text-sm">
                          Total cost: ₹{day.totalDayCost.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        {day.activities.map((activity, actIndex) => (
                          <div key={actIndex} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                            <div className="flex-grow">
                              <div className="flex justify-between items-start mb-2">
                                <h5 className="font-medium text-gray-900">{activity.activity}</h5>
                                <div className="text-green-600 font-medium">₹{activity.cost}</div>
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                📍 {activity.location} • ⏱️ {activity.duration} • 🕐 {activity.time}
                              </div>
                              <p className="text-sm text-gray-700">{activity.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tips & Essential Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-yellow-500" />
                      Money-Saving Tips
                    </h3>
                    <ul className="space-y-2">
                      {generatedItinerary.tips.map((tip, index) => (
                        <li key={index} className="text-sm text-gray-700 flex items-start">
                          <span className="text-yellow-500 mr-2">💡</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-blue-500" />
                      Essential Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Weather:</strong> {generatedItinerary.essentialInfo.weather}</div>
                      <div><strong>Currency:</strong> {generatedItinerary.essentialInfo.currency}</div>
                      <div><strong>Language:</strong> {generatedItinerary.essentialInfo.language}</div>
                      <div>
                        <strong>Emergency Numbers:</strong>
                        <ul className="mt-1 ml-4">
                          {generatedItinerary.essentialInfo.emergencyNumbers.map((number: string, index: number) => (
                            <li key={index}>• {number}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <Button
                    onClick={exportItinerary}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Itinerary
                  </Button>
                  <Button
                    onClick={() => regenerateItinerary("Make it more budget-friendly")}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => {
                      // Save to localStorage for now
                      const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
                      const newTrip = {
                        _id: Date.now().toString(),
                        ...tripDetails,
                        itinerary: generatedItinerary.itinerary,
                        totalCost: generatedItinerary.costBreakdown.total,
                        savedAt: new Date().toISOString(),
                        status: 'planned'
                      };
                      savedTrips.push(newTrip);
                      localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
                      toast.success('Itinerary saved to your dashboard!');
                    }}
                    className="bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save to Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      setStep(1);
                      setGeneratedItinerary(null);
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Plan Another Trip
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`h-1 w-20 mx-4 ${
                      step > stepNumber ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Trip Details</span>
            <span>AI Suggestions</span>
            <span>Generated Itinerary</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SmartItineraryGenerator;