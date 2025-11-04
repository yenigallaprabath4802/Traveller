import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Luggage,
  MapPin,
  Calendar,
  Activity,
  Cloud,
  CheckCircle,
  AlertCircle,
  Plus,
  Minus,
  Settings,
  Download,
  Share,
  Lightbulb,
  TrendingUp,
  Package,
  Clock,
  Target,
  Brain,
  Star,
  Filter
} from 'lucide-react';

interface PackingItem {
  item: string;
  quantity: number;
  priority: 'essential' | 'recommended' | 'optional';
  category: string;
  reason?: string;
  activity?: string;
  packed?: boolean;
}

interface TripData {
  destination: string;
  dates: {
    start: string;
    end: string;
  };
  activities: string[];
  accommodation: string;
  transport: string;
  budget: string;
  travelerType: string;
  userPreferences: Record<string, any>;
}

interface WeatherData {
  temperatureRange: { min: number; max: number };
  precipitation: string;
  conditions: string;
  recommendations: string[];
  temperature?: string;
  packingFocus?: string[];
}

interface PackingStats {
  totalItems: number;
  essentialItems: number;
  optionalItems: number;
  categoryBreakdown: Record<string, number>;
  packingEfficiency: number;
}

const SmartPackingAssistant: React.FC = () => {
  const [tripData, setTripData] = useState<TripData>({
    destination: '',
    dates: { start: '', end: '' },
    activities: [],
    accommodation: 'hotel',
    transport: 'flight',
    budget: 'medium',
    travelerType: 'leisure',
    userPreferences: {}
  });

  const [packingList, setPackingList] = useState<Record<string, PackingItem[]>>({});
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [packingStats, setPackingStats] = useState<PackingStats | null>(null);
  const [insights, setInsights] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showPacked, setShowPacked] = useState(true);

  const activities = [
    'beach', 'hiking', 'business', 'adventure', 'cultural', 'urban',
    'skiing', 'camping', 'festival', 'photography', 'food tour', 'spa'
  ];

  const accommodationTypes = ['hotel', 'hostel', 'vacation_rental', 'camping', 'resort'];
  const transportTypes = ['flight', 'car', 'train', 'bus', 'cruise'];
  const budgetTypes = ['budget', 'medium', 'luxury'];
  const travelerTypes = ['leisure', 'business', 'adventure', 'family', 'solo', 'couple'];

  // Generate packing list
  const generatePackingList = async () => {
    if (!tripData.destination || !tripData.dates.start || !tripData.dates.end) {
      alert('Please fill in destination and travel dates');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/smart-packing/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(tripData)
      });

      const data = await response.json();
      if (data.success) {
        setPackingList(data.data.packingList);
        setWeatherData(data.data.weatherSummary);
        setPackingStats(data.data.packingStats);
        setTimeline(data.data.timeline);
        setTips(data.data.tips);
        setActiveTab('list');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error generating packing list:', error);
      alert('Failed to generate packing list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get personalized insights
  const getPersonalizedInsights = async () => {
    if (!tripData.destination) return;

    try {
      const response = await fetch('/api/smart-packing/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          destination: tripData.destination,
          duration: calculateDuration(),
          activities: tripData.activities,
          climate: 'temperate' // This could be enhanced
        })
      });

      const data = await response.json();
      if (data.success) {
        setInsights(data.data);
      }
    } catch (error) {
      console.error('Error getting insights:', error);
    }
  };

  // Calculate trip duration
  const calculateDuration = () => {
    if (!tripData.dates.start || !tripData.dates.end) return 0;
    const start = new Date(tripData.dates.start);
    const end = new Date(tripData.dates.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Toggle item packed status
  const toggleItemPacked = (category: string, index: number) => {
    const updatedList = { ...packingList };
    updatedList[category][index].packed = !updatedList[category][index].packed;
    setPackingList(updatedList);
  };

  // Update item quantity
  const updateItemQuantity = (category: string, index: number, change: number) => {
    const updatedList = { ...packingList };
    const newQuantity = Math.max(0, updatedList[category][index].quantity + change);
    updatedList[category][index].quantity = newQuantity;
    setPackingList(updatedList);
  };

  // Filter items based on category and priority
  const getFilteredItems = (items: PackingItem[]) => {
    return items.filter(item => {
      const categoryMatch = selectedCategory === 'all' || item.category === selectedCategory;
      const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
      const packedMatch = showPacked || !item.packed;
      return categoryMatch && priorityMatch && packedMatch;
    });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'essential': return 'text-red-600 bg-red-50';
      case 'recommended': return 'text-orange-600 bg-orange-50';
      case 'optional': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!packingList || Object.keys(packingList).length === 0) return 0;
    
    let totalItems = 0;
    let packedItems = 0;
    
    Object.values(packingList).forEach(category => {
      category.forEach(item => {
        totalItems += item.quantity;
        if (item.packed) packedItems += item.quantity;
      });
    });
    
    return totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
  };

  // Load insights when destination changes
  useEffect(() => {
    if (tripData.destination && tripData.dates.start) {
      getPersonalizedInsights();
    }
  }, [tripData.destination, tripData.dates.start]);

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="mr-3"
            >
              <Luggage size={48} className="text-indigo-600" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-800">Smart Packing Assistant</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered packing recommendations tailored to your destination, activities, and travel style
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-8 bg-white rounded-lg p-2 shadow-md">
          {[
            { id: 'generate', label: 'Generate List', icon: Brain },
            { id: 'list', label: 'Packing List', icon: Package },
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'timeline', label: 'Timeline', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-lg mx-1 mb-2 transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={20} className="mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Settings className="mr-3 text-indigo-600" />
                Trip Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Destination */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin size={16} className="inline mr-1" />
                    Destination
                  </label>
                  <input
                    type="text"
                    value={tripData.destination}
                    onChange={(e) => setTripData({ ...tripData, destination: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter destination"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripData.dates.start}
                    onChange={(e) => setTripData({ ...tripData, dates: { ...tripData.dates, start: e.target.value } })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar size={16} className="inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripData.dates.end}
                    onChange={(e) => setTripData({ ...tripData, dates: { ...tripData.dates, end: e.target.value } })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Accommodation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Accommodation</label>
                  <select
                    value={tripData.accommodation}
                    onChange={(e) => setTripData({ ...tripData, accommodation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {accommodationTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transport</label>
                  <select
                    value={tripData.transport}
                    onChange={(e) => setTripData({ ...tripData, transport: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {transportTypes.map(type => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                  <select
                    value={tripData.budget}
                    onChange={(e) => setTripData({ ...tripData, budget: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {budgetTypes.map(type => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Activities */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Activity size={16} className="inline mr-1" />
                  Planned Activities
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {activities.map(activity => (
                    <label key={activity} className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tripData.activities.includes(activity)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTripData({ ...tripData, activities: [...tripData.activities, activity] });
                          } else {
                            setTripData({ ...tripData, activities: tripData.activities.filter(a => a !== activity) });
                          }
                        }}
                        className="mr-2 text-indigo-600"
                      />
                      <span className="text-sm text-gray-700 capitalize">{activity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Traveler Type */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Traveler Type</label>
                <div className="flex flex-wrap gap-3">
                  {travelerTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setTripData({ ...tripData, travelerType: type })}
                      className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                        tripData.travelerType === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-8 text-center">
                <motion.button
                  onClick={generatePackingList}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Smart Packing List...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Brain className="mr-2" />
                      Generate AI-Powered Packing List
                    </div>
                  )}
                </motion.button>
              </div>

              {/* Trip Summary */}
              {tripData.destination && tripData.dates.start && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border"
                >
                  <h3 className="font-semibold text-gray-800 mb-2">Trip Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Destination:</span>
                      <div className="font-medium">{tripData.destination}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <div className="font-medium">{calculateDuration()} days</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Activities:</span>
                      <div className="font-medium">{tripData.activities.length} selected</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <div className="font-medium capitalize">{tripData.travelerType}</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Packing List Tab */}
          {activeTab === 'list' && Object.keys(packingList).length > 0 && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Progress and Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Packing Progress</h2>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">{progress}%</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <motion.div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                </div>

                {packingStats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{packingStats.totalItems}</div>
                      <div className="text-sm text-gray-600">Total Items</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{packingStats.essentialItems}</div>
                      <div className="text-sm text-gray-600">Essential</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{packingStats.optionalItems}</div>
                      <div className="text-sm text-gray-600">Optional</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{packingStats.packingEfficiency}%</div>
                      <div className="text-sm text-gray-600">Efficiency</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center">
                    <Filter size={20} className="mr-2 text-gray-600" />
                    <span className="font-medium text-gray-700">Filters:</span>
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {Object.keys(packingList).map(category => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="essential">Essential</option>
                    <option value="recommended">Recommended</option>
                    <option value="optional">Optional</option>
                  </select>

                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPacked}
                      onChange={(e) => setShowPacked(e.target.checked)}
                      className="mr-2 text-indigo-600"
                    />
                    <span className="text-gray-700">Show packed items</span>
                  </label>
                </div>
              </div>

              {/* Packing List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Object.entries(packingList).map(([category, items]) => {
                  const filteredItems = getFilteredItems(items);
                  if (filteredItems.length === 0) return null;

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        <h3 className="text-lg font-semibold capitalize flex items-center">
                          <Package className="mr-2" size={20} />
                          {category}
                          <span className="ml-auto text-sm bg-white bg-opacity-20 px-2 py-1 rounded">
                            {filteredItems.length}
                          </span>
                        </h3>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {filteredItems.map((item, index) => (
                          <motion.div
                            key={`${item.item}-${index}`}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                              item.packed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                            }`}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center flex-1">
                              <button
                                onClick={() => toggleItemPacked(category, items.indexOf(item))}
                                className={`mr-3 p-1 rounded-full transition-colors ${
                                  item.packed ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                                }`}
                              >
                                <CheckCircle size={20} />
                              </button>
                              
                              <div className="flex-1">
                                <div className={`font-medium ${item.packed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {item.item.replace(/_/g, ' ').toUpperCase()}
                                </div>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                    {item.priority}
                                  </span>
                                  {item.reason && (
                                    <span className="text-xs text-gray-500 truncate">
                                      {item.reason.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateItemQuantity(category, items.indexOf(item), -1)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                disabled={item.quantity <= 0}
                              >
                                <Minus size={16} />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateItemQuantity(category, items.indexOf(item), 1)}
                                className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Weather Summary */}
              {weatherData && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-white rounded-xl shadow-lg p-6"
                >
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Cloud className="mr-2 text-blue-500" />
                    Weather Considerations
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-lg font-semibold text-blue-600">Temperature</div>
                      <div className="text-gray-700">{weatherData.temperature}</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">Precipitation</div>
                      <div className="text-gray-700 capitalize">{weatherData.precipitation}</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-lg font-semibold text-purple-600">Conditions</div>
                      <div className="text-gray-700 capitalize">{weatherData.conditions}</div>
                    </div>
                  </div>
                  {weatherData.packingFocus && weatherData.packingFocus.length > 0 && (
                    <div className="mt-4">
                      <div className="font-medium text-gray-700 mb-2">Packing Focus:</div>
                      <div className="flex flex-wrap gap-2">
                        {weatherData.packingFocus.map((focus, index) => (
                          <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap justify-center gap-4">
                <motion.button
                  className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="mr-2" size={20} />
                  Export List
                </motion.button>
                <motion.button
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Share className="mr-2" size={20} />
                  Share List
                </motion.button>
                <motion.button
                  onClick={() => setActiveTab('insights')}
                  className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Lightbulb className="mr-2" size={20} />
                  View Insights
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Smart Tips */}
              {tips.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Lightbulb className="mr-2 text-yellow-500" />
                    Smart Packing Tips
                  </h3>
                  <div className="space-y-4">
                    {tips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border-l-4 border-yellow-400 bg-yellow-50 rounded-r-lg"
                      >
                        <div className="font-medium text-gray-800 capitalize">{tip.category?.replace('_', ' ')}</div>
                        <div className="text-gray-700 mt-1">{tip.tip}</div>
                        {tip.benefit && (
                          <div className="text-sm text-gray-600 mt-2 italic">💡 {tip.benefit}</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Personalized Insights */}
              {insights && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Brain className="mr-2 text-indigo-500" />
                    AI Insights
                  </h3>
                  
                  {insights.insights && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-700 mb-2">Personalized Recommendations</h4>
                      <div className="space-y-2">
                        {insights.insights.map((insight: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <Star className="mr-2 mt-1 text-blue-500 flex-shrink-0" size={16} />
                            <span className="text-gray-700">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.priorities && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-700 mb-2">Priority Items</h4>
                      <div className="space-y-2">
                        {insights.priorities.map((priority: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <Target className="mr-2 mt-1 text-red-500 flex-shrink-0" size={16} />
                            <span className="text-gray-700">{priority}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {insights.warnings && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Important Reminders</h4>
                      <div className="space-y-2">
                        {insights.warnings.map((warning: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <AlertCircle className="mr-2 mt-1 text-orange-500 flex-shrink-0" size={16} />
                            <span className="text-gray-700">{warning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && timeline.length > 0 && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Clock className="mr-3 text-indigo-600" />
                Packing Timeline
              </h3>
              
              <div className="space-y-6">
                {timeline.map((period, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="relative pl-8 pb-6 border-l-2 border-indigo-200 last:border-l-0"
                  >
                    <div className="absolute -left-3 top-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3 text-lg capitalize">
                        {period.timeframe}
                      </h4>
                      <ul className="space-y-2">
                        {period.tasks.map((task: string, taskIndex: number) => (
                          <li key={taskIndex} className="flex items-start">
                            <CheckCircle className="mr-2 mt-1 text-green-500 flex-shrink-0" size={16} />
                            <span className="text-gray-700">{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {activeTab === 'list' && Object.keys(packingList).length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12 bg-white rounded-xl shadow-lg"
          >
            <Luggage size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Packing List Generated</h3>
            <p className="text-gray-500 mb-6">Generate your personalized packing list to get started</p>
            <button
              onClick={() => setActiveTab('generate')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Generate Packing List
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SmartPackingAssistant;