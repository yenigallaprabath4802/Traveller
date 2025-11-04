import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera,
  MapPin,
  Compass,
  Search,
  Info,
  Star,
  Clock,
  Navigation,
  Phone,
  Globe,
  Eye,
  EyeOff,
  Settings,
  Crosshair,
  Zap,
  Heart,
  Share2,
  Bookmark,
  Filter,
  RefreshCw,
  Target,
  X
} from 'lucide-react';
import Button from './Button';

// AR and POI interfaces
interface POI {
  id: string;
  name: string;
  category: 'restaurant' | 'hotel' | 'attraction' | 'shop' | 'transport' | 'medical' | 'entertainment';
  coordinates: {
    lat: number;
    lng: number;
  };
  distance: number;
  bearing: number;
  rating: number;
  priceRange: string;
  isOpen: boolean;
  description: string;
  phone?: string;
  website?: string;
  tags: string[];
  photos: string[];
  reviews: number;
  estimatedTime: string;
  historicalInfo?: string;
}

interface ARMarker {
  id: string;
  poi: POI;
  screenPosition: {
    x: number;
    y: number;
  };
  isVisible: boolean;
  scale: number;
}

interface CameraPosition {
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
  accuracy: number;
}

interface ARSettings {
  maxDistance: number;
  showCategories: string[];
  minRating: number;
  showHistorical: boolean;
  showDistance: boolean;
  showRating: boolean;
  markerSize: 'small' | 'medium' | 'large';
}

const ARLocationDiscovery: React.FC = () => {
  // Video and canvas refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // State management
  const [isARActive, setIsARActive] = useState(false);
  const [cameraPosition, setCameraPosition] = useState<CameraPosition | null>(null);
  const [pois, setPois] = useState<POI[]>([]);
  const [arMarkers, setArMarkers] = useState<ARMarker[]>([]);
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [compass, setCompass] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  // AR Settings
  const [arSettings, setArSettings] = useState<ARSettings>({
    maxDistance: 1000, // meters
    showCategories: ['restaurant', 'attraction', 'hotel', 'shop'],
    minRating: 3.0,
    showHistorical: true,
    showDistance: true,
    showRating: true,
    markerSize: 'medium'
  });

  // Initialize AR system
  useEffect(() => {
    requestPermissions();
    return () => {
      stopAR();
    };
  }, []);

  // Update AR markers when POIs or camera position changes
  useEffect(() => {
    if (isARActive && cameraPosition && pois.length > 0) {
      updateARMarkers();
    }
  }, [pois, cameraPosition, deviceOrientation, isARActive]);

  // Request necessary permissions
  const requestPermissions = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Request location permission
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCameraPosition({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              heading: 0,
              pitch: 0,
              accuracy: position.coords.accuracy
            });
          },
          (error) => console.error('Geolocation error:', error),
          { enableHighAccuracy: true }
        );
      }

      // Request device orientation permission (for iOS)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleDeviceOrientation);
        }
      } else {
        // For Android and other devices
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }

      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      setPermissionsGranted(true);

    } catch (error) {
      console.error('Permission denied:', error);
      alert('Camera and location permissions are required for AR features.');
    }
  };

  // Handle device orientation changes
  const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
    if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
      setDeviceOrientation({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma
      });
      setCompass(event.alpha);
    }
  };

  // Start AR camera
  const startAR = async () => {
    if (!permissionsGranted) {
      await requestPermissions();
      return;
    }

    try {
      setIsLoading(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsARActive(true);
        
        // Start location tracking
        startLocationTracking();
        
        // Load nearby POIs
        await loadNearbyPOIs();
      }

    } catch (error) {
      console.error('Error starting AR:', error);
      alert('Failed to start AR camera. Please check permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stop AR camera
  const stopAR = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsARActive(false);
  };

  // Start continuous location tracking
  const startLocationTracking = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.watchPosition(
        (position) => {
          setCameraPosition(prev => ({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading || prev?.heading || 0,
            pitch: 0,
            accuracy: position.coords.accuracy
          }));
        },
        (error) => console.error('Location tracking error:', error),
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    }
  };

  // Load nearby POIs
  const loadNearbyPOIs = async () => {
    if (!cameraPosition) return;

    try {
      setIsLoading(true);
      
      // Generate mock POIs for demonstration
      const mockPOIs = generateMockPOIs(cameraPosition);
      
      // Filter POIs based on settings
      const filteredPOIs = mockPOIs.filter(poi => 
        poi.distance <= arSettings.maxDistance &&
        arSettings.showCategories.includes(poi.category) &&
        poi.rating >= arSettings.minRating
      );

      setPois(filteredPOIs);

    } catch (error) {
      console.error('Error loading POIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock POIs for demonstration
  const generateMockPOIs = (position: CameraPosition): POI[] => {
    const categories: POI['category'][] = ['restaurant', 'hotel', 'attraction', 'shop', 'transport', 'medical', 'entertainment'];
    const mockPOIs: POI[] = [];

    for (let i = 0; i < 50; i++) {
      // Generate random coordinates within specified radius
      const distance = Math.random() * arSettings.maxDistance;
      const bearing = Math.random() * 360;
      
      const coords = offsetCoordinates(position, distance, bearing);
      
      mockPOIs.push({
        id: `poi_${i}`,
        name: generatePOIName(categories[i % categories.length]),
        category: categories[i % categories.length],
        coordinates: coords,
        distance: Math.round(distance),
        bearing: Math.round(bearing),
        rating: 3 + Math.random() * 2,
        priceRange: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
        isOpen: Math.random() > 0.2,
        description: 'Discover amazing experiences and local favorites.',
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        website: 'https://example.com',
        tags: generateTags(categories[i % categories.length]),
        photos: [],
        reviews: Math.floor(Math.random() * 500) + 10,
        estimatedTime: `${Math.floor(distance / 80)} min walk`,
        historicalInfo: Math.random() > 0.5 ? generateHistoricalInfo() : undefined
      });
    }

    return mockPOIs;
  };

  // Generate POI names based on category
  const generatePOIName = (category: string): string => {
    const names = {
      restaurant: ['The Golden Fork', 'Bella Vista', 'Ocean Breeze Cafe', 'Mountain View Bistro', 'Urban Kitchen'],
      hotel: ['Grand Palace Hotel', 'Seaside Resort', 'City Center Inn', 'Luxury Suites', 'Boutique Lodge'],
      attraction: ['Historic Monument', 'Art Gallery', 'Scenic Viewpoint', 'Cultural Center', 'Adventure Park'],
      shop: ['Local Crafts', 'Fashion Boutique', 'Souvenir Shop', 'Artisan Market', 'Design Store'],
      transport: ['Metro Station', 'Bus Terminal', 'Taxi Stand', 'Bike Rental', 'Airport Shuttle'],
      medical: ['Medical Center', 'Pharmacy', 'Urgent Care', 'Health Clinic', 'Emergency Services'],
      entertainment: ['Cinema Complex', 'Live Music Venue', 'Comedy Club', 'Sports Bar', 'Gaming Center']
    };
    
    const categoryNames = names[category as keyof typeof names] || ['Local Business'];
    return categoryNames[Math.floor(Math.random() * categoryNames.length)];
  };

  // Generate tags for POI categories
  const generateTags = (category: string): string[] => {
    const tags = {
      restaurant: ['cuisine', 'outdoor seating', 'family-friendly', 'romantic', 'local specialty'],
      hotel: ['luxury', 'budget-friendly', 'business', 'spa', 'pet-friendly'],
      attraction: ['historic', 'family-friendly', 'photography', 'guided tours', 'cultural'],
      shop: ['handmade', 'local', 'souvenirs', 'fashion', 'gifts'],
      transport: ['public', 'accessible', '24/7', 'express', 'local'],
      medical: ['emergency', '24/7', 'walk-in', 'specialist', 'pharmacy'],
      entertainment: ['live music', 'family', 'nightlife', 'sports', 'events']
    };
    
    const categoryTags = tags[category as keyof typeof tags] || ['local business'];
    return categoryTags.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  // Generate historical information
  const generateHistoricalInfo = (): string => {
    const histories = [
      'Built in 1892, this location has served as a gathering place for over a century.',
      'Once the site of a historic market, this area has been a commercial hub since the 1800s.',
      'This building survived the great earthquake of 1906 and has been preserved as a landmark.',
      'Originally constructed as a railway depot, this structure was converted in the 1950s.',
      'This location has been continuously operated by the same family for four generations.'
    ];
    
    return histories[Math.floor(Math.random() * histories.length)];
  };

  // Calculate offset coordinates
  const offsetCoordinates = (origin: CameraPosition, distance: number, bearing: number) => {
    const R = 6371000; // Earth's radius in meters
    const bearingRad = (bearing * Math.PI) / 180;
    const lat1 = (origin.lat * Math.PI) / 180;
    const lng1 = (origin.lng * Math.PI) / 180;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(distance / R) +
      Math.cos(lat1) * Math.sin(distance / R) * Math.cos(bearingRad)
    );

    const lng2 = lng1 + Math.atan2(
      Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
      lat: (lat2 * 180) / Math.PI,
      lng: (lng2 * 180) / Math.PI
    };
  };

  // Update AR markers based on camera position and orientation
  const updateARMarkers = () => {
    if (!cameraPosition || !overlayRef.current) return;

    const markers: ARMarker[] = pois.map(poi => {
      // Calculate relative bearing to POI
      const poiBearing = calculateBearing(cameraPosition, poi.coordinates);
      const relativeBearing = (poiBearing - compass + 360) % 360;
      
      // Calculate screen position
      const screenPosition = calculateScreenPosition(relativeBearing, poi.distance);
      
      // Check if marker should be visible
      const isVisible = Math.abs(relativeBearing) < 45 || Math.abs(relativeBearing - 360) < 45;
      
      // Calculate scale based on distance
      const scale = Math.max(0.5, Math.min(1.5, 1000 / poi.distance));

      return {
        id: poi.id,
        poi,
        screenPosition,
        isVisible,
        scale
      };
    });

    setArMarkers(markers);
  };

  // Calculate bearing between two coordinates
  const calculateBearing = (from: CameraPosition, to: { lat: number; lng: number }): number => {
    const lat1 = (from.lat * Math.PI) / 180;
    const lat2 = (to.lat * Math.PI) / 180;
    const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

    const y = Math.sin(deltaLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  // Calculate screen position for AR marker
  const calculateScreenPosition = (bearing: number, distance: number) => {
    if (!overlayRef.current) return { x: 0, y: 0 };

    const screenWidth = overlayRef.current.clientWidth;
    const screenHeight = overlayRef.current.clientHeight;
    
    // Convert bearing to screen x position
    const normalizedBearing = bearing > 180 ? bearing - 360 : bearing;
    const x = screenWidth / 2 + (normalizedBearing / 45) * (screenWidth / 4);
    
    // Calculate y position based on distance (closer objects appear lower)
    const y = screenHeight / 2 + (1000 - distance) / 1000 * (screenHeight / 4);
    
    return { x: Math.max(0, Math.min(screenWidth, x)), y: Math.max(0, Math.min(screenHeight, y)) };
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    const icons = {
      restaurant: '🍽️',
      hotel: '🏨',
      attraction: '🎯',
      shop: '🛍️',
      transport: '🚌',
      medical: '🏥',
      entertainment: '🎭'
    };
    return icons[category as keyof typeof icons] || '📍';
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      restaurant: 'bg-red-500',
      hotel: 'bg-blue-500',
      attraction: 'bg-purple-500',
      shop: 'bg-green-500',
      transport: 'bg-yellow-500',
      medical: 'bg-pink-500',
      entertainment: 'bg-indigo-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const filteredPOIs = pois.filter(poi =>
    poi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poi.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poi.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* AR Camera View */}
      <div className="relative w-full h-screen">
        {isARActive && (
          <>
            {/* Video stream */}
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            
            {/* AR Overlay Canvas */}
            <div 
              ref={overlayRef}
              className="absolute inset-0 pointer-events-none"
            >
              {/* AR Markers */}
              <AnimatePresence>
                {arMarkers
                  .filter(marker => marker.isVisible)
                  .map((marker) => (
                    <motion.div
                      key={marker.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: 1, 
                        scale: marker.scale,
                        x: marker.screenPosition.x - 24,
                        y: marker.screenPosition.y - 24
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute pointer-events-auto cursor-pointer"
                      onClick={() => setSelectedPOI(marker.poi)}
                    >
                      {/* AR Marker */}
                      <div className={`relative ${getCategoryColor(marker.poi.category)} rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white`}>
                        <span className="text-xl">{getCategoryIcon(marker.poi.category)}</span>
                        
                        {/* Distance indicator */}
                        {arSettings.showDistance && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                            {marker.poi.distance}m
                          </div>
                        )}
                        
                        {/* Rating indicator */}
                        {arSettings.showRating && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            {marker.poi.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>

              {/* Compass */}
              <div className="absolute top-4 right-4 bg-black/70 rounded-full p-4">
                <div className="relative w-16 h-16">
                  <Compass 
                    className="w-16 h-16 text-white"
                    style={{ transform: `rotate(${compass}deg)` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                </div>
                <div className="text-white text-xs text-center mt-2">
                  {Math.round(compass)}°
                </div>
              </div>

              {/* Crosshair */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Crosshair className="w-8 h-8 text-white opacity-50" />
              </div>
            </div>
          </>
        )}

        {/* Startup screen */}
        {!isARActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
            <div className="text-center p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="text-6xl mb-4">👁️</div>
                <h1 className="text-4xl font-bold text-white mb-4">
                  AR Location Discovery
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Discover places around you with augmented reality
                </p>
              </motion.div>

              <Button
                onClick={startAR}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Starting AR...
                  </>
                ) : (
                  <>
                    <Camera className="mr-2 h-5 w-5" />
                    Start AR Discovery
                  </>
                )}
              </Button>

              {!permissionsGranted && (
                <p className="text-sm text-gray-400 mt-4">
                  Camera and location permissions required
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      {isARActive && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-4">
            {/* Search */}
            <div className="flex-1 mr-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search nearby places..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                className="bg-white/10 hover:bg-white/20 text-white p-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={loadNearbyPOIs}
                className="bg-white/10 hover:bg-white/20 text-white p-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button
                onClick={stopAR}
                className="bg-red-600 hover:bg-red-700 text-white p-2"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* POI Stats */}
          <div className="flex justify-between text-sm text-gray-300">
            <span>{filteredPOIs.length} places found</span>
            <span>{arMarkers.filter(m => m.isVisible).length} visible in AR</span>
            {cameraPosition && (
              <span>±{Math.round(cameraPosition.accuracy)}m accuracy</span>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="absolute top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-sm p-6 overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">AR Settings</h3>
              <Button
                onClick={() => setShowSettings(false)}
                className="bg-transparent text-white p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Max Distance */}
              <div>
                <label className="block text-white mb-2">Max Distance: {arSettings.maxDistance}m</label>
                <input
                  type="range"
                  min="100"
                  max="2000"
                  step="100"
                  value={arSettings.maxDistance}
                  onChange={(e) => setArSettings(prev => ({ ...prev, maxDistance: parseInt(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="block text-white mb-2">Categories</label>
                <div className="space-y-2">
                  {['restaurant', 'hotel', 'attraction', 'shop', 'transport', 'medical', 'entertainment'].map(category => (
                    <label key={category} className="flex items-center text-white">
                      <input
                        type="checkbox"
                        checked={arSettings.showCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setArSettings(prev => ({ 
                              ...prev, 
                              showCategories: [...prev.showCategories, category] 
                            }));
                          } else {
                            setArSettings(prev => ({ 
                              ...prev, 
                              showCategories: prev.showCategories.filter(c => c !== category) 
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="mr-2">{getCategoryIcon(category)}</span>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-white mb-2">Min Rating: {arSettings.minRating.toFixed(1)}</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.5"
                  value={arSettings.minRating}
                  onChange={(e) => setArSettings(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                  className="w-full"
                />
              </div>

              {/* Display Options */}
              <div>
                <label className="block text-white mb-2">Display Options</label>
                <div className="space-y-2">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={arSettings.showDistance}
                      onChange={(e) => setArSettings(prev => ({ ...prev, showDistance: e.target.checked }))}
                      className="mr-2"
                    />
                    Show Distance
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={arSettings.showRating}
                      onChange={(e) => setArSettings(prev => ({ ...prev, showRating: e.target.checked }))}
                      className="mr-2"
                    />
                    Show Rating
                  </label>
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={arSettings.showHistorical}
                      onChange={(e) => setArSettings(prev => ({ ...prev, showHistorical: e.target.checked }))}
                      className="mr-2"
                    />
                    Show Historical Info
                  </label>
                </div>
              </div>

              {/* Marker Size */}
              <div>
                <label className="block text-white mb-2">Marker Size</label>
                <select
                  value={arSettings.markerSize}
                  onChange={(e) => setArSettings(prev => ({ ...prev, markerSize: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* POI Details Modal */}
      <AnimatePresence>
        {selectedPOI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedPOI(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <span className="text-3xl mr-3">{getCategoryIcon(selectedPOI.category)}</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPOI.name}</h3>
                    <p className="text-gray-300 capitalize">{selectedPOI.category}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setSelectedPOI(null)}
                  className="bg-transparent text-white p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span className="text-white">{selectedPOI.rating.toFixed(1)}</span>
                    <span className="text-gray-400 ml-2">({selectedPOI.reviews} reviews)</span>
                  </div>
                  <span className="text-white font-semibold">{selectedPOI.priceRange}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-300">
                    <MapPin className="w-4 h-4 mr-1" />
                    {selectedPOI.distance}m away
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedPOI.estimatedTime}
                  </div>
                </div>

                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  selectedPOI.isOpen 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-red-500/20 text-red-300'
                }`}>
                  {selectedPOI.isOpen ? 'Open Now' : 'Closed'}
                </div>

                <p className="text-gray-300">{selectedPOI.description}</p>

                {selectedPOI.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPOI.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {selectedPOI.historicalInfo && arSettings.showHistorical && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                    <div className="flex items-center text-amber-300 mb-2">
                      <Info className="w-4 h-4 mr-2" />
                      Historical Information
                    </div>
                    <p className="text-amber-200 text-sm">{selectedPOI.historicalInfo}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                    <Navigation className="w-4 h-4 mr-2" />
                    Directions
                  </Button>
                  
                  {selectedPOI.phone && (
                    <Button className="bg-green-600 hover:bg-green-700 text-white">
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Bookmark className="w-4 h-4" />
                  </Button>
                  
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
            <p className="text-white">Loading AR data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARLocationDiscovery;