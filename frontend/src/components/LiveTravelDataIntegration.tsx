import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Hotel, Search, Filter, TrendingUp, TrendingDown, 
  Calendar, Users, MapPin, DollarSign, Clock, Star,
  RefreshCw, Bell, Bookmark, ExternalLink, AlertTriangle,
  Zap, Globe, BarChart3, Target, Compass, PiggyBank,
  Timer, Award, Sparkles, ArrowUpDown, Heart, Share2
} from 'lucide-react';

interface FlightResult {
  id: string;
  provider: string;
  price: {
    total: number;
    currency: string;
    base?: number;
  };
  outbound: {
    departure: {
      airport: string;
      time: string;
    };
    arrival: {
      airport: string;
      time: string;
    };
    duration: string;
    carrier: string;
    stops: number;
  };
  return?: any;
  airline: string;
}

interface HotelResult {
  id: string;
  provider: string;
  name: string;
  rating: string;
  location: {
    address: any;
  };
  bestPrice: {
    total: number;
    currency: string;
    perNight: number;
  };
  amenities: string[];
}

interface SearchParams {
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adults?: number;
  children?: number;
  rooms?: number;
  travelClass?: string;
  currency?: string;
}

interface LocationSuggestion {
  id: string;
  name: string;
  type: string;
  country: string;
  provider: string;
}

const LiveTravelDataIntegration: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'flights' | 'hotels' | 'tracking' | 'deals'>('flights');
  const [searchParams, setSearchParams] = useState<SearchParams>({
    adults: 1,
    children: 0,
    rooms: 1,
    travelClass: 'ECONOMY',
    currency: 'USD'
  });
  
  // Search results
  const [flightResults, setFlightResults] = useState<any>(null);
  const [hotelResults, setHotelResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchType, setLastSearchType] = useState<string>('');

  // Location suggestions
  const [originSuggestions, setOriginSuggestions] = useState<LocationSuggestion[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  // Price tracking
  const [priceAlerts, setPriceAlerts] = useState<any[]>([]);
  const [trackingParams, setTrackingParams] = useState<any>({});
  const [livePrices, setLivePrices] = useState<any>(null);

  // Filters and sorting
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating' | 'stops'>('price');
  const [filters, setFilters] = useState<any>({
    maxPrice: null,
    directOnly: false,
    airlines: [],
    maxStops: null
  });

  // UI state
  const [selectedProvider, setSelectedProvider] = useState<string[]>(['amadeus', 'skyscanner']);
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);

  // Debounced location search
  const searchLocations = useCallback(
    debounce(async (query: string, type: 'origin' | 'destination') => {
      if (query.length < 2) return;

      try {
        const response = await fetch(`/api/live-travel/locations/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
          if (type === 'origin') {
            setOriginSuggestions(data.data.suggestions);
          } else {
            setDestinationSuggestions(data.data.suggestions);
          }
        }
      } catch (error) {
        console.error('Location search error:', error);
      }
    }, 300),
    []
  );

  // Search flights
  const searchFlights = async () => {
    if (!searchParams.origin || !searchParams.destination || !searchParams.departureDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSearching(true);
    setLastSearchType('flights');
    
    try {
      const response = await fetch('/api/live-travel/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...searchParams,
          providers: selectedProvider
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFlightResults(data.data);
      } else {
        console.error('Flight search failed:', data.error);
      }
    } catch (error) {
      console.error('Flight search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Search hotels
  const searchHotels = async () => {
    if (!searchParams.destination || !searchParams.checkInDate || !searchParams.checkOutDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSearching(true);
    setLastSearchType('hotels');
    
    try {
      const response = await fetch('/api/live-travel/hotels/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityCode: searchParams.destination,
          checkInDate: searchParams.checkInDate,
          checkOutDate: searchParams.checkOutDate,
          adults: searchParams.adults,
          rooms: searchParams.rooms,
          currency: searchParams.currency,
          providers: selectedProvider
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setHotelResults(data.data);
      } else {
        console.error('Hotel search failed:', data.error);
      }
    } catch (error) {
      console.error('Hotel search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Track prices
  const trackPrices = async () => {
    try {
      const response = await fetch('/api/live-travel/price-tracking/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab === 'flights' ? 'flight' : 'hotel',
          ...searchParams,
          targetPrice: trackingParams.targetPrice,
          userId: 'user123' // This would come from auth context
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Price tracking activated!');
        fetchPriceAlerts();
      }
    } catch (error) {
      console.error('Price tracking error:', error);
    }
  };

  // Fetch price alerts
  const fetchPriceAlerts = async () => {
    try {
      const response = await fetch('/api/live-travel/price-tracking/alerts/user123');
      const data = await response.json();
      
      if (data.success) {
        setPriceAlerts(data.data.active || []);
      }
    } catch (error) {
      console.error('Price alerts fetch error:', error);
    }
  };

  // Load price alerts on mount
  useEffect(() => {
    fetchPriceAlerts();
  }, []);

  // Format price
  const formatPrice = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format duration
  const formatDuration = (duration: string) => {
    const match = duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = match[1] || '0';
      const minutes = match[2] || '0';
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  // Filter and sort results
  const processResults = (results: any[], type: 'flights' | 'hotels') => {
    let filtered = [...results];

    // Apply filters
    if (filters.maxPrice) {
      filtered = filtered.filter(item => {
        const price = type === 'flights' ? item.price?.total : item.bestPrice?.total;
        return price <= filters.maxPrice;
      });
    }

    if (type === 'flights') {
      if (filters.directOnly) {
        filtered = filtered.filter(item => item.outbound?.stops === 0);
      }
      if (filters.maxStops !== null) {
        filtered = filtered.filter(item => (item.outbound?.stops || 0) <= filters.maxStops);
      }
    }

    // Sort results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          const priceA = type === 'flights' ? a.price?.total : a.bestPrice?.total;
          const priceB = type === 'flights' ? b.price?.total : b.bestPrice?.total;
          return (priceA || 0) - (priceB || 0);
        case 'duration':
          if (type === 'flights') {
            const durationA = parseDuration(a.outbound?.duration);
            const durationB = parseDuration(b.outbound?.duration);
            return durationA - durationB;
          }
          return 0;
        case 'rating':
          if (type === 'hotels') {
            const ratingA = parseFloat(a.rating || '0');
            const ratingB = parseFloat(b.rating || '0');
            return ratingB - ratingA;
          }
          return 0;
        case 'stops':
          if (type === 'flights') {
            const stopsA = a.outbound?.stops || 0;
            const stopsB = b.outbound?.stops || 0;
            return stopsA - stopsB;
          }
          return 0;
        default:
          return 0;
      }
    });

    return filtered;
  };

  const parseDuration = (duration: string): number => {
    if (!duration) return 0;
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (match) {
      const hours = parseInt(match[1] || '0');
      const minutes = parseInt(match[2] || '0');
      return hours * 60 + minutes;
    }
    return 0;
  };

  // Render flight results
  const renderFlightResults = () => {
    if (!flightResults?.data?.flights) return null;

    const flights = processResults(flightResults.data.flights, 'flights');

    return (
      <div className="space-y-4">
        {/* Results summary */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-800">
                {flights.length} flights found
              </h3>
              <p className="text-blue-600 text-sm">
                Compared across {Object.keys(flightResults.data.providers || {}).length} providers
              </p>
            </div>
            {flightResults.data.comparison && (
              <div className="text-right">
                <p className="text-blue-800 font-medium">
                  From {formatPrice(flightResults.data.comparison.priceRange?.min || 0)}
                </p>
                <p className="text-blue-600 text-sm">
                  Avg: {formatPrice(flightResults.data.comparison.priceRange?.average || 0)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {flightResults.data.recommendations && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {flightResults.data.recommendations.cheapest && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center mb-2">
                  <PiggyBank className="w-4 h-4 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">Cheapest</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {formatPrice(flightResults.data.recommendations.cheapest.flight.price?.total || 0)}
                </p>
                <p className="text-sm text-green-600">
                  {flightResults.data.recommendations.cheapest.flight.airline}
                </p>
              </div>
            )}
            
            {flightResults.data.recommendations.fastest && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center mb-2">
                  <Timer className="w-4 h-4 text-orange-600 mr-2" />
                  <span className="font-medium text-orange-800">Fastest</span>
                </div>
                <p className="text-2xl font-bold text-orange-700">
                  {formatDuration(flightResults.data.recommendations.fastest.flight.outbound?.duration || '')}
                </p>
                <p className="text-sm text-orange-600">
                  {formatPrice(flightResults.data.recommendations.fastest.flight.price?.total || 0)}
                </p>
              </div>
            )}
            
            {flightResults.data.recommendations.bestValue && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center mb-2">
                  <Award className="w-4 h-4 text-purple-600 mr-2" />
                  <span className="font-medium text-purple-800">Best Value</span>
                </div>
                <p className="text-2xl font-bold text-purple-700">
                  {formatPrice(flightResults.data.recommendations.bestValue.price?.total || 0)}
                </p>
                <p className="text-sm text-purple-600">
                  {flightResults.data.recommendations.bestValue.airline}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Flight list */}
        <div className="space-y-3">
          {flights.slice(0, 10).map((flight: FlightResult, index) => (
            <motion.div
              key={flight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {flight.provider}
                    </div>
                    <span className="font-medium text-gray-800">{flight.airline}</span>
                    {flight.outbound.stops === 0 && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Direct
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div>
                      <p className="font-medium">{flight.outbound.departure.airport}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(flight.outbound.departure.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    
                    <div className="flex-1 text-center">
                      <div className="text-sm text-gray-500">
                        {formatDuration(flight.outbound.duration)}
                      </div>
                      <div className="h-px bg-gray-300 my-2"></div>
                      {flight.outbound.stops > 0 && (
                        <div className="text-xs text-gray-500">
                          {flight.outbound.stops} stop{flight.outbound.stops > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium">{flight.outbound.arrival.airport}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(flight.outbound.arrival.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-right ml-6">
                  <p className="text-2xl font-bold text-gray-800">
                    {formatPrice(flight.price.total, flight.price.currency)}
                  </p>
                  <div className="flex space-x-2 mt-2">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm">
                      <Bookmark className="w-3 h-3" />
                      <span>Save</span>
                    </button>
                    <button className="flex items-center space-x-1 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm">
                      <ExternalLink className="w-3 h-3" />
                      <span>Book</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Render hotel results
  const renderHotelResults = () => {
    if (!hotelResults?.data?.hotels) return null;

    const hotels = processResults(hotelResults.data.hotels, 'hotels');

    return (
      <div className="space-y-4">
        {/* Results summary */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-800">
                {hotels.length} hotels found
              </h3>
              <p className="text-green-600 text-sm">
                {searchParams.checkInDate} - {searchParams.checkOutDate}
              </p>
            </div>
            {hotelResults.data.comparison && (
              <div className="text-right">
                <p className="text-green-800 font-medium">
                  From {formatPrice(hotelResults.data.comparison.priceRange?.min || 0)} /night
                </p>
                <p className="text-green-600 text-sm">
                  Avg: {formatPrice(hotelResults.data.comparison.priceRange?.average || 0)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Hotel list */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {hotels.slice(0, 8).map((hotel: HotelResult, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{hotel.name}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                      {hotel.rating && (
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">{hotel.rating}</span>
                        </div>
                      )}
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {hotel.provider}
                      </span>
                    </div>
                    {hotel.location?.address && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {JSON.stringify(hotel.location.address).slice(1, -1)}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-gray-800">
                      {formatPrice(hotel.bestPrice.total, hotel.bestPrice.currency)}
                    </p>
                    <p className="text-sm text-gray-600">total stay</p>
                    <p className="text-xs text-gray-500">
                      {formatPrice(hotel.bestPrice.perNight, hotel.bestPrice.currency)} /night
                    </p>
                  </div>
                </div>

                {hotel.amenities && hotel.amenities.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                        <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                      {hotel.amenities.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{hotel.amenities.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm">
                    <Heart className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded text-sm">
                    <ExternalLink className="w-3 h-3" />
                    <span>Book</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Live Travel Data</h1>
                <p className="text-gray-600">Real-time flights & hotels with Amadeus & Skyscanner</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  comparisonMode
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
                <span>Compare</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg">
                <Bell className="w-4 h-4" />
                <span>Alerts</span>
                {priceAlerts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {priceAlerts.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'flights', label: 'Flights', icon: Plane },
              { key: 'hotels', label: 'Hotels', icon: Hotel },
              { key: 'tracking', label: 'Price Tracking', icon: BarChart3 },
              { key: 'deals', label: 'Deals', icon: Sparkles }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
            {/* Origin */}
            {activeTab === 'flights' && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Origin city or airport"
                    value={searchParams.origin || ''}
                    onChange={(e) => {
                      setSearchParams(prev => ({ ...prev, origin: e.target.value }));
                      searchLocations(e.target.value, 'origin');
                      setShowOriginSuggestions(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
                </div>
                
                {/* Origin suggestions dropdown */}
                {showOriginSuggestions && originSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {originSuggestions.slice(0, 5).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchParams(prev => ({ ...prev, origin: suggestion.id }));
                          setShowOriginSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.name}</div>
                        <div className="text-sm text-gray-600">{suggestion.country}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Destination */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTab === 'flights' ? 'To' : 'Destination'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Destination city or airport"
                  value={searchParams.destination || ''}
                  onChange={(e) => {
                    setSearchParams(prev => ({ ...prev, destination: e.target.value }));
                    searchLocations(e.target.value, 'destination');
                    setShowDestinationSuggestions(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
              
              {/* Destination suggestions dropdown */}
              {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {destinationSuggestions.slice(0, 5).map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchParams(prev => ({ ...prev, destination: suggestion.id }));
                        setShowDestinationSuggestions(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{suggestion.name}</div>
                      <div className="text-sm text-gray-600">{suggestion.country}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dates */}
            {activeTab === 'flights' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Departure</label>
                  <input
                    type="date"
                    value={searchParams.departureDate || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Return (optional)</label>
                  <input
                    type="date"
                    value={searchParams.returnDate || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, returnDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                  <input
                    type="date"
                    value={searchParams.checkInDate || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, checkInDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
                  <input
                    type="date"
                    value={searchParams.checkOutDate || ''}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </>
            )}
          </div>

          {/* Travelers and Search */}
          <div className="flex items-end space-x-4">
            <div className="flex space-x-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
                <select
                  value={searchParams.adults || 1}
                  onChange={(e) => setSearchParams(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              
              {activeTab === 'flights' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                  <select
                    value={searchParams.children || 0}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[0,1,2,3,4].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'hotels' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                  <select
                    value={searchParams.rooms || 1}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, rooms: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[1,2,3,4].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              onClick={activeTab === 'flights' ? searchFlights : searchHotels}
              disabled={isSearching}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(flightResults || hotelResults) && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-6">
            {/* Sort and Filter Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="price">Price</option>
                    {activeTab === 'flights' && <option value="duration">Duration</option>}
                    {activeTab === 'flights' && <option value="stops">Stops</option>}
                    {activeTab === 'hotels' && <option value="rating">Rating</option>}
                  </select>
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Providers:</span>
                {['amadeus', 'skyscanner'].map(provider => (
                  <button
                    key={provider}
                    onClick={() => {
                      setSelectedProvider(prev =>
                        prev.includes(provider)
                          ? prev.filter(p => p !== provider)
                          : [...prev, provider]
                      );
                    }}
                    className={`px-3 py-1 rounded text-xs font-medium ${
                      selectedProvider.includes(provider)
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {provider}
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {activeTab === 'flights' && renderFlightResults()}
            {activeTab === 'hotels' && renderHotelResults()}
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default LiveTravelDataIntegration;