import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Minimize2, 
  Maximize2,
  MapPin,
  CloudSun,
  DollarSign,
  Plane,
  Bot
} from "lucide-react";

// Add type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  type?: 'text' | 'weather' | 'currency' | 'suggestion' | 'itinerary';
  data?: any;
}

interface AIResponse {
  text: string;
  type: 'text' | 'weather' | 'currency' | 'suggestion' | 'itinerary';
  data?: any;
}

const AdvancedAIChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = () => {
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        text: "Hello! I'm your AI travel assistant. I can help you with:\n\n🗺️ Trip planning and recommendations\n🌤️ Weather information\n💱 Currency conversion\n✈️ Flight and hotel suggestions\n📍 Local attractions and activities\n\nWhat would you like to know?",
        timestamp: new Date(),
        type: 'text'
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const processUserQuery = async (query: string): Promise<AIResponse> => {
    const lowerQuery = query.toLowerCase();

    // Weather queries
    if (lowerQuery.includes('weather') || lowerQuery.includes('temperature') || lowerQuery.includes('climate')) {
      const locationMatch = lowerQuery.match(/weather.*?in\s+([a-zA-Z\s,]+)/);
      const location = locationMatch ? locationMatch[1].trim() : 'current location';
      
      try {
        const response = await fetch(`http://localhost:5000/api/weather?location=${encodeURIComponent(location)}`);
        const weatherData = await response.json();
        
        return {
          text: `Here's the current weather in ${weatherData.location}:\n\n🌡️ Temperature: ${weatherData.temperature}°C\n☁️ Condition: ${weatherData.condition}\n💧 Humidity: ${weatherData.humidity}%\n💨 Wind Speed: ${weatherData.windSpeed} km/h`,
          type: 'weather',
          data: weatherData
        };
      } catch (error) {
        return {
          text: "I'm sorry, I couldn't fetch the weather information right now. Please try again later.",
          type: 'text'
        };
      }
    }

    // Currency conversion queries
    if (lowerQuery.includes('convert') || lowerQuery.includes('currency') || lowerQuery.includes('exchange')) {
      const amountMatch = lowerQuery.match(/(\d+)\s*(usd|eur|inr|dollars?|euros?|rupees?)/i);
      if (amountMatch) {
        const amount = parseInt(amountMatch[1]);
        const currency = amountMatch[2].toLowerCase();
        
        // Mock conversion rates - replace with real API
        const rates = { usd: 1, eur: 0.92, inr: 83.2 };
        const conversions = Object.entries(rates).map(([curr, rate]) => {
          if (curr === currency) return null;
          const converted = (amount * rate / (rates[currency as keyof typeof rates] || 1)).toFixed(2);
          return `${curr.toUpperCase()}: ${converted}`;
        }).filter(Boolean);

        return {
          text: `Currency conversion for ${amount} ${currency.toUpperCase()}:\n\n${conversions.join('\n')}`,
          type: 'currency',
          data: { amount, currency, conversions }
        };
      }
    }

    // Trip planning queries
    if (lowerQuery.includes('plan') || lowerQuery.includes('trip') || lowerQuery.includes('itinerary') || lowerQuery.includes('travel')) {
      const destinationMatch = lowerQuery.match(/(?:to|in|visit)\s+([a-zA-Z\s,]+?)(?:\s|$|for|with|on)/);
      const destination = destinationMatch ? destinationMatch[1].trim() : null;
      
      if (destination) {
        return {
          text: `I'd love to help you plan a trip to ${destination}! Here are some suggestions:\n\n✈️ **Getting There**: Check flights on major booking platforms\n🏨 **Accommodation**: Consider location, budget, and amenities\n🗺️ **Must-See Places**: Research top attractions and local favorites\n🍽️ **Local Cuisine**: Don't miss the authentic local dishes\n💡 **Pro Tip**: Visit during shoulder season for better prices and fewer crowds\n\nWould you like me to generate a detailed AI itinerary for your trip?`,
          type: 'suggestion',
          data: { destination }
        };
      }
    }

    // Location and attraction queries
    if (lowerQuery.includes('attraction') || lowerQuery.includes('places to visit') || lowerQuery.includes('things to do')) {
      return {
        text: "I can help you discover amazing places! For personalized recommendations, I'll need to know:\n\n📍 Your destination\n🎯 Your interests (culture, adventure, food, etc.)\n⏰ How long you'll be staying\n💰 Your budget range\n\nTell me more about what you're looking for!",
        type: 'suggestion'
      };
    }

    // Fallback AI response
    const responses = [
      "That's an interesting question! Could you provide more details so I can give you the best travel advice?",
      "I'm here to help with all your travel needs! Feel free to ask about destinations, weather, costs, or planning tips.",
      "Let me help you with that! For more specific advice, could you tell me more about your travel plans?",
      "Great question! I can assist with trip planning, weather info, currency conversion, and travel recommendations. What would you like to know?",
      "I'd be happy to help! Whether it's about destinations, activities, or travel logistics, just let me know what you need."
    ];

    return {
      text: responses[Math.floor(Math.random() * responses.length)],
      type: 'text'
    };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const aiResponse = await processUserQuery(input);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: aiResponse.text,
        timestamp: new Date(),
        type: aiResponse.type,
        data: aiResponse.data
      };

      // Simulate thinking time
      setTimeout(() => {
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1000);

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        timestamp: new Date(),
        type: 'text'
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'weather': return <CloudSun className="w-4 h-4 text-blue-500" />;
      case 'currency': return <DollarSign className="w-4 h-4 text-green-500" />;
      case 'suggestion': return <MapPin className="w-4 h-4 text-purple-500" />;
      case 'itinerary': return <Plane className="w-4 h-4 text-orange-500" />;
      default: return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-shadow"
      >
        <MessageCircle className="w-8 h-8" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        width: isMinimized ? 300 : 400,
        height: isMinimized ? 60 : 600
      }}
      className="fixed bottom-6 right-6 bg-white border border-gray-300 rounded-2xl shadow-2xl z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">AI Travel Assistant</h3>
            {!isMinimized && (
              <p className="text-xs text-blue-100">Online • Ready to help</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-96 p-4 overflow-y-auto bg-gray-50">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                >
                  <div
                    className={`max-w-xs px-4 py-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-800 border shadow-sm'
                    }`}
                  >
                    {message.sender === 'ai' && message.type !== 'text' && (
                      <div className="flex items-center space-x-2 mb-2">
                        {getMessageIcon(message.type)}
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {message.type}
                        </span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                    <div className={`text-xs mt-2 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start mb-4"
              >
                <div className="bg-white text-gray-800 border shadow-sm px-4 py-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  placeholder="Ask me anything about travel..."
                  disabled={isLoading}
                />
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                    isListening 
                      ? 'text-red-500 hover:bg-red-50' 
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                  disabled={!recognition}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { text: "Weather in Paris", icon: "🌤️" },
                { text: "Convert 100 USD", icon: "💱" },
                { text: "Plan trip to Bali", icon: "✈️" },
                { text: "Things to do", icon: "🗺️" }
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => setInput(action.text)}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full text-gray-700 transition-colors"
                >
                  {action.icon} {action.text}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default AdvancedAIChatbot;