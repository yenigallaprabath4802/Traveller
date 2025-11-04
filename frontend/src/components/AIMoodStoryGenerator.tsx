import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Camera, 
  Mic, 
  Play, 
  Pause, 
  StopCircle, 
  Upload, 
  MapPin, 
  Calendar, 
  Smile, 
  Meh, 
  Frown,
  Sparkles,
  BookOpen,
  Save,
  Share2,
  Download,
  RefreshCw,
  Eye,
  Star,
  Award,
  TrendingUp,
  Brain,
  Zap,
  Moon,
  Sun,
  CloudRain,
  Mountain,
  Plane,
  Camera as CameraIcon,
  Music,
  Coffee,
  Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MoodData {
  category: string;
  intensity: number;
  factors: string[];
  timestamp: string;
  location?: string;
  weather?: string;
  activity?: string;
}

interface StoryData {
  title: string;
  content: string;
  mood: string;
  memories: string[];
  highlights: string[];
  emotions: string[];
  generated_at: string;
  word_count: number;
  sentiment_score: number;
}

interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
}

const AIMoodStoryGenerator: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [moodIntensity, setMoodIntensity] = useState<number>(5);
  const [currentLocation, setCurrentLocation] = useState<string>('');
  const [travelContext, setTravelContext] = useState<string>('');
  const [storyPrompt, setStoryPrompt] = useState<string>('');
  const [generatedStory, setGeneratedStory] = useState<StoryData | null>(null);
  const [moodHistory, setMoodHistory] = useState<MoodData[]>([]);
  const [savedStories, setSavedStories] = useState<StoryData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioRecording, setAudioRecording] = useState<AudioRecording | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showMoodInsights, setShowMoodInsights] = useState(false);
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moodCategories = [
    { 
      name: 'Adventurous', 
      icon: <Mountain className="w-6 h-6" />, 
      color: 'from-orange-400 to-red-500',
      description: 'Excited for exploration and new experiences'
    },
    { 
      name: 'Peaceful', 
      icon: <Moon className="w-6 h-6" />, 
      color: 'from-blue-400 to-indigo-500',
      description: 'Calm, relaxed, and content'
    },
    { 
      name: 'Excited', 
      icon: <Zap className="w-6 h-6" />, 
      color: 'from-yellow-400 to-orange-500',
      description: 'High energy and enthusiasm'
    },
    { 
      name: 'Nostalgic', 
      icon: <Heart className="w-6 h-6" />, 
      color: 'from-pink-400 to-purple-500',
      description: 'Reflective and sentimental'
    },
    { 
      name: 'Curious', 
      icon: <Eye className="w-6 h-6" />, 
      color: 'from-green-400 to-teal-500',
      description: 'Eager to learn and discover'
    },
    { 
      name: 'Grateful', 
      icon: <Star className="w-6 h-6" />, 
      color: 'from-purple-400 to-pink-500',
      description: 'Appreciative and thankful'
    },
    { 
      name: 'Energetic', 
      icon: <Sun className="w-6 h-6" />, 
      color: 'from-yellow-300 to-orange-400',
      description: 'Full of life and vitality'
    },
    { 
      name: 'Contemplative', 
      icon: <Brain className="w-6 h-6" />, 
      color: 'from-indigo-400 to-purple-500',
      description: 'Thoughtful and introspective'
    }
  ];

  useEffect(() => {
    loadSavedData();
    getCurrentLocation();
  }, []);

  const loadSavedData = () => {
    try {
      const stories = JSON.parse(localStorage.getItem('aiMoodStories') || '[]');
      const moods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
      setSavedStories(stories);
      setMoodHistory(moods);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=1&appid=YOUR_API_KEY`
            );
            const data = await response.json();
            if (data.length > 0) {
              setCurrentLocation(`${data[0].name}, ${data[0].country}`);
            }
          } catch (error) {
            console.error('Error fetching location:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioRecording({
          blob: audioBlob,
          url: audioUrl,
          duration: Date.now()
        });
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped');
    }
  };

  const analyzemood = async () => {
    if (!selectedMood) {
      toast.error('Please select a mood first');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const formData = new FormData();
      formData.append('mood', selectedMood);
      formData.append('intensity', moodIntensity.toString());
      formData.append('location', currentLocation);
      formData.append('context', travelContext);
      
      if (audioRecording) {
        formData.append('audio', audioRecording.blob);
      }
      
      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch('http://localhost:5000/api/ai-mood-story/analyze-mood', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to analyze mood');
      }

      const result = await response.json();
      
      const newMoodData: MoodData = {
        category: selectedMood,
        intensity: moodIntensity,
        factors: result.factors || [],
        timestamp: new Date().toISOString(),
        location: currentLocation,
        weather: result.weather,
        activity: result.activity
      };

      const updatedHistory = [newMoodData, ...moodHistory];
      setMoodHistory(updatedHistory);
      localStorage.setItem('moodHistory', JSON.stringify(updatedHistory));
      
      toast.success('Mood analyzed successfully!');
    } catch (error) {
      console.error('Error analyzing mood:', error);
      toast.error('Failed to analyze mood');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateStory = async () => {
    if (!selectedMood || !storyPrompt.trim()) {
      toast.error('Please select a mood and provide a story prompt');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('http://localhost:5000/api/ai-mood-story/generate-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mood: selectedMood,
          intensity: moodIntensity,
          prompt: storyPrompt,
          location: currentLocation,
          context: travelContext,
          previous_moods: moodHistory.slice(0, 5)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate story');
      }

      const result = await response.json();
      setGeneratedStory(result.story);
      toast.success('Story generated successfully!');
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error('Failed to generate story');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveStory = (story: StoryData) => {
    try {
      const updatedStories = [story, ...savedStories];
      setSavedStories(updatedStories);
      localStorage.setItem('aiMoodStories', JSON.stringify(updatedStories));
      toast.success('Story saved successfully!');
    } catch (error) {
      console.error('Error saving story:', error);
      toast.error('Failed to save story');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getMoodStats = () => {
    if (moodHistory.length === 0) return null;

    const moodCounts = moodHistory.reduce((acc, mood) => {
      acc[mood.category] = (acc[mood.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantMood = Object.entries(moodCounts).reduce((a, b) => 
      moodCounts[a[0]] > moodCounts[b[0]] ? a : b
    );

    const avgIntensity = moodHistory.reduce((sum, mood) => sum + mood.intensity, 0) / moodHistory.length;

    return {
      totalEntries: moodHistory.length,
      dominantMood: dominantMood[0],
      averageIntensity: avgIntensity.toFixed(1),
      recentTrend: moodHistory.slice(0, 3).map(m => m.category)
    };
  };

  const stats = getMoodStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ✨ AI Mood & Story Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Capture your travel emotions and let AI transform them into beautiful stories
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Mood Input */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mood Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Heart className="w-6 h-6 mr-2 text-pink-500" />
                How are you feeling?
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {moodCategories.map((mood) => (
                  <motion.button
                    key={mood.name}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.name)}
                    className={`p-4 rounded-xl text-center transition-all ${
                      selectedMood === mood.name
                        ? `bg-gradient-to-br ${mood.color} text-white shadow-lg`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex justify-center mb-2">
                      {mood.icon}
                    </div>
                    <p className="font-medium text-sm">{mood.name}</p>
                  </motion.button>
                ))}
              </div>

              {selectedMood && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Intensity Level: {moodIntensity}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={moodIntensity}
                      onChange={(e) => setMoodIntensity(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Location
                    </label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={currentLocation}
                        onChange={(e) => setCurrentLocation(e.target.value)}
                        placeholder="Where are you right now?"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Travel Context
                    </label>
                    <textarea
                      value={travelContext}
                      onChange={(e) => setTravelContext(e.target.value)}
                      placeholder="Describe what you're doing, where you've been, what's happening..."
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Media Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-purple-500" />
                Add Media (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Audio Recording */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Voice Note</p>
                  <div className="flex items-center space-x-2">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Record
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        <StopCircle className="w-4 h-4 mr-2" />
                        Stop
                      </button>
                    )}
                    
                    {audioRecording && (
                      <audio controls className="flex-1">
                        <source src={audioRecording.url} type="audio/wav" />
                      </audio>
                    )}
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Photos</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </button>
                    <span className="text-sm text-gray-500">
                      {selectedFiles.length} file(s) selected
                    </span>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Files:</p>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm text-gray-600 truncate">{file.name}</span>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={analyzemood}
                disabled={!selectedMood || isAnalyzing}
                className="w-full mt-4 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-5 h-5 mr-2" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'Analyze Mood'}
              </button>
            </motion.div>

            {/* Story Generation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-indigo-500" />
                Generate Your Story
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Story Prompt
                  </label>
                  <textarea
                    value={storyPrompt}
                    onChange={(e) => setStoryPrompt(e.target.value)}
                    placeholder="Describe what you want the story to focus on... (e.g., 'Tell the story of my sunset dinner overlooking the mountains')"
                    rows={4}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={generateStory}
                  disabled={!selectedMood || !storyPrompt.trim() || isGenerating}
                  className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2" />
                  )}
                  {isGenerating ? 'Generating...' : 'Generate Story'}
                </button>
              </div>

              {/* Generated Story Display */}
              <AnimatePresence>
                {generatedStory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-bold text-gray-800">{generatedStory.title}</h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveStory(generatedStory)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="prose prose-sm max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {generatedStory.content}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        Mood: {generatedStory.mood}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {generatedStory.word_count} words
                      </span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Sentiment: {(generatedStory.sentiment_score * 100).toFixed(0)}% positive
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Panel - Insights & History */}
          <div className="space-y-6">
            {/* Mood Insights */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
                  Mood Insights
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Entries</span>
                    <span className="font-bold text-2xl text-purple-600">{stats.totalEntries}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dominant Mood</span>
                    <span className="font-medium text-indigo-600">{stats.dominantMood}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Average Intensity</span>
                    <span className="font-medium text-pink-600">{stats.averageIntensity}/10</span>
                  </div>

                  <div>
                    <span className="text-gray-600 block mb-2">Recent Trend</span>
                    <div className="flex space-x-1">
                      {stats.recentTrend.map((mood, index) => {
                        const moodData = moodCategories.find(m => m.name === mood);
                        return (
                          <div key={index} className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${moodData?.color || 'from-gray-400 to-gray-500'} text-white`}>
                            {mood}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Stories */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-blue-500" />
                Recent Stories
              </h3>

              {savedStories.length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {savedStories.slice(0, 5).map((story, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedStory(story)}
                      className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-800 text-sm mb-1 truncate">
                        {story.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {story.content.substring(0, 100)}...
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-purple-600">{story.mood}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(story.generated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No stories yet</p>
                  <p className="text-sm">Generate your first mood story!</p>
                </div>
              )}
            </motion.div>

            {/* Mood History */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-500" />
                Mood History
              </h3>

              {moodHistory.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {moodHistory.slice(0, 10).map((mood, index) => {
                    const moodData = moodCategories.find(m => m.name === mood.category);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded bg-gradient-to-r ${moodData?.color || 'from-gray-400 to-gray-500'} text-white`}>
                            {moodData?.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{mood.category}</p>
                            <p className="text-xs text-gray-600">{mood.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{mood.intensity}/10</p>
                          <p className="text-xs text-gray-500">
                            {new Date(mood.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No mood data yet</p>
                  <p className="text-sm">Start tracking your travel emotions!</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Story Detail Modal */}
        <AnimatePresence>
          {selectedStory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedStory(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">{selectedStory.title}</h2>
                  <button
                    onClick={() => setSelectedStory(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="prose prose-sm max-w-none mb-6">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedStory.content}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Mood</p>
                      <p className="text-lg text-purple-600">{selectedStory.mood}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Word Count</p>
                      <p className="text-lg text-blue-600">{selectedStory.word_count}</p>
                    </div>
                  </div>

                  {selectedStory.emotions && selectedStory.emotions.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Emotions</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedStory.emotions.map((emotion, index) => (
                          <span key={index} className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Generated: {new Date(selectedStory.generated_at).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <button className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>
        {`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          cursor: pointer;
          border: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        `}
      </style>
    </div>
  );
};

export default AIMoodStoryGenerator;