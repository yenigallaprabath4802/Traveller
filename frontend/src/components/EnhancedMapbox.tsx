import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Navigation,
  MapPin,
  Navigation2 as Route,
  Clock,
  Car,
  Users,
  Star,
  Phone,
  Globe,
  Camera,
  Bookmark,
  Navigation2,
  Zap,
  Coffee,
  Utensils,
  Bed,
  ShoppingBag,
  Fuel,
  Cross,
  Settings,
  Layers,
  Filter,
  Share2,
  Download,
  RefreshCw
} from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.your-mapbox-token-here';

interface POI {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number];
  rating?: number;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  priceLevel?: number;
  photos?: string[];
  reviews?: number;
  isBookmarked?: boolean;
}

interface RouteInfo {
  distance: string;
  duration: string;
  steps: any[];
  geometry: any;
}

interface MapSettings {
  showTraffic: boolean;
  showPOIs: boolean;
  mapStyle: string;
  routingProfile: string;
  language: string;
}

const EnhancedMapbox: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const directions = useRef<any>(null);
  const geocoder = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [pois, setPOIs] = useState<POI[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRoutingMode, setIsRoutingMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    showTraffic: true,
    showPOIs: true,
    mapStyle: 'mapbox://styles/mapbox/streets-v12',
    routingProfile: 'driving',
    language: 'en'
  });

  const mapStyles = [
    { id: 'streets-v12', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
    { id: 'satellite-v9', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9' },
    { id: 'light-v11', name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
    { id: 'dark-v11', name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
    { id: 'outdoors-v12', name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' }
  ];

  const poiCategories = [
    { id: 'restaurant', name: 'Restaurants', icon: Utensils, color: '#F59E0B' },
    { id: 'hotel', name: 'Hotels', icon: Bed, color: '#3B82F6' },
    { id: 'attraction', name: 'Attractions', icon: Camera, color: '#EF4444' },
    { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: '#8B5CF6' },
    { id: 'gas_station', name: 'Gas Stations', icon: Fuel, color: '#10B981' },
    { id: 'hospital', name: 'Hospitals', icon: Cross, color: '#F87171' },
    { id: 'cafe', name: 'Cafes', icon: Coffee, color: '#92400E' }
  ];

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapSettings.mapStyle,
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 12,
      language: mapSettings.language
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add geolocate control
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true,
      showUserHeading: true
    });
    map.current.addControl(geolocate, 'top-right');

    // Add fullscreen control
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Initialize directions
    directions.current = new MapboxDirections({
      accessToken: mapboxgl.accessToken,
      unit: 'metric',
      profile: mapSettings.routingProfile,
      alternatives: true,
      geometries: 'geojson',
      controls: {
        inputs: true,
        instructions: true,
        profileSwitcher: true
      },
      flyTo: true,
      placeholderOrigin: 'Choose a starting point...',
      placeholderDestination: 'Choose destination...'
    });

    // Initialize geocoder
    geocoder.current = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      placeholder: 'Search for places...',
      proximity: {
        longitude: -74.006,
        latitude: 40.7128
      }
    });

    // Add geocoder to map
    map.current.addControl(geocoder.current, 'top-left');

    // Map event listeners
    map.current.on('load', () => {
      setIsLoaded(true);
      
      // Add traffic layer if enabled
      if (mapSettings.showTraffic) {
        addTrafficLayer();
      }

      // Get user's current location
      getCurrentLocation();
    });

    // Directions event listeners
    directions.current.on('route', (event: any) => {
      const route = event.route[0];
      setRouteInfo({
        distance: (route.distance / 1000).toFixed(1) + ' km',
        duration: Math.round(route.duration / 60) + ' min',
        steps: route.legs[0].steps,
        geometry: route.geometry
      });
    });

    directions.current.on('clear', () => {
      setRouteInfo(null);
    });

    // Click event for POI selection
    map.current.on('click', (e) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: ['poi-layer']
      });

      if (features.length > 0) {
        const feature = features[0];
        const poi = pois.find(p => p.id === feature.properties.id);
        if (poi) {
          setSelectedPOI(poi);
          flyToPOI(poi);
        }
      }
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.setStyle(mapSettings.mapStyle);
    }
  }, [mapSettings.mapStyle, isLoaded]);

  // Toggle traffic layer
  useEffect(() => {
    if (map.current && isLoaded) {
      if (mapSettings.showTraffic) {
        addTrafficLayer();
      } else {
        removeTrafficLayer();
      }
    }
  }, [mapSettings.showTraffic, isLoaded]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude
          ];
          setCurrentLocation(coords);
          
          if (map.current) {
            map.current.flyTo({
              center: coords,
              zoom: 14
            });
          }
          
          toast.success('Location found!');
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Add traffic layer
  const addTrafficLayer = () => {
    if (!map.current?.getSource('mapbox-traffic')) {
      map.current?.addSource('mapbox-traffic', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-traffic-v1'
      });

      map.current?.addLayer({
        id: 'traffic',
        type: 'line',
        source: 'mapbox-traffic',
        'source-layer': 'traffic',
        paint: {
          'line-width': 2,
          'line-color': [
            'case',
            ['==', ['get', 'congestion'], 'low'], '#22c55e',
            ['==', ['get', 'congestion'], 'moderate'], '#f59e0b',
            ['==', ['get', 'congestion'], 'heavy'], '#ef4444',
            ['==', ['get', 'congestion'], 'severe'], '#7c2d12',
            '#6b7280'
          ]
        }
      });
    }
  };

  // Remove traffic layer
  const removeTrafficLayer = () => {
    if (map.current?.getLayer('traffic')) {
      map.current.removeLayer('traffic');
    }
    if (map.current?.getSource('mapbox-traffic')) {
      map.current.removeSource('mapbox-traffic');
    }
  };

  // Search nearby POIs
  const searchNearbyPOIs = async (category: string, center?: [number, number]) => {
    setIsLoading(true);
    
    try {
      const searchCenter = center || currentLocation || [-74.006, 40.7128];
      
      // Call real API
      const response = await fetch(
        `/api/pois/search?latitude=${searchCenter[1]}&longitude=${searchCenter[0]}&category=${category}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch POIs');
      }

      const data = await response.json();
      const fetchedPOIs = data.pois || [];

      setPOIs(fetchedPOIs);
      addPOIsToMap(fetchedPOIs);
      
      toast.success(`Found ${fetchedPOIs.length} places nearby!`);
      
    } catch (error) {
      console.error('Error searching POIs:', error);
      
      // Fallback to mock data if API fails
      const mockPOIs: POI[] = [
        {
          id: '1',
          name: 'Central Park',
          category: 'attraction',
          coordinates: [-73.9665, 40.7829],
          rating: 4.8,
          description: 'Beautiful urban park in Manhattan',
          address: 'New York, NY 10024',
          hours: '6:00 AM - 1:00 AM',
          photos: ['https://example.com/photo1.jpg'],
          reviews: 12543
        },
        {
          id: '2',
          name: 'The Plaza Hotel',
          category: 'hotel',
          coordinates: [-73.9743, 40.7648],
          rating: 4.6,
          description: 'Luxury hotel in Midtown Manhattan',
          address: '768 5th Ave, New York, NY 10019',
          phone: '+1 212-759-3000',
          website: 'https://theplaza.com',
          priceLevel: 4
        },
        {
          id: '3',
          name: 'Katz\'s Delicatessen',
          category: 'restaurant',
          coordinates: [-73.9873, 40.7223],
          rating: 4.4,
          description: 'Famous Jewish deli since 1888',
          address: '205 E Houston St, New York, NY 10002',
          phone: '+1 212-254-2246',
          hours: '8:00 AM - 10:45 PM'
        }
      ];

      const filteredPOIs = category === 'all' 
        ? mockPOIs 
        : mockPOIs.filter(poi => poi.category === category);

      setPOIs(filteredPOIs);
      addPOIsToMap(filteredPOIs);
      
      toast.error('Using offline data - check your connection');
      
    } finally {
      setIsLoading(false);
    }
  };

  // Add POIs to map
  const addPOIsToMap = (pois: POI[]) => {
    if (!map.current) return;

    // Remove existing POI layer
    if (map.current.getLayer('poi-layer')) {
      map.current.removeLayer('poi-layer');
    }
    if (map.current.getSource('pois')) {
      map.current.removeSource('pois');
    }

    // Create GeoJSON source
    const geojson = {
      type: 'FeatureCollection',
      features: pois.map(poi => ({
        type: 'Feature',
        properties: {
          id: poi.id,
          name: poi.name,
          category: poi.category,
          rating: poi.rating
        },
        geometry: {
          type: 'Point',
          coordinates: poi.coordinates
        }
      }))
    };

    // Add source
    map.current.addSource('pois', {
      type: 'geojson',
      data: geojson as any
    });

    // Add layer
    map.current.addLayer({
      id: 'poi-layer',
      type: 'circle',
      source: 'pois',
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10, 8,
          15, 12,
          20, 16
        ],
        'circle-color': [
          'match',
          ['get', 'category'],
          'restaurant', '#F59E0B',
          'hotel', '#3B82F6',
          'attraction', '#EF4444',
          'shopping', '#8B5CF6',
          'gas_station', '#10B981',
          'hospital', '#F87171',
          'cafe', '#92400E',
          '#6B7280'
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Add labels
    map.current.addLayer({
      id: 'poi-labels',
      type: 'symbol',
      source: 'pois',
      layout: {
        'text-field': ['get', 'name'],
        'text-offset': [0, 2],
        'text-anchor': 'top',
        'text-size': 12
      },
      paint: {
        'text-color': '#1f2937',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1
      }
    });
  };

  // Fly to POI
  const flyToPOI = (poi: POI) => {
    if (map.current) {
      map.current.flyTo({
        center: poi.coordinates,
        zoom: 16,
        duration: 2000
      });
    }
  };

  // Toggle routing mode
  const toggleRoutingMode = () => {
    if (!map.current) return;

    if (isRoutingMode) {
      map.current.removeControl(directions.current);
      setRouteInfo(null);
    } else {
      map.current.addControl(directions.current, 'top-left');
    }
    
    setIsRoutingMode(!isRoutingMode);
  };

  // Bookmark POI
  const toggleBookmark = (poi: POI) => {
    const updatedPOIs = pois.map(p => 
      p.id === poi.id ? { ...p, isBookmarked: !p.isBookmarked } : p
    );
    setPOIs(updatedPOIs);
    
    const action = poi.isBookmarked ? 'removed from' : 'added to';
    toast.success(`${poi.name} ${action} bookmarks`);
  };

  // Share location
  const shareLocation = async (poi?: POI) => {
    const shareData = poi ? {
      title: poi.name,
      text: `Check out ${poi.name}!`,
      url: `https://www.google.com/maps/@${poi.coordinates[1]},${poi.coordinates[0]},15z`
    } : {
      title: 'My Location',
      text: 'Here is my current location',
      url: currentLocation ? 
        `https://www.google.com/maps/@${currentLocation[1]},${currentLocation[0]},15z` : 
        'https://wanderlust-app.com'
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Location link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Failed to share location');
    }
  };

  // Download map as image
  const downloadMap = () => {
    if (map.current) {
      const canvas = map.current.getCanvas();
      const link = document.createElement('a');
      link.download = `map-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Map image downloaded!');
    }
  };

  return (
    <div className="h-screen bg-gray-100 relative">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading enhanced map...</p>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
        {/* POI Categories */}
        <div className="bg-white rounded-lg shadow-lg p-3">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Find Places</h3>
          <div className="grid grid-cols-2 gap-2">
            {poiCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => searchNearbyPOIs(category.id)}
                  disabled={isLoading}
                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-50 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  style={{ borderLeft: `3px solid ${category.color}` }}
                >
                  <IconComponent className="w-3 h-3" style={{ color: category.color }} />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Route Info */}
        <AnimatePresence>
          {routeInfo && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg shadow-lg p-3"
            >
              <h3 className="text-sm font-medium text-gray-900 mb-2">Route Information</h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Route className="w-3 h-3 text-blue-500" />
                  <span>Distance: {routeInfo.distance}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-green-500" />
                  <span>Duration: {routeInfo.duration}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="absolute top-4 right-20 space-y-2 z-10">
        <Button
          onClick={toggleRoutingMode}
          className={`p-2 ${isRoutingMode ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'} shadow-lg hover:shadow-xl`}
        >
          <Navigation className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-white text-gray-700 shadow-lg hover:shadow-xl"
        >
          <Settings className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={getCurrentLocation}
          className="p-2 bg-white text-gray-700 shadow-lg hover:shadow-xl"
        >
          <Navigation2 className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={() => shareLocation()}
          className="p-2 bg-white text-gray-700 shadow-lg hover:shadow-xl"
        >
          <Share2 className="w-5 h-5" />
        </Button>
        
        <Button
          onClick={downloadMap}
          className="p-2 bg-white text-gray-700 shadow-lg hover:shadow-xl"
        >
          <Download className="w-5 h-5" />
        </Button>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-2xl z-20"
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Map Settings</h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Map Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Map Style
                </label>
                <select
                  value={mapSettings.mapStyle}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, mapStyle: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {mapStyles.map(style => (
                    <option key={style.id} value={style.url}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Traffic Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Show Traffic
                </label>
                <button
                  onClick={() => setMapSettings(prev => ({ ...prev, showTraffic: !prev.showTraffic }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    mapSettings.showTraffic ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mapSettings.showTraffic ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* POIs Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Show Points of Interest
                </label>
                <button
                  onClick={() => setMapSettings(prev => ({ ...prev, showPOIs: !prev.showPOIs }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    mapSettings.showPOIs ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mapSettings.showPOIs ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Routing Profile */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Routing Profile
                </label>
                <select
                  value={mapSettings.routingProfile}
                  onChange={(e) => setMapSettings(prev => ({ ...prev, routingProfile: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="driving">Driving</option>
                  <option value="walking">Walking</option>
                  <option value="cycling">Cycling</option>
                  <option value="driving-traffic">Driving (Traffic)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POI Details Panel */}
      <AnimatePresence>
        {selectedPOI && (
          <motion.div
            initial={{ opacity: 0, y: 300 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 300 }}
            className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-2xl z-20 max-w-md mx-auto"
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedPOI.name}</h3>
                  {selectedPOI.rating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {selectedPOI.rating} ({selectedPOI.reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleBookmark(selectedPOI)}
                    className={`p-2 rounded-full ${
                      selectedPOI.isBookmarked ? 'text-red-500' : 'text-gray-400'
                    } hover:bg-gray-100`}
                  >
                    <Bookmark className="w-4 h-4" fill={selectedPOI.isBookmarked ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => setSelectedPOI(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  >
                    ×
                  </button>
                </div>
              </div>

              {selectedPOI.description && (
                <p className="text-sm text-gray-600 mb-3">{selectedPOI.description}</p>
              )}

              <div className="space-y-2 text-sm">
                {selectedPOI.address && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedPOI.address}</span>
                  </div>
                )}
                {selectedPOI.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedPOI.phone}`} className="text-blue-500 hover:underline">
                      {selectedPOI.phone}
                    </a>
                  </div>
                )}
                {selectedPOI.website && (
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a 
                      href={selectedPOI.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {selectedPOI.hours && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{selectedPOI.hours}</span>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-4">
                <Button
                  onClick={() => shareLocation(selectedPOI)}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button
                  onClick={() => {
                    if (directions.current && map.current) {
                      directions.current.setDestination(selectedPOI.coordinates);
                      if (!isRoutingMode) toggleRoutingMode();
                    }
                  }}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm py-2"
                >
                  <Navigation className="w-4 h-4 mr-1" />
                  Directions
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
            <span className="text-sm text-gray-600">Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedMapbox;