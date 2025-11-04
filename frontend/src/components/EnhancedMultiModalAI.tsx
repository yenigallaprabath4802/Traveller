import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Camera, Upload, Volume2, VolumeX, Play, Pause,
  MessageCircle, Image, FileAudio, Send, RotateCcw, Sparkles,
  MapPin, Calendar, DollarSign, Users, Clock, Star, Zap,
  Headphones, Eye, Brain, Navigation, Globe, Target
} from 'lucide-react';

interface VoiceTranscription {
  text: string;
  language: string;
  duration: number;
  confidence: number;
  travelEntities: {
    destinations: string[];
    dates: string[];
    budgets: string[];
    activities: string[];
    accommodations: string[];
    transportation: string[];
    travelers: string[];
  };
  intent: {
    primary: string;
    all: string[];
    confidence: number;
  };
}

interface TripPlan {
  interpretedRequest: string;
  destinations: any[];
  recommendations: any;
  voiceSummary: string;
  followUpQuestions: string[];
}

interface ImageAnalysis {
  locationType: string;
  climate: string;
  culturalMarkers: string[];
  landmarks: string[];
  confidence: number;
}

interface DestinationMatch {
  name: string;
  country: string;
  similarityScore: number;
  matchingFeatures: string[];
  budgetLevel: string;
  bestTimeToVisit: string;
  mainAttractions: string[];
}

const EnhancedMultiModalAI: React.FC = () => {
  // State management
  const [activeMode, setActiveMode] = useState<'voice' | 'image' | 'combined'>('voice');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Results state
  const [voiceResults, setVoiceResults] = useState<any>(null);
  const [imageResults, setImageResults] = useState<any>(null);
  const [combinedResults, setCombinedResults] = useState<any>(null);
  const [transcription, setTranscription] = useState<VoiceTranscription | null>(null);

  // UI state
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcription' | 'analysis' | 'planning' | 'recommendations'>('transcription');

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioElementRef = useRef<HTMLAudioElement>(null);

  // Initialize audio recording
  useEffect(() => {
    setupAudioRecording();
  }, []);

  const setupAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        audioChunksRef.current = [];
      };
    } catch (error) {
      console.error('Error setting up audio recording:', error);
    }
  };

  // Voice recording controls
  const startRecording = () => {
    if (mediaRecorderRef.current) {
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Image handling
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const triggerImageUpload = () => {
    imageInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Process voice input
  const processVoiceInput = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('preferences', JSON.stringify({
        preferredVoice: 'alloy',
        language: 'en'
      }));

      const response = await fetch('/api/enhanced-multimodal/voice-trip-planning', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Voice processing failed');
      }

      const data = await response.json();
      setVoiceResults(data.result);
      setTranscription(data.result.transcription);
      
      // Play voice response if available
      if (data.result.voiceResponse?.audioUrl) {
        setCurrentAudio(data.result.voiceResponse.audioUrl);
      }

      setShowResults(true);
      setActiveTab('transcription');
    } catch (error) {
      console.error('Error processing voice:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process image input
  const processImageInput = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('preferences', JSON.stringify({
        budgetLevel: 'mid-range',
        travelStyle: 'cultural'
      }));

      const response = await fetch('/api/enhanced-multimodal/image-destination-discovery', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Image processing failed');
      }

      const data = await response.json();
      setImageResults(data.result);
      setShowResults(true);
      setActiveTab('analysis');
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process combined input
  const processCombinedInput = async () => {
    if (!audioBlob && !selectedImage) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      formData.append('preferences', JSON.stringify({
        preferredVoice: 'alloy',
        budgetLevel: 'mid-range',
        travelStyle: 'adventure'
      }));

      const response = await fetch('/api/enhanced-multimodal/multimodal-trip-planning', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Combined processing failed');
      }

      const data = await response.json();
      setCombinedResults(data.result);
      
      if (data.result.results?.voiceResults) {
        setVoiceResults(data.result.results.voiceResults);
        setTranscription(data.result.results.voiceResults.transcription);
      }
      
      if (data.result.results?.imageResults) {
        setImageResults(data.result.results.imageResults);
      }

      setShowResults(true);
      setActiveTab('planning');
    } catch (error) {
      console.error('Error processing combined input:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Play audio response
  const playAudioResponse = () => {
    if (currentAudio && audioElementRef.current) {
      if (isPlayingAudio) {
        audioElementRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioElementRef.current.src = currentAudio;
        audioElementRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // Reset all inputs
  const resetInputs = () => {
    setAudioBlob(null);
    setSelectedImage(null);
    setImagePreview(null);
    setVoiceResults(null);
    setImageResults(null);
    setCombinedResults(null);
    setTranscription(null);
    setCurrentAudio(null);
    setShowResults(false);
    setIsPlayingAudio(false);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  // Render voice transcription results
  const renderVoiceResults = () => {
    if (!transcription) return null;

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Transcription</h4>
          <p className="text-blue-700 italic">"{transcription.text}"</p>
          <div className="flex items-center space-x-4 mt-2 text-sm text-blue-600">
            <span>Confidence: {(transcription.confidence * 100).toFixed(0)}%</span>
            <span>Duration: {transcription.duration.toFixed(1)}s</span>
            <span>Language: {transcription.language}</span>
          </div>
        </div>

        {transcription.intent && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Detected Intent
            </h4>
            <div className="text-purple-700">
              <p><strong>Primary:</strong> {transcription.intent.primary}</p>
              <p><strong>All intents:</strong> {transcription.intent.all.join(', ')}</p>
            </div>
          </div>
        )}

        {transcription.travelEntities && (
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Extracted Travel Information
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {transcription.travelEntities.destinations.length > 0 && (
                <div>
                  <span className="font-medium text-green-700">Destinations:</span>
                  <p className="text-green-600">{transcription.travelEntities.destinations.join(', ')}</p>
                </div>
              )}
              {transcription.travelEntities.activities.length > 0 && (
                <div>
                  <span className="font-medium text-green-700">Activities:</span>
                  <p className="text-green-600">{transcription.travelEntities.activities.join(', ')}</p>
                </div>
              )}
              {transcription.travelEntities.budgets.length > 0 && (
                <div>
                  <span className="font-medium text-green-700">Budget Info:</span>
                  <p className="text-green-600">{transcription.travelEntities.budgets.join(', ')}</p>
                </div>
              )}
              {transcription.travelEntities.dates.length > 0 && (
                <div>
                  <span className="font-medium text-green-700">Dates:</span>
                  <p className="text-green-600">{transcription.travelEntities.dates.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render image analysis results
  const renderImageResults = () => {
    if (!imageResults?.destinationDiscovery) return null;

    const discovery = imageResults.destinationDiscovery;

    return (
      <div className="space-y-4">
        <div className="bg-orange-50 rounded-lg p-4">
          <h4 className="font-semibold text-orange-800 mb-2 flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Image Analysis
          </h4>
          {discovery.imageAnalysis && (
            <div className="text-orange-700 space-y-2">
              <p><strong>Location Type:</strong> {discovery.imageAnalysis.locationType}</p>
              <p><strong>Climate:</strong> {discovery.imageAnalysis.climate}</p>
              {discovery.imageAnalysis.culturalMarkers?.length > 0 && (
                <p><strong>Cultural Markers:</strong> {discovery.imageAnalysis.culturalMarkers.join(', ')}</p>
              )}
              <p><strong>Confidence:</strong> {(discovery.confidence * 100).toFixed(0)}%</p>
            </div>
          )}
        </div>

        {discovery.matchingDestinations && discovery.matchingDestinations.length > 0 && (
          <div className="bg-teal-50 rounded-lg p-4">
            <h4 className="font-semibold text-teal-800 mb-3 flex items-center">
              <Globe className="w-4 h-4 mr-2" />
              Matching Destinations
            </h4>
            <div className="space-y-3">
              {discovery.matchingDestinations.slice(0, 3).map((dest: DestinationMatch, index: number) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-teal-200">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-medium text-teal-800">{dest.name}, {dest.country}</h5>
                    <span className="text-sm bg-teal-100 text-teal-700 px-2 py-1 rounded">
                      {(dest.similarityScore * 100).toFixed(0)}% match
                    </span>
                  </div>
                  <p className="text-sm text-teal-600 mb-2">{dest.matchingFeatures?.join(', ')}</p>
                  <div className="flex items-center space-x-4 text-xs text-teal-500">
                    <span className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {dest.budgetLevel}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {dest.bestTimeToVisit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render trip planning results
  const renderTripPlanningResults = () => {
    if (!voiceResults?.tripPlanning && !combinedResults?.synthesizedPlan) return null;

    const plan = combinedResults?.synthesizedPlan?.synthesizedPlan || voiceResults?.tripPlanning?.travelPlan;
    
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 rounded-lg p-4">
          <h4 className="font-semibold text-indigo-800 mb-2 flex items-center">
            <Navigation className="w-4 h-4 mr-2" />
            Trip Plan Summary
          </h4>
          {plan && (
            <div className="text-indigo-700 space-y-2">
              {plan.interpretedRequest && (
                <p><strong>Request:</strong> {plan.interpretedRequest}</p>
              )}
              {plan.destinations && (
                <p><strong>Recommended Destinations:</strong> {Array.isArray(plan.destinations) ? plan.destinations.join(', ') : plan.destinations}</p>
              )}
              {plan.budgetEstimate && (
                <p><strong>Budget Estimate:</strong> {plan.budgetEstimate}</p>
              )}
              {plan.duration && (
                <p><strong>Suggested Duration:</strong> {plan.duration}</p>
              )}
            </div>
          )}
        </div>

        {voiceResults?.tripPlanning?.followUpQuestions && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Follow-up Questions</h4>
            <ul className="text-yellow-700 space-y-1">
              {voiceResults.tripPlanning.followUpQuestions.map((question: string, index: number) => (
                <li key={index} className="text-sm">• {question}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Enhanced Multimodal AI</h1>
                <p className="text-gray-600">Voice + Image powered trip planning with Whisper & GPT-4 Vision</p>
              </div>
            </div>
            <button
              onClick={resetInputs}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">Mode:</span>
            <div className="flex space-x-1">
              {(['voice', 'image', 'combined'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setActiveMode(mode)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    activeMode === mode
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode === 'combined' ? 'Voice + Image' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Input Controls */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Input Controls</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Voice Input */}
            {(activeMode === 'voice' || activeMode === 'combined') && (
              <div className="space-y-4">
                <h3 className="flex items-center text-md font-medium text-gray-700">
                  <Headphones className="w-4 h-4 mr-2" />
                  Voice Input
                </h3>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
                  </button>
                  
                  {audioBlob && (
                    <span className="text-sm text-green-600 flex items-center">
                      <FileAudio className="w-4 h-4 mr-1" />
                      Audio ready
                    </span>
                  )}
                </div>

                {currentAudio && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={playAudioResponse}
                      className="flex items-center space-x-2 px-3 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm"
                    >
                      {isPlayingAudio ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>AI Response</span>
                    </button>
                    <audio
                      ref={audioElementRef}
                      onEnded={() => setIsPlayingAudio(false)}
                      onPause={() => setIsPlayingAudio(false)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Image Input */}
            {(activeMode === 'image' || activeMode === 'combined') && (
              <div className="space-y-4">
                <h3 className="flex items-center text-md font-medium text-gray-700">
                  <Eye className="w-4 h-4 mr-2" />
                  Image Input
                </h3>
                
                <div className="space-y-3">
                  <div className="flex space-x-3">
                    <button
                      onClick={triggerImageUpload}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Image</span>
                    </button>
                    
                    {selectedImage && (
                      <button
                        onClick={removeImage}
                        className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {imagePreview && (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        {selectedImage?.name}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Process Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                if (activeMode === 'voice') processVoiceInput();
                else if (activeMode === 'image') processImageInput();
                else processCombinedInput();
              }}
              disabled={
                isProcessing || 
                (activeMode === 'voice' && !audioBlob) ||
                (activeMode === 'image' && !selectedImage) ||
                (activeMode === 'combined' && !audioBlob && !selectedImage)
              }
              className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>
                    {activeMode === 'voice' ? 'Plan Trip by Voice' : 
                     activeMode === 'image' ? 'Discover Destinations' : 
                     'Create Multimodal Plan'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Results</h2>
            
            {/* Results Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'transcription', label: 'Voice Analysis', icon: Headphones },
                { key: 'analysis', label: 'Image Analysis', icon: Eye },
                { key: 'planning', label: 'Trip Planning', icon: Navigation },
                { key: 'recommendations', label: 'Recommendations', icon: Star }
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

            {/* Results Content */}
            <div className="min-h-[300px]">
              {activeTab === 'transcription' && renderVoiceResults()}
              {activeTab === 'analysis' && renderImageResults()}
              {activeTab === 'planning' && renderTripPlanningResults()}
              {activeTab === 'recommendations' && (
                <div className="text-center text-gray-500 py-12">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Detailed recommendations will appear here</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EnhancedMultiModalAI;