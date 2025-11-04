import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Mic, MicOff, Volume2, VolumeX, Settings,
  Brain, TrendingUp, Heart, MapPin, Calendar, Users,
  Lightbulb, Target, BarChart3, Sparkles, User,
  Clock, Star, ThumbsUp, ThumbsDown, RefreshCw
} from 'lucide-react';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: () => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface UserPreferences {
  travelStyle: {
    adventureLevel: number;
    budgetPreference: number;
    culturalInterest: number;
    outdoorPreference: number;
    socialPreference: number;
  };
  preferredDestinations: Array<{
    type: string;
    confidence: number;
  }>;
  preferredActivities: Array<{
    activity: string;
    interest: number;
    frequency: number;
  }>;
  confidence: number;
}

interface LearningProgress {
  totalInteractions: number;
  confidenceScore: number;
  learningStage: 'beginner' | 'learning' | 'advanced';
  preferencesEstablished: number;
  tripHistoryCount: number;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: 'solo' | 'family' | 'couple' | 'group' | 'business';
  suggestions?: string[];
  personalizedScore?: number;
}

interface BehaviorEvent {
  eventType: 'click' | 'view' | 'search' | 'bookmark' | 'share' | 'like' | 'chat';
  eventData: {
    category?: string;
    subcategory?: string;
    itemId?: string;
    itemName?: string;
    price?: number;
    duration?: number;
    location?: {
      country: string;
      city: string;
      coordinates: [number, number];
    };
    contentType?: string;
    searchTerms?: string;
    message?: string;
  };
  context?: {
    tripType?: string;
    budget?: string;
    duration?: number;
    interests?: string[];
  };
}

const AdaptiveAITravelCompanion: React.FC = () => {
  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [travelContext, setTravelContext] = useState<'solo' | 'family' | 'couple' | 'group' | 'business'>('solo');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const [showLearningInsights, setShowLearningInsights] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Initialize AI companion
  useEffect(() => {
    initializeAICompanion();
    loadUserPreferences();
    setupSpeechRecognition();
    
    // Add welcome message
    const welcomeMessage = generateAdaptiveWelcome();
    setMessages([{
      id: `msg_${Date.now()}`,
      type: 'assistant',
      content: welcomeMessage,
      timestamp: new Date(),
      personalizedScore: userPreferences?.confidence || 0.1
    }]);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize AI companion with behavior tracking
  const initializeAICompanion = async () => {
    try {
      // Track app initialization
      await trackBehavior({
        eventType: 'view',
        eventData: {
          category: 'ai-companion',
          subcategory: 'initialization',
          itemName: 'adaptive-ai-companion'
        },
        context: {
          tripType: travelContext
        }
      });
    } catch (error) {
      console.error('Error initializing AI companion:', error);
    }
  };

  // Load user preferences and learning data
  const loadUserPreferences = async () => {
    try {
      const userId = getCurrentUserId();
      const [preferencesResponse, progressResponse] = await Promise.all([
        fetch(`/api/behavior-analytics/recommendations/${userId}`),
        fetch(`/api/behavior-analytics/learning-progress/${userId}`)
      ]);

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        setUserPreferences(preferencesData.recommendations);
      }

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setLearningProgress(progressData.progressMetrics);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  // Setup speech recognition
  const setupSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;
  };

  // Track user behavior
  const trackBehavior = async (behaviorEvent: BehaviorEvent) => {
    try {
      await fetch('/api/behavior-analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getCurrentUserId(),
          ...behaviorEvent
        })
      });
    } catch (error) {
      console.error('Error tracking behavior:', error);
    }
  };

  // Generate adaptive welcome message
  const generateAdaptiveWelcome = (): string => {
    if (!userPreferences || userPreferences.confidence < 0.2) {
      return "👋 Welcome! I'm your AI Travel Companion. I'm here to learn about your travel preferences and help you plan amazing trips. The more we chat, the better I'll understand your style!";
    }

    const confidence = userPreferences.confidence;
    const topDestination = userPreferences.preferredDestinations[0];
    const topActivity = userPreferences.preferredActivities[0];

    if (confidence > 0.7) {
      return `🎯 Welcome back! Based on our previous conversations, I know you love ${topDestination?.type} destinations and enjoy ${topActivity?.activity}. What adventure shall we plan today?`;
    } else if (confidence > 0.4) {
      return `🌟 Hi there! I'm getting to know your travel style - you seem to enjoy ${topDestination?.type} places. Let's continue building your perfect travel profile!`;
    } else {
      return `🚀 Hello! I'm learning about your travel preferences. So far, I've noticed some patterns in what you like. Let's chat about your next trip!`;
    }
  };

  // Send message with adaptive AI processing
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      context: travelContext
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Track chat behavior
    await trackBehavior({
      eventType: 'chat',
      eventData: {
        category: 'ai-companion',
        subcategory: 'user-message',
        message: inputMessage
      },
      context: {
        tripType: travelContext
      }
    });

    try {
      // Get adaptive AI response
      const response = await getAdaptiveAIResponse(inputMessage, travelContext);
      
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        personalizedScore: response.personalizedScore
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Speak response if enabled
      if (isSpeaking && response.content) {
        speakText(response.content);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setInputMessage('');
    setIsLoading(false);
  };

  // Get adaptive AI response based on user preferences
  const getAdaptiveAIResponse = async (message: string, context: string) => {
    const userId = getCurrentUserId();
    
    try {
      // Use the new contextual chat service
      const response = await fetch('/api/contextual-chat/contextual-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
          context,
          sessionId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get contextual response');
      }

      const data = await response.json();
      return {
        content: data.response,
        suggestions: data.suggestions || [],
        personalizedScore: data.conversationContext?.memoryConfidence || 0.5,
        conversationContext: data.conversationContext
      };
    } catch (error) {
      console.error('Error with contextual chat service:', error);
      
      // Fallback to original adaptive response
      return await getOriginalAdaptiveResponse(message, context);
    }
  };

  // Original adaptive response as fallback
  const getOriginalAdaptiveResponse = async (message: string, context: string) => {
    const userId = getCurrentUserId();
    
    // Get current recommendations for context
    const recommendations = userPreferences || await getCurrentRecommendations(userId);
    
    const prompt = generateAdaptivePrompt(message, context, recommendations);
    
    const response = await fetch('/api/ai-companion/adaptive-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        userPreferences: recommendations,
        learningProgress,
        sessionId,
        prompt
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    return {
      content: data.response,
      suggestions: data.suggestions || [],
      personalizedScore: data.personalizedScore || 0.5
    };
  };

  // Generate adaptive prompt based on user data
  const generateAdaptivePrompt = (message: string, context: string, recommendations: UserPreferences | null): string => {
    let prompt = `You are an adaptive AI travel companion. `;

    // Add context-specific behavior
    switch (context) {
      case 'solo':
        prompt += `The user is planning solo travel. Focus on safety, independence, and personal growth opportunities. `;
        break;
      case 'family':
        prompt += `The user is planning family travel. Focus on family-friendly activities, safety, and creating memories for all ages. `;
        break;
      case 'couple':
        prompt += `The user is planning romantic travel. Focus on intimate experiences, romantic settings, and couple activities. `;
        break;
      case 'group':
        prompt += `The user is planning group travel. Focus on activities everyone can enjoy, group accommodations, and logistics. `;
        break;
      case 'business':
        prompt += `The user is planning business travel. Focus on efficiency, professional accommodations, and mixing business with leisure. `;
        break;
    }

    // Add personalized preferences if available
    if (recommendations && recommendations.confidence > 0.3) {
      prompt += `\n\nUser's learned preferences:`;
      
      if (recommendations.travelStyle) {
        const style = recommendations.travelStyle;
        prompt += `\n- Adventure level: ${(style.adventureLevel * 100).toFixed(0)}%`;
        prompt += `\n- Budget preference: ${style.budgetPreference > 0.7 ? 'luxury' : style.budgetPreference < 0.3 ? 'budget' : 'mid-range'}`;
        prompt += `\n- Cultural interest: ${(style.culturalInterest * 100).toFixed(0)}%`;
        prompt += `\n- Outdoor preference: ${(style.outdoorPreference * 100).toFixed(0)}%`;
      }

      if (recommendations.preferredDestinations.length > 0) {
        const topDestinations = recommendations.preferredDestinations
          .slice(0, 3)
          .map(d => `${d.type} (${(d.confidence * 100).toFixed(0)}% confidence)`)
          .join(', ');
        prompt += `\n- Preferred destinations: ${topDestinations}`;
      }

      if (recommendations.preferredActivities.length > 0) {
        const topActivities = recommendations.preferredActivities
          .slice(0, 5)
          .map(a => `${a.activity} (interest: ${(a.interest * 100).toFixed(0)}%)`)
          .join(', ');
        prompt += `\n- Preferred activities: ${topActivities}`;
      }

      prompt += `\n\nConfidence in preferences: ${(recommendations.confidence * 100).toFixed(0)}%`;
    } else {
      prompt += `\n\nThis user is new or has limited interaction history. Focus on learning their preferences while providing helpful travel advice.`;
    }

    prompt += `\n\nUser message: "${message}"`;
    prompt += `\n\nProvide a helpful, personalized response that matches their travel style and context. If suggesting destinations or activities, align with their preferences. Ask follow-up questions to learn more about their preferences.`;

    return prompt;
  };

  // Get current recommendations
  const getCurrentRecommendations = async (userId: string): Promise<UserPreferences | null> => {
    try {
      const response = await fetch(`/api/behavior-analytics/recommendations/${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.recommendations;
      }
    } catch (error) {
      console.error('Error getting current recommendations:', error);
    }
    return null;
  };

  // Voice recognition
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Text-to-speech
  const speakText = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      synthRef.current.speak(utterance);
    }
  };

  const toggleSpeaking = () => {
    setIsSpeaking(!isSpeaking);
    if (isSpeaking) {
      synthRef.current?.cancel();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    setInputMessage(suggestion);
    
    // Track suggestion interaction
    await trackBehavior({
      eventType: 'click',
      eventData: {
        category: 'ai-companion',
        subcategory: 'suggestion',
        itemName: suggestion
      }
    });
  };

  // Handle message feedback
  const handleMessageFeedback = async (messageId: string, feedback: 'positive' | 'negative') => {
    await trackBehavior({
      eventType: feedback === 'positive' ? 'like' : 'view',
      eventData: {
        category: 'ai-companion',
        subcategory: 'feedback',
        itemId: messageId,
        itemName: feedback
      }
    });
  };

  // Refresh learning data
  const refreshLearningData = async () => {
    setIsLoading(true);
    await loadUserPreferences();
    setIsLoading(false);
  };

  // Get current user ID (replace with actual auth)
  const getCurrentUserId = (): string => {
    return 'user_123'; // Replace with actual user ID from auth context
  };

  // Render learning insights
  const renderLearningInsights = () => {
    if (!showLearningInsights || !learningProgress) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4 border border-blue-100"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Learning Progress</h3>
          </div>
          <button
            onClick={refreshLearningData}
            className="p-1 hover:bg-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(learningProgress.confidenceScore * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {learningProgress.totalInteractions}
            </div>
            <div className="text-sm text-gray-600">Interactions</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-2">
          <div className="text-sm font-medium text-gray-700">Learning Stage:</div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            learningProgress.learningStage === 'beginner' ? 'bg-yellow-100 text-yellow-800' :
            learningProgress.learningStage === 'learning' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {learningProgress.learningStage}
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${learningProgress.confidenceScore * 100}%` }}
          ></div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Adaptive AI Travel Companion</h1>
                <p className="text-gray-600">Learning your preferences • Personalizing recommendations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowLearningInsights(!showLearningInsights)}
                className={`p-2 rounded-lg transition-colors ${
                  showLearningInsights ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setAdaptiveMode(!adaptiveMode)}
                className={`p-2 rounded-lg transition-colors ${
                  adaptiveMode ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Travel Context Selector */}
          <div className="flex items-center space-x-2 mt-4">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Travel Context:</span>
            <div className="flex space-x-1">
              {(['solo', 'family', 'couple', 'group', 'business'] as const).map((context) => (
                <button
                  key={context}
                  onClick={() => setTravelContext(context)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    travelContext === context
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {context}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Insights */}
        {renderLearningInsights()}
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        {/* Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`p-4 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.personalizedScore && (
                      <div className="mt-2 flex items-center space-x-1 text-xs opacity-75">
                        <Target className="w-3 h-3" />
                        <span>Personalized: {(message.personalizedScore * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>

                  {/* Message Feedback */}
                  {message.type === 'assistant' && (
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleMessageFeedback(message.id, 'positive')}
                          className="p-1 hover:bg-green-100 rounded transition-colors"
                        >
                          <ThumbsUp className="w-3 h-3 text-gray-400 hover:text-green-500" />
                        </button>
                        <button
                          onClick={() => handleMessageFeedback(message.id, 'negative')}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <ThumbsDown className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="block w-full text-left p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 text-sm transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-gray-100 p-4 rounded-2xl">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      className="w-2 h-2 bg-gray-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me about travel plans, get personalized recommendations..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg transition-colors ${
                  isListening ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            
            <button
              onClick={toggleSpeaking}
              className={`p-3 rounded-xl transition-colors ${
                isSpeaking ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100'
              }`}
            >
              {isSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveAITravelCompanion;