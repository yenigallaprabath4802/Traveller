import React, { useState, useEffect, useRef, useCallback } from 'react';
import Globe from 'react-globe.gl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Heart, 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  Filter,
  Bookmark,
  TrendingUp,
  Users,
  Thermometer,
  Calendar,
  Star,
  X,
  Info,
  Camera
} from 'lucide-react';
import Button from './Button';

// World data types
interface CountryData {
  ISO_A3: string;
  ISO_A2: string;
  NAME: string;
  lat: number;
  lng: number;
  POP_EST: number;
  CONTINENT: string;
  REGION_UN: string;
  SUBREGION: string;
  properties?: {
    NAME: string;
    POP_EST: number;
    CONTINENT: string;
    ECONOMY: string;
    INCOME_GRP: string;
    GDP_MD_EST: number;
  };
}

interface VisitedPlace {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  visitDate: string;
  rating: number;
  notes: string;
  photos: string[];
  category: 'visited' | 'wishlist' | 'current';
  color: string;
  experience: string;
}

interface TravelStats {
  countriesVisited: number;
  continentsVisited: number;
  totalDistance: number;
  favoriteContinent: string;
  travelDays: number;
  wishlistCount: number;
}

const Interactive3DWorldMap: React.FC = () => {
  // Globe reference
  const globeRef = useRef<any>();
  
  // State management
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<VisitedPlace | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'visited' | 'wishlist'>('all');
  const [globeSize, setGlobeSize] = useState(300);
  const [isRotating, setIsRotating] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [travelStats, setTravelStats] = useState<TravelStats | null>(null);
  const [newPlace, setNewPlace] = useState({
    name: '',
    country: '',
    lat: 0,
    lng: 0,
    rating: 5,
    notes: '',
    category: 'visited' as 'visited' | 'wishlist',
    visitDate: new Date().toISOString().split('T')[0]
  });

  // Initialize sample data
  useEffect(() => {
    initializeSampleData();
    loadWorldData();
  }, []);

  // Auto-rotation control
  useEffect(() => {
    if (globeRef.current && isRotating) {
      const interval = setInterval(() => {
        if (globeRef.current) {
          const controls = globeRef.current.controls();
          if (controls) {
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;
            controls.update();
          }
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isRotating]);

  // Calculate travel statistics
  useEffect(() => {
    calculateTravelStats();
  }, [visitedPlaces]);

  const initializeSampleData = () => {
    const samplePlaces: VisitedPlace[] = [
      {
        id: '1',
        name: 'Eiffel Tower',
        country: 'France',
        lat: 48.8584,
        lng: 2.2945,
        visitDate: '2023-06-15',
        rating: 5,
        notes: 'Amazing sunset view from the top! Must visit again.',
        photos: [],
        category: 'visited',
        color: '#22c55e',
        experience: 'Unforgettable romantic dinner at the tower restaurant.'
      },
      {
        id: '2',
        name: 'Mount Fuji',
        country: 'Japan',
        lat: 35.3606,
        lng: 138.7274,
        visitDate: '2023-09-20',
        rating: 5,
        notes: 'Climbed to the summit during cherry blossom season.',
        photos: [],
        category: 'visited',
        color: '#22c55e',
        experience: 'Spiritual experience watching the sunrise from the peak.'
      },
      {
        id: '3',
        name: 'Machu Picchu',
        country: 'Peru',
        lat: -13.1631,
        lng: -72.5450,
        visitDate: '',
        rating: 0,
        notes: 'Dream destination for ancient history exploration.',
        photos: [],
        category: 'wishlist',
        color: '#f59e0b',
        experience: ''
      },
      {
        id: '4',
        name: 'Northern Lights',
        country: 'Norway',
        lat: 69.6492,
        lng: 18.9553,
        visitDate: '',
        rating: 0,
        notes: 'Want to see the aurora borealis in winter.',
        photos: [],
        category: 'wishlist',
        color: '#f59e0b',
        experience: ''
      },
      {
        id: '5',
        name: 'Great Wall of China',
        country: 'China',
        lat: 40.4319,
        lng: 116.5704,
        visitDate: '2023-11-10',
        rating: 4,
        notes: 'Incredible engineering marvel, lots of walking!',
        photos: [],
        category: 'visited',
        color: '#22c55e',
        experience: 'Walked along the wall for hours, breathtaking views.'
      }
    ];

    setVisitedPlaces(samplePlaces);
  };

  const loadWorldData = async () => {
    try {
      // Load world countries data (this would typically come from an API)
      const mockCountries: CountryData[] = [
        {
          ISO_A3: 'FRA',
          ISO_A2: 'FR',
          NAME: 'France',
          lat: 46.2276,
          lng: 2.2137,
          POP_EST: 65273511,
          CONTINENT: 'Europe',
          REGION_UN: 'Europe',
          SUBREGION: 'Western Europe',
          properties: {
            NAME: 'France',
            POP_EST: 65273511,
            CONTINENT: 'Europe',
            ECONOMY: '1. Developed region: G7',
            INCOME_GRP: '1. High income: OECD',
            GDP_MD_EST: 2717000
          }
        },
        {
          ISO_A3: 'JPN',
          ISO_A2: 'JP',
          NAME: 'Japan',
          lat: 36.2048,
          lng: 138.2529,
          POP_EST: 126476461,
          CONTINENT: 'Asia',
          REGION_UN: 'Asia',
          SUBREGION: 'Eastern Asia',
          properties: {
            NAME: 'Japan',
            POP_EST: 126476461,
            CONTINENT: 'Asia',
            ECONOMY: '1. Developed region: G7',
            INCOME_GRP: '1. High income: OECD',
            GDP_MD_EST: 4937000
          }
        }
      ];
      
      setCountries(mockCountries);
    } catch (error) {
      console.error('Error loading world data:', error);
    }
  };

  const calculateTravelStats = () => {
    const visited = visitedPlaces.filter(p => p.category === 'visited');
    const wishlist = visitedPlaces.filter(p => p.category === 'wishlist');
    
    const uniqueCountries = new Set(visited.map(p => p.country));
    const continents = new Set(visited.map(p => {
      // Map countries to continents (simplified)
      const continentMap: { [key: string]: string } = {
        'France': 'Europe',
        'Japan': 'Asia',
        'China': 'Asia',
        'Peru': 'South America',
        'Norway': 'Europe',
        'USA': 'North America',
        'Australia': 'Oceania',
        'Egypt': 'Africa'
      };
      return continentMap[p.country] || 'Unknown';
    }));

    // Calculate total travel distance (simplified)
    let totalDistance = 0;
    for (let i = 1; i < visited.length; i++) {
      const prev = visited[i - 1];
      const curr = visited[i];
      totalDistance += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
    }

    const stats: TravelStats = {
      countriesVisited: uniqueCountries.size,
      continentsVisited: continents.size,
      totalDistance: Math.round(totalDistance),
      favoriteContinent: Array.from(continents)[0] || 'None',
      travelDays: visited.length * 7, // Assume 7 days per trip
      wishlistCount: wishlist.length
    };

    setTravelStats(stats);
  };

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const filteredPlaces = visitedPlaces.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         place.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === 'all' || place.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const handleGlobeClick = useCallback((event: any) => {
    if (event.object) {
      setSelectedCountry(event.object);
    }
  }, []);

  const handlePointClick = useCallback((place: VisitedPlace) => {
    setSelectedPlace(place);
    
    // Focus globe on the clicked place
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: place.lat, lng: place.lng, altitude: 1.5 }, 1000);
    }
  }, []);

  const addNewPlace = () => {
    if (!newPlace.name || !newPlace.country) return;

    const place: VisitedPlace = {
      id: Date.now().toString(),
      ...newPlace,
      photos: [],
      color: newPlace.category === 'visited' ? '#22c55e' : '#f59e0b',
      experience: ''
    };

    setVisitedPlaces(prev => [...prev, place]);
    setNewPlace({
      name: '',
      country: '',
      lat: 0,
      lng: 0,
      rating: 5,
      notes: '',
      category: 'visited',
      visitDate: new Date().toISOString().split('T')[0]
    });
    setShowAddPlace(false);
  };

  const removePlace = (placeId: string) => {
    setVisitedPlaces(prev => prev.filter(p => p.id !== placeId));
    setSelectedPlace(null);
  };

  const toggleWishlist = (placeId: string) => {
    setVisitedPlaces(prev => prev.map(place => 
      place.id === placeId 
        ? { 
            ...place, 
            category: place.category === 'visited' ? 'wishlist' : 'visited',
            color: place.category === 'visited' ? '#f59e0b' : '#22c55e'
          }
        : place
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-4">
            🌍 3D Interactive World Map
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            Explore your travel journey in stunning 3D
          </p>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Button
              onClick={() => setIsRotating(!isRotating)}
              className={`${isRotating ? 'bg-green-600' : 'bg-gray-600'} hover:bg-opacity-80`}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isRotating ? 'Stop Rotation' : 'Start Rotation'}
            </Button>

            <Button
              onClick={() => setShowStats(!showStats)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Travel Stats
            </Button>

            <Button
              onClick={() => setShowAddPlace(!showAddPlace)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Place
            </Button>

            <Button
              onClick={() => {
                if (globeRef.current) {
                  globeRef.current.pointOfView({ lat: 0, lng: 0, altitude: 2.5 }, 1000);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Camera className="mr-2 h-4 w-4" />
              Reset View
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search places..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as 'all' | 'visited' | 'wishlist')}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Places</option>
              <option value="visited">Visited</option>
              <option value="wishlist">Wishlist</option>
            </select>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Globe Container */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <div className="flex justify-center">
                <Globe
                  ref={globeRef}
                  globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                  bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                  backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                  width={Math.min(window.innerWidth * 0.6, 800)}
                  height={600}
                  pointsData={filteredPlaces}
                  pointAltitude={0.02}
                  pointColor={(d: any) => d.color}
                  pointRadius={0.8}
                  pointResolution={20}
                  pointLabel={(d: any) => `
                    <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 8px; color: white; font-size: 12px;">
                      <strong>${d.name}</strong><br/>
                      ${d.country}<br/>
                      ${d.category === 'visited' ? `★ ${d.rating}/5` : '♡ Wishlist'}
                    </div>
                  `}
                  onPointClick={handlePointClick}
                  onGlobeClick={handleGlobeClick}
                  enablePointerInteraction={true}
                  animateIn={true}
                />
              </div>

              {/* Globe Controls */}
              <div className="flex justify-center mt-4 space-x-4">
                <Button
                  onClick={() => setGlobeSize(prev => Math.max(200, prev - 50))}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-white py-2 px-4 bg-white/10 rounded-lg">
                  Size: {globeSize}px
                </span>
                <Button
                  onClick={() => setGlobeSize(prev => Math.min(800, prev + 50))}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Places List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Your Places ({filteredPlaces.length})
              </h3>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredPlaces.map((place) => (
                  <motion.div
                    key={place.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 bg-white/5 border rounded-lg cursor-pointer transition-all duration-200 ${
                      selectedPlace?.id === place.id ? 'border-blue-400 bg-blue-500/20' : 'border-white/20'
                    }`}
                    onClick={() => handlePointClick(place)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-white text-sm">{place.name}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(place.id);
                          }}
                          className="p-1 bg-transparent hover:bg-white/10 rounded"
                        >
                          {place.category === 'visited' ? (
                            <Heart className="h-3 w-3 text-red-500 fill-current" />
                          ) : (
                            <Heart className="h-3 w-3 text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePlace(place.id);
                          }}
                          className="p-1 bg-transparent hover:bg-red-500/20 rounded"
                        >
                          <X className="h-3 w-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-300 mb-1">{place.country}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        place.category === 'visited' 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {place.category === 'visited' ? '✓ Visited' : '♡ Wishlist'}
                      </span>
                      
                      {place.category === 'visited' && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < place.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {place.notes && (
                      <p className="text-xs text-gray-400 mt-2 truncate">{place.notes}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Travel Statistics */}
            <AnimatePresence>
              {showStats && travelStats && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Travel Statistics
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Countries Visited:</span>
                      <span className="text-white font-semibold">{travelStats.countriesVisited}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Continents:</span>
                      <span className="text-white font-semibold">{travelStats.continentsVisited}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Distance:</span>
                      <span className="text-white font-semibold">{travelStats.totalDistance.toLocaleString()} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Travel Days:</span>
                      <span className="text-white font-semibold">{travelStats.travelDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Wishlist Places:</span>
                      <span className="text-white font-semibold">{travelStats.wishlistCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Favorite Continent:</span>
                      <span className="text-white font-semibold">{travelStats.favoriteContinent}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Add Place Modal */}
        <AnimatePresence>
          {showAddPlace && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddPlace(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-2xl font-bold text-white mb-4">Add New Place</h3>

                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Place name"
                    value={newPlace.name}
                    onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <input
                    type="text"
                    placeholder="Country"
                    value={newPlace.country}
                    onChange={(e) => setNewPlace(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Latitude"
                      value={newPlace.lat}
                      onChange={(e) => setNewPlace(prev => ({ ...prev, lat: parseFloat(e.target.value) }))}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Longitude"
                      value={newPlace.lng}
                      onChange={(e) => setNewPlace(prev => ({ ...prev, lng: parseFloat(e.target.value) }))}
                      className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <select
                    value={newPlace.category}
                    onChange={(e) => setNewPlace(prev => ({ ...prev, category: e.target.value as 'visited' | 'wishlist' }))}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="visited">Visited</option>
                    <option value="wishlist">Wishlist</option>
                  </select>

                  {newPlace.category === 'visited' && (
                    <>
                      <input
                        type="date"
                        value={newPlace.visitDate}
                        onChange={(e) => setNewPlace(prev => ({ ...prev, visitDate: e.target.value }))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      <select
                        value={newPlace.rating}
                        onChange={(e) => setNewPlace(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {[1, 2, 3, 4, 5].map(rating => (
                          <option key={rating} value={rating}>
                            {rating} Star{rating !== 1 ? 's' : ''}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  <textarea
                    placeholder="Notes or experience"
                    value={newPlace.notes}
                    onChange={(e) => setNewPlace(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button
                    onClick={() => setShowAddPlace(false)}
                    className="bg-gray-600 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={addNewPlace}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Add Place
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Place Details */}
        <AnimatePresence>
          {selectedPlace && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-4 right-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-sm z-40"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-white">{selectedPlace.name}</h4>
                <Button
                  onClick={() => setSelectedPlace(null)}
                  className="p-1 bg-transparent hover:bg-white/10"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              </div>

              <p className="text-gray-300 mb-2">{selectedPlace.country}</p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    selectedPlace.category === 'visited' 
                      ? 'bg-green-500/20 text-green-300' 
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {selectedPlace.category === 'visited' ? '✓ Visited' : '♡ Wishlist'}
                  </span>
                  
                  {selectedPlace.category === 'visited' && (
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < selectedPlace.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {selectedPlace.visitDate && (
                  <p className="text-sm text-gray-400">
                    <Calendar className="inline mr-1 h-3 w-3" />
                    Visited: {new Date(selectedPlace.visitDate).toLocaleDateString()}
                  </p>
                )}

                {selectedPlace.notes && (
                  <p className="text-sm text-gray-300 mt-2">{selectedPlace.notes}</p>
                )}

                <div className="text-xs text-gray-400 mt-2">
                  Coordinates: {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Country Info */}
        <AnimatePresence>
          {selectedCountry && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed bottom-4 left-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-sm z-40"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-white">{selectedCountry.NAME}</h4>
                <Button
                  onClick={() => setSelectedCountry(null)}
                  className="p-1 bg-transparent hover:bg-white/10"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-300">
                  <Users className="inline mr-1 h-3 w-3" />
                  Population: {selectedCountry.POP_EST.toLocaleString()}
                </p>
                <p className="text-sm text-gray-300">
                  <Info className="inline mr-1 h-3 w-3" />
                  Continent: {selectedCountry.CONTINENT}
                </p>
                <p className="text-sm text-gray-300">
                  <MapPin className="inline mr-1 h-3 w-3" />
                  Region: {selectedCountry.SUBREGION}
                </p>
                <div className="text-xs text-gray-400 mt-2">
                  Center: {selectedCountry.lat.toFixed(2)}°, {selectedCountry.lng.toFixed(2)}°
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Interactive3DWorldMap;