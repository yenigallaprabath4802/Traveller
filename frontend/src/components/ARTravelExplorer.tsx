import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Navigation, MapPin, Star, Clock, Eye, Compass,
  Target, Zap, Settings, Share2, Heart, Info, ArrowUp,
  Volume2, VolumeX, RotateCcw, Layers, Filter, Search,
  Award, TrendingUp, Sparkles, Globe, Navigation2, 
  Crosshair, CameraOff, Wifi, WifiOff, Battery, Signal,
  AlertTriangle
} from 'lucide-react';

interface ARLandmark {
  id: string;
  name: string;
  category: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance: number;
  bearing: number;
  rating: number;
  arData: {
    priority: number;
    displayType: string;
    iconType: string;
    overlay: {
      title: string;
      subtitle: string;
      quickFacts: string[];
      callToAction: string;
      culturalHighlight?: string;
    };
    animations: {
      entrance: string;
      idle: string;
      selection: string;
    };
  };
}

interface ARExperience {
  id: string;
  title: string;
  description: string;
  landmarks: ARLandmark[];
  gamification: {
    challenges: any[];
    pointSystem: any;
    achievements: string[];
  };
  recommendations: any[];
  metadata: {
    totalLandmarks: number;
    estimatedDuration: string;
    difficulty: string;
    themes: string[];
  };
}

const ARTravelExplorer: React.FC = () => {
  // Core state
  const [isARActive, setIsARActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<{alpha: number; beta: number; gamma: number} | null>(null);
  const [currentBearing, setCurrentBearing] = useState(0);
  
  // AR Experience state
  const [arExperience, setArExperience] = useState<ARExperience | null>(null);
  const [visibleLandmarks, setVisibleLandmarks] = useState<ARLandmark[]>([]);
  const [selectedLandmark, setSelectedLandmark] = useState<ARLandmark | null>(null);
  const [isLoadingExperience, setIsLoadingExperience] = useState(false);

  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showCompass, setShowCompass] = useState(true);
  const [showMiniMap, setShowMiniMap] = useState(true);
  const [arMode, setArMode] = useState<'camera' | 'map' | 'hybrid'>('hybrid');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['attraction', 'restaurant']);
  const [maxDistance, setMaxDistance] = useState(1000);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Camera and AR state
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'pending'>('pending');
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationAccuracy, setCalibrationAccuracy] = useState<'high' | 'medium' | 'low'>('medium');

  // Analytics and gamification
  const [userStats, setUserStats] = useState({
    landmarksDiscovered: 0,
    photosShared: 0,
    points: 0,
    level: 1,
    achievements: []
  });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize AR experience
  useEffect(() => {
    initializeAR();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationPermission('granted');
        },
        (error) => {
          console.error('Location error:', error);
          setLocationPermission('denied');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  // Device orientation tracking
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        setDeviceOrientation({
          alpha: event.alpha,
          beta: event.beta || 0,
          gamma: event.gamma || 0
        });
        
        // Calculate bearing (compass heading)
        let bearing = event.alpha;
        if (bearing < 0) bearing += 360;
        setCurrentBearing(bearing);
      }
    };

    if (window.DeviceOrientationEvent) {
      // Request permission for iOS 13+
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        (DeviceOrientationEvent as any).requestPermission()
          .then((permission: string) => {
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          });
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  // Initialize AR system
  const initializeAR = async () => {
    try {
      // Check for required permissions
      await checkPermissions();
      
      // Initialize camera if AR is active
      if (isARActive) {
        await initializeCamera();
      }
    } catch (error) {
      console.error('AR initialization error:', error);
    }
  };

  // Check camera and location permissions
  const checkPermissions = async () => {
    // Check camera permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
    } catch (error) {
      setCameraPermission('denied');
    }
  };

  // Initialize camera stream
  const initializeCamera = async () => {
    try {
      if (cameraPermission !== 'granted') {
        await checkPermissions();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Camera initialization error:', error);
      setCameraPermission('denied');
    }
  };

  // Generate AR experience
  const generateARExperience = async () => {
    if (!userLocation) return;

    setIsLoadingExperience(true);
    
    try {
      const response = await fetch('/api/ar-location/experience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          radius: maxDistance,
          categories: selectedCategories,
          maxLandmarks: 15,
          userPreferences: {
            interests: ['culture', 'food', 'history'],
            availableTime: '60',
            travelStyle: 'explorer'
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setArExperience(data.data);
        setVisibleLandmarks(data.data.landmarks.filter((l: ARLandmark) => l.distance <= maxDistance));
      }
    } catch (error) {
      console.error('Error generating AR experience:', error);
    } finally {
      setIsLoadingExperience(false);
    }
  };

  // Toggle AR mode
  const toggleAR = async () => {
    if (!isARActive) {
      if (cameraPermission !== 'granted' || locationPermission !== 'granted') {
        alert('Camera and location permissions are required for AR mode');
        return;
      }
      
      await initializeCamera();
      await generateARExperience();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
    
    setIsARActive(!isARActive);
  };

  // Calibrate AR positioning
  const calibrateAR = async () => {
    if (!userLocation || !deviceOrientation) return;

    setIsCalibrating(true);
    
    try {
      const response = await fetch('/api/ar-location/calibrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userLocation,
          deviceOrientation,
          knownLandmarks: visibleLandmarks.slice(0, 3),
          calibrationData: {
            gpsAccuracy: calibrationAccuracy,
            compassCalibrated: true
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Calibration result:', data.data);
        setCalibrationAccuracy('high');
      }
    } catch (error) {
      console.error('Calibration error:', error);
    } finally {
      setIsCalibrating(false);
    }
  };

  // Landmark interaction
  const handleLandmarkSelect = (landmark: ARLandmark) => {
    setSelectedLandmark(landmark);
    
    // Update user stats
    setUserStats(prev => ({
      ...prev,
      landmarksDiscovered: prev.landmarksDiscovered + 1,
      points: prev.points + 10
    }));

    // Play interaction sound
    if (soundEnabled) {
      // playInteractionSound();
    }
  };

  // Share AR discovery
  const shareDiscovery = async (landmark: ARLandmark) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Discovered ${landmark.name}`,
          text: `Check out this amazing place I found using AR! ${landmark.arData.overlay.subtitle}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `Discovered ${landmark.name} - ${landmark.arData.overlay.subtitle}`
        );
        alert('Shared to clipboard!');
      }
      
      setUserStats(prev => ({
        ...prev,
        points: prev.points + 20
      }));
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Calculate landmark screen position
  const calculateLandmarkPosition = (landmark: ARLandmark) => {
    if (!deviceOrientation) return { x: 50, y: 50 };

    // Simplified AR positioning calculation
    const bearingDiff = landmark.bearing - currentBearing;
    const normalizedBearing = ((bearingDiff + 180) % 360) - 180;
    
    // Convert to screen coordinates
    const x = 50 + (normalizedBearing / 60) * 50; // FOV of ~120 degrees
    const y = 50 - (landmark.distance / maxDistance) * 30; // Distance affects vertical position

    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(90, y))
    };
  };

  // Render AR overlay
  const renderAROverlay = () => {
    if (!isARActive || !arExperience) return null;

    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* AR Landmarks */}
        {visibleLandmarks.map((landmark) => {
          const position = calculateLandmarkPosition(landmark);
          
          return (
            <motion.div
              key={landmark.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute pointer-events-auto"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={() => handleLandmarkSelect(landmark)}
            >
              {/* AR Marker */}
              <div className="relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer
                  ${landmark.category === 'attraction' ? 'bg-blue-500' : 
                    landmark.category === 'restaurant' ? 'bg-red-500' : 
                    landmark.category === 'hotel' ? 'bg-green-500' : 'bg-purple-500'}`}
                >
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                
                {/* Distance indicator */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 
                               bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {landmark.distance}m
                </div>
                
                {/* Info panel (shown when selected) */}
                {selectedLandmark?.id === landmark.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-32 left-1/2 transform -translate-x-1/2 
                               bg-white rounded-lg shadow-xl p-4 w-64 z-10"
                  >
                    <h3 className="font-bold text-gray-800 mb-1">{landmark.arData.overlay.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{landmark.arData.overlay.subtitle}</p>
                    
                    {landmark.arData.overlay.quickFacts.length > 0 && (
                      <div className="mb-3">
                        {landmark.arData.overlay.quickFacts.map((fact, index) => (
                          <div key={index} className="text-xs text-gray-500 mb-1">• {fact}</div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareDiscovery(landmark);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Share</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        <Navigation className="w-3 h-3" />
                        <span>Navigate</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* AR Compass */}
        {showCompass && (
          <div className="absolute top-4 right-4">
            <div className="bg-black bg-opacity-70 text-white rounded-full p-3">
              <Compass 
                className="w-6 h-6" 
                style={{ transform: `rotate(${currentBearing}deg)` }}
              />
            </div>
          </div>
        )}

        {/* AR Status Bar */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center space-x-1">
              <Signal className="w-4 h-4" />
              <span className={calibrationAccuracy === 'high' ? 'text-green-400' : 
                             calibrationAccuracy === 'medium' ? 'text-yellow-400' : 'text-red-400'}>
                {calibrationAccuracy.toUpperCase()}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>{visibleLandmarks.length} POIs</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Award className="w-4 h-4" />
              <span>{userStats.points}pts</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* AR Camera View */}
      {isARActive && (
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
          {renderAROverlay()}
        </div>
      )}

      {/* Non-AR Interface */}
      {!isARActive && (
        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-3 rounded-xl">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">AR Travel Explorer</h1>
                    <p className="text-gray-600">Discover landmarks through augmented reality</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={calibrateAR}
                    disabled={isCalibrating}
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg disabled:opacity-50"
                  >
                    <Crosshair className="w-4 h-4" />
                    <span>{isCalibrating ? 'Calibrating...' : 'Calibrate'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Permission Status */}
          {(cameraPermission !== 'granted' || locationPermission !== 'granted') && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-yellow-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">Permissions Required</span>
              </div>
              <div className="mt-2 text-sm text-yellow-700">
                <p>AR mode requires camera and location access:</p>
                <ul className="list-disc list-inside mt-1">
                  {cameraPermission !== 'granted' && <li>Camera permission needed for AR view</li>}
                  {locationPermission !== 'granted' && <li>Location permission needed to find nearby landmarks</li>}
                </ul>
              </div>
            </div>
          )}

          {/* AR Experience Stats */}
          {arExperience && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Current AR Experience</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{arExperience.landmarks.length}</div>
                    <div className="text-sm text-gray-600">Landmarks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{arExperience.metadata.estimatedDuration}</div>
                    <div className="text-sm text-gray-600">Duration</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{arExperience.metadata.difficulty}</div>
                    <div className="text-sm text-gray-600">Difficulty</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{userStats.points}</div>
                    <div className="text-sm text-gray-600">Points</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {arExperience.metadata.themes.map((theme, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Nearby Landmarks */}
          {visibleLandmarks.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Nearby Landmarks</h2>
                
                <div className="space-y-3">
                  {visibleLandmarks.slice(0, 5).map((landmark) => (
                    <div key={landmark.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          landmark.category === 'attraction' ? 'bg-blue-500' : 
                          landmark.category === 'restaurant' ? 'bg-red-500' : 
                          landmark.category === 'hotel' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <div>
                          <h3 className="font-medium text-gray-800">{landmark.name}</h3>
                          <p className="text-sm text-gray-600">{landmark.distance}m away • {landmark.arData.overlay.subtitle}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{landmark.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AR Toggle Button */}
      <motion.button
        onClick={toggleAR}
        disabled={cameraPermission !== 'granted' || locationPermission !== 'granted'}
        className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50
                   px-8 py-4 rounded-full text-white font-medium shadow-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   ${isARActive 
                     ? 'bg-red-500 hover:bg-red-600' 
                     : 'bg-blue-500 hover:bg-blue-600'}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-2">
          {isARActive ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          <span>{isARActive ? 'Exit AR' : 'Start AR Experience'}</span>
        </div>
      </motion.button>

      {/* Loading overlay */}
      {isLoadingExperience && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            <span>Generating AR experience...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ARTravelExplorer;