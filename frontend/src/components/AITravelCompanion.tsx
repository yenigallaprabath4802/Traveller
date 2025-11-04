import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Bot, 
  User, 
  MapPin, 
  Clock, 
  Heart, 
  Settings,
  Trash2,
  Download,
  Upload,
  Brain,
  MessageCircle,
  Headphones,
  Globe
} from 'lucide-react';
import axios from 'axios';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  context?: {
    location?: string;
    weather?: string;
    currentTrip?: string;
    userPreferences?: any;
  };
  emotion?: 'neutral' | 'happy' | 'concerned' | 'excited' | 'helpful';
}

interface UserContext {
  name?: string;
  location?: string;
  preferences: {
    travelStyle: string[];
    budgetRange: string;
    interests: string[];
    dietary: string[];
    accessibility: string[];
  };
  currentTrip?: {
    destination: string;
    dates: string;
    companions: number;
  };
  travelHistory: string[];
  conversationMemory: {
    topics: string[];
    lastDiscussed: Record<string, Date>;
    userMentions: Record<string, number>;
  };
}

const AITravelCompanion: React.FC = () => {
  // State Management
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [userContext, setUserContext] = useState<UserContext>({
    preferences: {
      travelStyle: [],
      budgetRange: 'medium',
      interests: [],
      dietary: [],
      accessibility: []
    },
    travelHistory: [],
    conversationMemory: {
      topics: [],
      lastDiscussed: {},
      userMentions: {}
    }
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize speech services
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Load conversation history and context
    loadConversationHistory();
    loadUserContext();

    // Welcome message
    setTimeout(() => {
      addWelcomeMessage();
    }, 1000);

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiCompanion_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save user context
  useEffect(() => {
    localStorage.setItem('aiCompanion_context', JSON.stringify(userContext));
  }, [userContext]);

  const loadConversationHistory = () => {
    const saved = localStorage.getItem('aiCompanion_messages');
    if (saved) {
      try {
        const parsedMessages = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsedMessages);
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    }
  };

  const loadUserContext = () => {
    const saved = localStorage.getItem('aiCompanion_context');
    if (saved) {
      try {
        const parsedContext = JSON.parse(saved);
        setUserContext(parsedContext);
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    }
  };

  const addWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      role: 'assistant',
      content: `Hi there! I'm your AI Travel Companion 🌍 I'm here to help you with all your travel needs. I can assist with planning, answer questions, and even have voice conversations with you. What would you like to explore today?`,
      timestamp: new Date(),
      emotion: 'happy'
    };
    setMessages([welcomeMessage]);
    
    if (voiceEnabled) {
      speakMessage(welcomeMessage.content);
    }
  };

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  }, [isListening]);

  const speakMessage = useCallback((text: string) => {
    if (!synthRef.current || !voiceEnabled) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.volume = 0.8;

    // Try to use a more natural voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.lang === 'en-US'
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  }, [voiceEnabled]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      context: {
        location: userContext.location,
        currentTrip: userContext.currentTrip?.destination,
        userPreferences: userContext.preferences
      }
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Enhanced context for AI
      const conversationContext = {
        userContext,
        recentMessages: messages.slice(-5),
        currentMessage: userMessage.content,
        conversationHistory: messages.length
      };

      const response = await axios.post('/api/ai-companion/chat', {
        message: userMessage.content,
        context: conversationContext,
        voiceEnabled
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        emotion: response.data.emotion || 'helpful',
        context: response.data.context
      };

      setMessages(prev => [...prev, assistantMessage]);

        // Update user context with learned information
        if (response.data.updatedContext) {
          setUserContext(prev => {
            const newTopics = response.data.topics || [];
            const uniqueTopics = Array.from(new Set([...prev.conversationMemory.topics, ...newTopics]));
            
            return {
              ...prev,
              ...response.data.updatedContext,
              conversationMemory: {
                ...prev.conversationMemory,
                topics: uniqueTopics,
                lastDiscussed: {
                  ...prev.conversationMemory.lastDiscussed,
                  [response.data.mainTopic]: new Date()
                }
              }
            };
          });
        }      // Speak the response if voice is enabled
      if (voiceEnabled && response.data.message) {
        speakMessage(response.data.message);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or check your connection.',
        timestamp: new Date(),
        emotion: 'concerned'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (isSpeaking) {
      synthRef.current?.cancel();
      setIsSpeaking(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    localStorage.removeItem('aiCompanion_messages');
    addWelcomeMessage();
  };

  const exportConversation = () => {
    const conversationData = {
      messages,
      userContext,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(conversationData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `travel-companion-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return '😊';
      case 'excited': return '🎉';
      case 'concerned': return '😟';
      case 'helpful': return '🤝';
      default: return '🤖';
    }
  };

  const getMessageAnimation = (index: number) => ({
    initial: { opacity: 0, y: 20, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { delay: index * 0.1, duration: 0.3 }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Travel Companion</h1>
                <p className="text-gray-600">Your intelligent voice-enabled travel assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleVoice}
                className={`p-3 rounded-full transition-all ${
                  voiceEnabled 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title={voiceEnabled ? 'Voice enabled' : 'Voice disabled'}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              <button
                onClick={exportConversation}
                className="p-3 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all"
                title="Export conversation"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={clearConversation}
                className="p-3 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                title="Clear conversation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Context Display */}
          <div className="mt-4 flex flex-wrap gap-2">
            {userContext.location && (
              <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                <MapPin className="w-4 h-4" />
                <span>{userContext.location}</span>
              </div>
            )}
            {userContext.currentTrip && (
              <div className="flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                <Globe className="w-4 h-4" />
                <span>Trip to {userContext.currentTrip.destination}</span>
              </div>
            )}
            <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
              <MessageCircle className="w-4 h-4" />
              <span>{messages.length} messages</span>
            </div>
          </div>
        </motion.div>

        {/* Chat Messages */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-xl h-96 mb-6 flex flex-col"
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  {...getMessageAnimation(index)}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {message.role === 'assistant' && (
                        <span className="text-lg">{getEmotionIcon(message.emotion)}</span>
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <User className="w-4 h-4 mt-1" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleVoiceInput}
                disabled={!voiceEnabled}
                className={`p-3 rounded-full transition-all ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : voiceEnabled
                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isListening ? 'Listening...' : 'Ask me anything about travel...'}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  disabled={isListening || isLoading}
                />
                {isSpeaking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Headphones className="w-5 h-5 text-green-500 animate-pulse" />
                  </div>
                )}
              </div>

              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading || isListening}
                className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Voice Status */}
            {(isListening || isSpeaking) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                {isListening && (
                  <p className="text-red-600 text-sm font-medium">🎤 Listening... Speak now</p>
                )}
                {isSpeaking && (
                  <p className="text-green-600 text-sm font-medium">🔊 Speaking...</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: MapPin, text: 'Plan Trip', color: 'blue' },
            { icon: Globe, text: 'Destinations', color: 'green' },
            { icon: Heart, text: 'Favorites', color: 'red' },
            { icon: Settings, text: 'Preferences', color: 'purple' }
          ].map((action, index) => (
            <motion.button
              key={action.text}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`bg-${action.color}-100 text-${action.color}-600 p-4 rounded-xl hover:bg-${action.color}-200 transition-all`}
              onClick={() => setInputMessage(`Help me ${action.text.toLowerCase()}`)}
            >
              <action.icon className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm font-medium">{action.text}</p>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default AITravelCompanion;