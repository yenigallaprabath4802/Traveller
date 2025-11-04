import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Mic, MicOff, Upload, FileText, Image, MessageSquare,
  Brain, Eye, Ear, Send, X, Download, Copy, Share, Settings,
  Zap, Sparkles, Globe, MapPin, Calendar, DollarSign, Clock,
  AlertCircle, CheckCircle, Info, Play, Pause, Square, RotateCcw,
  Paperclip, Trash2, Star, Heart, Bookmark, Search, Filter,
  Languages, Navigation, Phone, Mail, Shield, Volume2,
  VolumeX, Maximize, Minimize, RefreshCw, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, MoreHorizontal, Edit3, Save
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  modality?: 'text' | 'voice' | 'image' | 'document';
  metadata?: {
    confidence?: number;
    processingTime?: number;
    recognized?: boolean;
    entities?: Array<{
      type: string;
      value: string;
      confidence: number;
    }>;
  };
  attachments?: Array<{
    type: 'image' | 'document' | 'audio';
    url: string;
    name: string;
    size: number;
    analysis?: any;
  }>;
}

interface VoiceState {
  isListening: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  language: string;
}

interface CameraState {
  isActive: boolean;
  isCapturing: boolean;
  hasPermission: boolean;
  deviceId?: string;
  resolution: string;
}

interface DocumentAnalysis {
  type: 'passport' | 'ticket' | 'visa' | 'receipt' | 'map' | 'menu' | 'unknown';
  confidence: number;
  extractedText: string;
  entities: Array<{
    type: string;
    value: string;
    position: { x: number; y: number; width: number; height: number };
  }>;
  suggestions: string[];
}

interface ImageAnalysis {
  landmarks: Array<{
    name: string;
    confidence: number;
    location?: { lat: number; lng: number };
    description: string;
  }>;
  objects: Array<{
    name: string;
    confidence: number;
    boundingBox: { x: number; y: number; width: number; height: number };
  }>;
  text: string;
  description: string;
  suggestions: string[];
}

const MultiModalAIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'voice' | 'camera' | 'document'>('chat');
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    language: 'en-US'
  });
  const [cameraState, setCameraState] = useState<CameraState>({
    isActive: false,
    isCapturing: false,
    hasPermission: false,
    resolution: '720p'
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognition = useRef<any>(null);
  const mediaStream = useRef<MediaStream | null>(null);

  // Advanced settings
  const [settings, setSettings] = useState({
    voiceEnabled: true,
    autoListen: false,
    imageAnalysis: true,
    documentOCR: true,
    realTimeTranslation: false,
    contextAware: true,
    proactiveAssistance: true,
    privacy: 'balanced', // strict, balanced, permissive
    language: 'en',
    voiceGender: 'neutral',
    responseStyle: 'detailed' // concise, balanced, detailed
  });

  useEffect(() => {
    initializeVoiceRecognition();
    requestCameraPermission();
    addWelcomeMessage();
    
    return () => {
      cleanup();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = voiceState.language;

      recognition.current.onstart = () => {
        setVoiceState(prev => ({ ...prev, isListening: true }));
      };

      recognition.current.onresult = (event: any) => {
        let transcript = '';
        let confidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
            confidence = event.results[i][0].confidence;
          }
        }

        setVoiceState(prev => ({ 
          ...prev, 
          transcript: transcript.trim(), 
          confidence: confidence || 0 
        }));

        if (transcript.trim()) {
          handleVoiceInput(transcript.trim(), confidence);
        }
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setVoiceState(prev => ({ ...prev, isListening: false, isProcessing: false }));
        toast.error('Voice recognition error. Please try again.');
      };

      recognition.current.onend = () => {
        setVoiceState(prev => ({ ...prev, isListening: false }));
      };
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });
      setCameraState(prev => ({ ...prev, hasPermission: true }));
      stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
    } catch (error) {
      console.error('Camera permission denied:', error);
      setCameraState(prev => ({ ...prev, hasPermission: false }));
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: generateId(),
      type: 'assistant',
      content: `🌟 Welcome to your Multi-Modal AI Travel Assistant! 

I can help you with:
🖼️ **Image Analysis** - Identify landmarks, read signs, analyze travel photos
📄 **Document Processing** - Extract info from tickets, passports, menus, maps
🎙️ **Voice Commands** - Natural conversation in multiple languages
🧠 **Smart Assistance** - Comprehensive travel intelligence and planning

Try:
• "What landmark is this?" (with photo)
• "Read this menu" (with document)
• "Plan my day in Paris"
• "What's the weather like?"

How can I assist your journey today?`,
      timestamp: new Date(),
      modality: 'text'
    };

    setMessages([welcomeMessage]);
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content?: string, modality: 'text' | 'voice' | 'image' | 'document' = 'text', attachments?: any[]) => {
    const messageContent = content || inputText.trim();
    if (!messageContent && !attachments?.length) return;

    const userMessage: Message = {
      id: generateId(),
      type: 'user',
      content: messageContent,
      timestamp: new Date(),
      modality,
      attachments
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Process the message with AI
      const response = await processMultiModalInput(messageContent, modality, attachments);
      
      const assistantMessage: Message = {
        id: generateId(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        modality: 'text',
        metadata: {
          confidence: response.confidence,
          processingTime: response.processingTime,
          entities: response.entities
        }
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Text-to-speech for voice responses
      if (settings.voiceEnabled && (modality === 'voice' || settings.autoListen)) {
        speakResponse(response.content);
      }

    } catch (error) {
      console.error('Error processing message:', error);
      toast.error('Failed to process your request. Please try again.');
      
      const errorMessage: Message = {
        id: generateId(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        modality: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const processMultiModalInput = async (content: string, modality: string, attachments?: any[]) => {
    const startTime = Date.now();
    
    // Simulate AI processing with realistic responses
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    let response = {
      content: '',
      confidence: 0.85 + Math.random() * 0.15,
      processingTime: Date.now() - startTime,
      entities: [] as any[]
    };

    if (modality === 'image' && attachments?.length) {
      response = await processImageInput(content, attachments[0]);
    } else if (modality === 'document' && attachments?.length) {
      response = await processDocumentInput(content, attachments[0]);
    } else if (modality === 'voice') {
      response = await processVoiceInput(content);
    } else {
      response = await processTextInput(content);
    }

    return response;
  };

  const processImageInput = async (content: string, attachment: any) => {
    // Simulate image analysis
    const landmarks = [
      'Eiffel Tower', 'Big Ben', 'Statue of Liberty', 'Sydney Opera House',
      'Taj Mahal', 'Great Wall of China', 'Machu Picchu', 'Colosseum'
    ];
    
    const detectedLandmark = landmarks[Math.floor(Math.random() * landmarks.length)];
    
    return {
      content: `🖼️ **Image Analysis Complete**

I can see this is a photo of the **${detectedLandmark}**!

📍 **Location Details:**
• A iconic landmark with rich historical significance
• Popular tourist destination with millions of visitors annually
• Best visited during spring or fall for optimal weather
• Nearby attractions include museums, parks, and cultural sites

🎯 **Travel Tips:**
• Book tickets in advance to avoid long queues
• Early morning visits offer the best lighting for photos
• Consider guided tours for historical context
• Check local weather conditions before visiting

💡 **Smart Suggestions:**
• "Show me nearby restaurants"
• "What's the best time to visit?"
• "Find similar landmarks in other cities"

Would you like more information about visiting ${detectedLandmark}?`,
      confidence: 0.92,
      processingTime: 1500,
      entities: [
        { type: 'landmark', value: detectedLandmark, confidence: 0.92 },
        { type: 'location', value: 'Tourist Destination', confidence: 0.88 }
      ]
    };
  };

  const processDocumentInput = async (content: string, attachment: any) => {
    // Simulate document OCR and analysis
    const documentTypes = [
      { type: 'boarding_pass', info: 'Flight AA123 from JFK to LAX, Seat 14A, Gate B12' },
      { type: 'hotel_confirmation', info: 'Reservation #12345 at Grand Hotel, Check-in: Dec 15, 2025' },
      { type: 'restaurant_menu', info: 'Italian Restaurant Menu - Pasta dishes from $12-18' },
      { type: 'visa_document', info: 'Tourist Visa valid for 90 days, Multiple entry allowed' }
    ];

    const document = documentTypes[Math.floor(Math.random() * documentTypes.length)];

    return {
      content: `📄 **Document Analysis Complete**

**Document Type:** ${document.type.replace('_', ' ').toUpperCase()}

📋 **Extracted Information:**
${document.info}

🔍 **Key Details Detected:**
• Text extraction: 96% accuracy
• Language: English
• Format: Standard travel document
• Status: Valid and readable

💡 **Smart Actions:**
• Add to travel calendar
• Set reminder notifications
• Save to trip documents
• Share with travel companions

🎯 **Next Steps:**
• "Add this to my itinerary"
• "Set a reminder for this"
• "Find related travel information"

Would you like me to process this document further or help with travel planning?`,
      confidence: 0.96,
      processingTime: 1200,
      entities: [
        { type: 'document_type', value: document.type, confidence: 0.96 },
        { type: 'travel_info', value: document.info, confidence: 0.88 }
      ]
    };
  };

  const processVoiceInput = async (content: string) => {
    // Enhanced voice processing with travel context
    const travelKeywords = ['flight', 'hotel', 'restaurant', 'destination', 'weather', 'book', 'plan', 'trip'];
    const hasTravel = travelKeywords.some(keyword => content.toLowerCase().includes(keyword));

    if (hasTravel) {
      return {
        content: `🎙️ **Voice Command Processed**

I heard: "${content}"

🧠 **AI Analysis:**
• Detected travel-related query
• Processing natural language intent
• Activating travel intelligence systems

🎯 **Response:**
Based on your voice command, I can help you with comprehensive travel planning. Let me provide personalized recommendations based on your preferences and current travel trends.

Would you like me to:
• Search for flights and accommodations
• Provide destination recommendations
• Check weather conditions
• Create a detailed itinerary

💬 **Continue speaking or type your follow-up questions!**`,
        confidence: 0.89,
        processingTime: 800,
        entities: [
          { type: 'intent', value: 'travel_planning', confidence: 0.89 },
          { type: 'input_method', value: 'voice', confidence: 1.0 }
        ]
      };
    }

    return {
      content: `🎙️ **Voice Input Received**

I heard: "${content}"

I'm ready to help with any travel-related questions or planning needs. You can ask me about destinations, flights, hotels, local attractions, weather, or anything else related to your journey!

Try voice commands like:
• "Find me flights to Paris"
• "What's the weather in Tokyo?"
• "Plan a 3-day itinerary for Rome"
• "Show me restaurants near my hotel"`,
      confidence: 0.85,
      processingTime: 600,
      entities: []
    };
  };

  const processTextInput = async (content: string) => {
    // Enhanced text processing with comprehensive travel intelligence
    const lowerContent = content.toLowerCase();
    
    // Travel planning queries
    if (lowerContent.includes('plan') || lowerContent.includes('itinerary')) {
      return {
        content: `🗺️ **Travel Planning Assistant Activated**

I can help you create a comprehensive travel plan! Here's what I can do:

🎯 **Smart Planning Features:**
• AI-powered itinerary generation
• Real-time optimization based on weather, crowds, and events
• Budget analysis and cost optimization
• Local insights and hidden gems discovery

📊 **Personalization:**
• Custom recommendations based on your interests
• Flexible scheduling with alternative options
• Integration with your calendar and preferences
• Social recommendations from fellow travelers

💡 **Smart Suggestions:**
• "Plan a 5-day trip to Barcelona with a $2000 budget"
• "Create a romantic weekend in Paris"
• "Show me adventure activities in New Zealand"

What destination and timeframe are you considering for your trip?`,
        confidence: 0.92,
        processingTime: 1000,
        entities: [
          { type: 'intent', value: 'travel_planning', confidence: 0.92 },
          { type: 'service', value: 'itinerary_generation', confidence: 0.88 }
        ]
      };
    }

    // Weather queries
    if (lowerContent.includes('weather')) {
      return {
        content: `🌤️ **Weather Intelligence System**

I can provide comprehensive weather insights for your travel planning:

🔮 **Advanced Weather Features:**
• Real-time conditions and 14-day forecasts
• Climate analysis for destination planning
• Seasonal weather patterns and best times to visit
• Weather-based activity recommendations

🌍 **Global Coverage:**
• Current conditions worldwide
• Precipitation probability and UV index
• Wind patterns for outdoor activities
• Air quality and visibility reports

💡 **Travel Integration:**
• Packing suggestions based on weather
• Activity recommendations for current conditions
• Alternative indoor options for bad weather
• Weather alerts and travel warnings

Which destination would you like weather information for?`,
        confidence: 0.90,
        processingTime: 800,
        entities: [
          { type: 'intent', value: 'weather_query', confidence: 0.90 },
          { type: 'service', value: 'weather_forecast', confidence: 0.85 }
        ]
      };
    }

    // Default comprehensive response
    return {
      content: `🤖 **Multi-Modal AI Assistant Ready**

I'm your comprehensive travel intelligence system! Here's how I can help:

🌟 **Core Capabilities:**
• **Smart Planning:** AI-powered itineraries and recommendations
• **Real-time Assistance:** Live updates and dynamic optimization
• **Multi-language Support:** Communicate in your preferred language
• **Visual Analysis:** Identify landmarks and read documents
• **Voice Interaction:** Natural conversation and commands

🎯 **Popular Commands:**
• "Plan my trip to [destination]"
• "What's the weather in [city]?"
• "Analyze this photo/document"
• "Find flights from [origin] to [destination]"
• "Recommend restaurants near me"

🔧 **Advanced Features:**
• Predictive analytics for best booking times
• Social travel network integration
• AR location discovery
• Smart reminders and calendar sync

What would you like to explore today?`,
      confidence: 0.88,
      processingTime: 700,
      entities: [
        { type: 'intent', value: 'general_assistance', confidence: 0.88 }
      ]
    };
  };

  const handleVoiceInput = (transcript: string, confidence: number) => {
    if (transcript.length > 10 && confidence > 0.7) {
      handleSendMessage(transcript, 'voice');
      setVoiceState(prev => ({ ...prev, transcript: '', isProcessing: false }));
    }
  };

  const toggleVoiceRecognition = () => {
    if (voiceState.isListening) {
      recognition.current?.stop();
      setVoiceState(prev => ({ ...prev, isListening: false }));
    } else {
      if (recognition.current) {
        recognition.current.start();
      } else {
        toast.error('Voice recognition not supported in this browser');
      }
    }
  };

  const startCamera = async () => {
    try {
      if (!cameraState.hasPermission) {
        await requestCameraPermission();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 }, 
          height: { ideal: 720 } 
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStream.current = stream;
        setCameraState(prev => ({ ...prev, isActive: true }));
        setActiveMode('camera');
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      toast.error('Failed to start camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
      mediaStream.current = null;
    }
    setCameraState(prev => ({ ...prev, isActive: false }));
    if (activeMode === 'camera') {
      setActiveMode('chat');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCameraState(prev => ({ ...prev, isCapturing: true }));
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const attachment = {
            type: 'image' as const,
            url,
            name: `camera-capture-${Date.now()}.jpg`,
            size: blob.size
          };

          handleSendMessage('Analyze this image', 'image', [attachment]);
          stopCamera();
        }
        setCameraState(prev => ({ ...prev, isCapturing: false }));
      }, 'image/jpeg', 0.9);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const attachment = {
      type: file.type.startsWith('image/') ? 'image' as const : 'document' as const,
      url,
      name: file.name,
      size: file.size
    };

    const modality = file.type.startsWith('image/') ? 'image' : 'document';
    const message = modality === 'image' ? 'Analyze this image' : 'Process this document';

    handleSendMessage(message, modality, [attachment]);
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = settings.language;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const cleanup = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(track => track.stop());
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Multi-Modal AI Assistant</h1>
                <p className="text-sm text-gray-600">Advanced travel intelligence with voice, vision & document processing</p>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'voice', icon: Mic, label: 'Voice' },
                { id: 'camera', icon: Camera, label: 'Camera' },
                { id: 'document', icon: FileText, label: 'Docs' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveMode(id as any);
                    if (id === 'camera') startCamera();
                    else if (activeMode === 'camera' && id !== 'camera') stopCamera();
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                    activeMode === id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-[700px] flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl rounded-br-md' 
                          : 'bg-gray-50 text-gray-900 rounded-2xl rounded-bl-md border border-gray-100'
                      } p-4 shadow-sm`}>
                        {/* Message Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {message.type === 'assistant' && (
                              <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                                <Brain className="w-3 h-3 text-white" />
                              </div>
                            )}
                            {message.modality && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                message.type === 'user' 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-purple-100 text-purple-600'
                              }`}>
                                {message.modality === 'voice' && <Mic className="w-3 h-3 inline mr-1" />}
                                {message.modality === 'image' && <Camera className="w-3 h-3 inline mr-1" />}
                                {message.modality === 'document' && <FileText className="w-3 h-3 inline mr-1" />}
                                {message.modality}
                              </span>
                            )}
                          </div>
                          <span className={`text-xs ${
                            message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                          }`}>
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>

                        {/* Message Content */}
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </div>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-black/5 rounded-lg">
                                {attachment.type === 'image' && <Image className="w-4 h-4" />}
                                {attachment.type === 'document' && <FileText className="w-4 h-4" />}
                                <span className="text-sm font-medium">{attachment.name}</span>
                                <span className="text-xs text-gray-500">
                                  ({(attachment.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        {message.metadata && message.type === 'assistant' && (
                          <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                            {message.metadata.confidence && (
                              <span>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</span>
                            )}
                            {message.metadata.processingTime && (
                              <span>Processing: {message.metadata.processingTime}ms</span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-50 text-gray-900 rounded-2xl rounded-bl-md border border-gray-100 p-4 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center">
                          <Brain className="w-3 h-3 text-white animate-pulse" />
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Camera View */}
              {activeMode === 'camera' && cameraState.isActive && (
                <div className="border-t border-gray-200 p-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <button
                        onClick={capturePhoto}
                        disabled={cameraState.isCapturing}
                        className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
                      >
                        <Camera className="w-8 h-8 text-gray-700" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3">
                  {/* File Upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Voice Toggle */}
                  <button
                    onClick={toggleVoiceRecognition}
                    className={`p-3 rounded-xl transition-colors ${
                      voiceState.isListening
                        ? 'bg-red-100 text-red-600 animate-pulse'
                        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {voiceState.isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={cameraState.isActive ? stopCamera : startCamera}
                    className={`p-3 rounded-xl transition-colors ${
                      cameraState.isActive
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  {/* Text Input */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={
                        voiceState.isListening 
                          ? 'Listening...' 
                          : 'Type your message, upload a file, or use voice commands...'
                      }
                      disabled={isLoading || voiceState.isListening}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || (!inputText.trim() && !voiceState.isListening)}
                    className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Voice Transcript */}
                {voiceState.transcript && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-purple-700">Voice Transcript:</span>
                      <span className="text-xs text-purple-600">
                        {(voiceState.confidence * 100).toFixed(0)}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-purple-900">{voiceState.transcript}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-purple-500" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                {[
                  { icon: Camera, label: 'Analyze Photo', action: () => fileInputRef.current?.click() },
                  { icon: FileText, label: 'Process Document', action: () => fileInputRef.current?.click() },
                  { icon: Mic, label: 'Voice Command', action: toggleVoiceRecognition },
                  { icon: MapPin, label: 'Find Location', action: () => handleSendMessage('What landmarks are nearby?') },
                  { icon: Calendar, label: 'Plan Trip', action: () => handleSendMessage('Help me plan a trip') },
                  { icon: Globe, label: 'Translate Text', action: () => handleSendMessage('Translate this text') }
                ].map(({ icon: Icon, label, action }, index) => (
                  <button
                    key={index}
                    onClick={action}
                    className="w-full flex items-center space-x-3 p-3 text-left hover:bg-purple-50 rounded-lg transition-colors group"
                  >
                    <Icon className="w-4 h-4 text-gray-500 group-hover:text-purple-600" />
                    <span className="text-sm text-gray-700 group-hover:text-purple-900">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-purple-500" />
                AI Status
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Voice Recognition</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    voiceState.isListening ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {voiceState.isListening ? 'Active' : 'Ready'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Camera</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    cameraState.isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cameraState.isActive ? 'Active' : 'Ready'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Document OCR</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">Ready</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Translation</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-600">Ready</span>
                </div>
              </div>
            </div>

            {/* Recent Capabilities */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-500" />
                AI Capabilities
              </h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>Image & landmark recognition</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span>Document text extraction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Ear className="w-4 h-4 text-purple-500" />
                  <span>Natural language processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-orange-500" />
                  <span>Multi-language support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Brain className="w-4 h-4 text-pink-500" />
                  <span>Contextual travel intelligence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiModalAIAssistant;