import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  Bell,
  Plus,
  X,
  Edit3,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Cloud,
  MapPin,
  Plane,
  Camera,
  Briefcase,
  Shield,
  Heart,
  Settings,
  Download,
  Upload,
  Filter,
  Search
} from 'lucide-react';
import Button from './Button';

// Reminder types and interfaces
interface TravelReminder {
  id: string;
  title: string;
  description: string;
  type: 'pre_trip' | 'during_trip' | 'post_trip' | 'weather' | 'document' | 'health' | 'booking';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  reminderDate: string;
  reminderTime: string;
  tripId?: string;
  destination?: string;
  isCompleted: boolean;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
  weatherCondition?: string;
  notificationMethods: ('push' | 'email' | 'sms')[];
  checklist: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'reminder' | 'trip' | 'flight' | 'hotel' | 'activity';
  description?: string;
  location?: string;
  color: string;
}

interface WeatherAlert {
  id: string;
  destination: string;
  condition: string;
  severity: 'info' | 'warning' | 'severe';
  message: string;
  date: string;
}

const SmartRemindersCalendar: React.FC = () => {
  // State management
  const [reminders, setReminders] = useState<TravelReminder[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState<'calendar' | 'reminders' | 'weather'>('calendar');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [editingReminder, setEditingReminder] = useState<TravelReminder | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // New reminder form state
  const [newReminder, setNewReminder] = useState<Partial<TravelReminder>>({
    title: '',
    description: '',
    type: 'pre_trip',
    priority: 'medium',
    reminderDate: new Date().toISOString().split('T')[0],
    reminderTime: '09:00',
    isRecurring: false,
    notificationMethods: ['push'],
    checklist: []
  });

  // Initialize data and permissions
  useEffect(() => {
    initializeReminders();
    initializeCalendarEvents();
    initializeWeatherAlerts();
    requestNotificationPermission();
  }, []);

  // Auto-check for due reminders
  useEffect(() => {
    const interval = setInterval(checkDueReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const initializeReminders = () => {
    const sampleReminders: TravelReminder[] = [
      {
        id: '1',
        title: 'Check Passport Expiry',
        description: 'Ensure passport is valid for at least 6 months',
        type: 'document',
        priority: 'high',
        reminderDate: '2024-01-15',
        reminderTime: '10:00',
        destination: 'Japan',
        isCompleted: false,
        isRecurring: false,
        notificationMethods: ['push', 'email'],
        checklist: [
          { id: '1', text: 'Check passport expiry date', isCompleted: false, category: 'Document', priority: 'high' },
          { id: '2', text: 'Renew if needed', isCompleted: false, category: 'Document', priority: 'high' },
          { id: '3', text: 'Make copies', isCompleted: false, category: 'Document', priority: 'medium' }
        ],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: '2',
        title: 'Pack Winter Clothes',
        description: 'Pack appropriate clothing for cold weather',
        type: 'pre_trip',
        priority: 'medium',
        reminderDate: '2024-01-20',
        reminderTime: '20:00',
        destination: 'Norway',
        isCompleted: false,
        isRecurring: false,
        weatherCondition: 'snow',
        notificationMethods: ['push'],
        checklist: [
          { id: '4', text: 'Heavy winter coat', isCompleted: false, category: 'Clothing', priority: 'high' },
          { id: '5', text: 'Thermal underwear', isCompleted: false, category: 'Clothing', priority: 'high' },
          { id: '6', text: 'Waterproof boots', isCompleted: false, category: 'Clothing', priority: 'high' },
          { id: '7', text: 'Warm accessories', isCompleted: false, category: 'Clothing', priority: 'medium' }
        ],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: '3',
        title: 'Flight Check-in Reminder',
        description: 'Check-in online 24 hours before departure',
        type: 'booking',
        priority: 'urgent',
        reminderDate: '2024-01-25',
        reminderTime: '08:00',
        destination: 'France',
        isCompleted: false,
        isRecurring: false,
        notificationMethods: ['push', 'email', 'sms'],
        checklist: [
          { id: '8', text: 'Online check-in', isCompleted: false, category: 'Travel', priority: 'urgent' },
          { id: '9', text: 'Print boarding passes', isCompleted: false, category: 'Travel', priority: 'high' },
          { id: '10', text: 'Check baggage requirements', isCompleted: false, category: 'Travel', priority: 'medium' }
        ],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      },
      {
        id: '4',
        title: 'Travel Insurance',
        description: 'Purchase comprehensive travel insurance',
        type: 'health',
        priority: 'high',
        reminderDate: '2024-01-18',
        reminderTime: '14:00',
        isCompleted: false,
        isRecurring: false,
        notificationMethods: ['push', 'email'],
        checklist: [
          { id: '11', text: 'Compare insurance plans', isCompleted: false, category: 'Insurance', priority: 'high' },
          { id: '12', text: 'Purchase policy', isCompleted: false, category: 'Insurance', priority: 'high' },
          { id: '13', text: 'Save policy documents', isCompleted: false, category: 'Insurance', priority: 'medium' }
        ],
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:00:00Z'
      }
    ];

    setReminders(sampleReminders);
  };

  const initializeCalendarEvents = () => {
    const sampleEvents: CalendarEvent[] = [
      {
        id: '1',
        title: 'Flight to Japan',
        start: '2024-01-26T06:00:00',
        end: '2024-01-26T20:00:00',
        type: 'flight',
        description: 'JAL Flight JL123',
        location: 'Tokyo Haneda Airport',
        color: '#3b82f6'
      },
      {
        id: '2',
        title: 'Hotel Check-in',
        start: '2024-01-26T22:00:00',
        end: '2024-01-26T23:00:00',
        type: 'hotel',
        description: 'Park Hyatt Tokyo',
        location: 'Shinjuku, Tokyo',
        color: '#10b981'
      },
      {
        id: '3',
        title: 'Passport Check Reminder',
        start: '2024-01-15T10:00:00',
        end: '2024-01-15T10:30:00',
        type: 'reminder',
        description: 'Check passport expiry',
        color: '#f59e0b'
      },
      {
        id: '4',
        title: 'Mt. Fuji Tour',
        start: '2024-01-28T08:00:00',
        end: '2024-01-28T18:00:00',
        type: 'activity',
        description: 'Guided tour to Mt. Fuji',
        location: 'Mt. Fuji, Japan',
        color: '#8b5cf6'
      }
    ];

    setCalendarEvents(sampleEvents);
  };

  const initializeWeatherAlerts = () => {
    const sampleAlerts: WeatherAlert[] = [
      {
        id: '1',
        destination: 'Tokyo, Japan',
        condition: 'Heavy Rain',
        severity: 'warning',
        message: 'Heavy rainfall expected during your visit. Pack umbrella and waterproof clothing.',
        date: '2024-01-27'
      },
      {
        id: '2',
        destination: 'Tromsø, Norway',
        condition: 'Extreme Cold',
        severity: 'severe',
        message: 'Temperatures dropping to -25°C. Ensure proper winter clothing and equipment.',
        date: '2024-02-05'
      },
      {
        id: '3',
        destination: 'Paris, France',
        condition: 'Clear Skies',
        severity: 'info',
        message: 'Perfect weather for sightseeing! Sunny with mild temperatures.',
        date: '2024-01-30'
      }
    ];

    setWeatherAlerts(sampleAlerts);
  };

  const checkDueReminders = useCallback(() => {
    const now = new Date();
    const dueReminders = reminders.filter(reminder => {
      if (reminder.isCompleted) return false;
      
      const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime}`);
      return reminderDateTime <= now;
    });

    dueReminders.forEach(reminder => {
      if (reminder.notificationMethods.includes('push') && notificationPermission === 'granted') {
        showNotification(reminder);
      }
    });
  }, [reminders, notificationPermission]);

  const showNotification = (reminder: TravelReminder) => {
    if ('Notification' in window && notificationPermission === 'granted') {
      new Notification(reminder.title, {
        body: reminder.description,
        icon: '/favicon.ico',
        tag: reminder.id,
        requireInteraction: true
      });
    }
  };

  const addReminder = () => {
    if (!newReminder.title || !newReminder.reminderDate) return;

    const reminder: TravelReminder = {
      id: Date.now().toString(),
      title: newReminder.title!,
      description: newReminder.description || '',
      type: newReminder.type!,
      priority: newReminder.priority!,
      reminderDate: newReminder.reminderDate!,
      reminderTime: newReminder.reminderTime!,
      destination: newReminder.destination,
      isCompleted: false,
      isRecurring: newReminder.isRecurring!,
      recurringPattern: newReminder.recurringPattern,
      weatherCondition: newReminder.weatherCondition,
      notificationMethods: newReminder.notificationMethods!,
      checklist: newReminder.checklist || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setReminders(prev => [...prev, reminder]);
    resetNewReminder();
    setShowAddReminder(false);
  };

  const resetNewReminder = () => {
    setNewReminder({
      title: '',
      description: '',
      type: 'pre_trip',
      priority: 'medium',
      reminderDate: new Date().toISOString().split('T')[0],
      reminderTime: '09:00',
      isRecurring: false,
      notificationMethods: ['push'],
      checklist: []
    });
  };

  const updateReminder = (updatedReminder: TravelReminder) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === updatedReminder.id 
        ? { ...updatedReminder, updatedAt: new Date().toISOString() }
        : reminder
    ));
  };

  const deleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));
  };

  const toggleReminderComplete = (reminderId: string) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === reminderId
        ? { ...reminder, isCompleted: !reminder.isCompleted, updatedAt: new Date().toISOString() }
        : reminder
    ));
  };

  const toggleChecklistItem = (reminderId: string, itemId: string) => {
    setReminders(prev => prev.map(reminder =>
      reminder.id === reminderId
        ? {
            ...reminder,
            checklist: reminder.checklist.map(item =>
              item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
            ),
            updatedAt: new Date().toISOString()
          }
        : reminder
    ));
  };

  const addChecklistItem = (reminderId: string, text: string, category: string = 'General') => {
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text,
      isCompleted: false,
      category,
      priority: 'medium'
    };

    setReminders(prev => prev.map(reminder =>
      reminder.id === reminderId
        ? {
            ...reminder,
            checklist: [...reminder.checklist, newItem],
            updatedAt: new Date().toISOString()
          }
        : reminder
    ));
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesType = filterType === 'all' || reminder.type === filterType;
    const matchesSearch = reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reminder.destination?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesType && matchesSearch;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/20';
      case 'high': return 'text-orange-500 bg-orange-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20';
      case 'low': return 'text-green-500 bg-green-500/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pre_trip': return <Briefcase className="h-4 w-4" />;
      case 'during_trip': return <MapPin className="h-4 w-4" />;
      case 'post_trip': return <Camera className="h-4 w-4" />;
      case 'weather': return <Cloud className="h-4 w-4" />;
      case 'document': return <Shield className="h-4 w-4" />;
      case 'health': return <Heart className="h-4 w-4" />;
      case 'booking': return <Plane className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const exportReminders = () => {
    const dataStr = JSON.stringify(reminders, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'travel_reminders.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importReminders = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedReminders = JSON.parse(e.target?.result as string);
        setReminders(prev => [...prev, ...importedReminders]);
      } catch (error) {
        console.error('Error importing reminders:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, 30, 0],
              rotate: [0, 180, 360],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{
              duration: 15 + i * 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {i % 4 === 0 && <Bell className="w-20 h-20 text-purple-300" />}
            {i % 4 === 1 && <Clock className="w-16 h-16 text-blue-300" />}
            {i % 4 === 2 && <Calendar className="w-24 h-24 text-pink-300" />}
            {i % 4 === 3 && <Cloud className="w-18 h-18 text-indigo-300" />}
          </motion.div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10 p-4">
        {/* Stunning Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-3xl shadow-2xl mb-8 overflow-hidden relative"
        >
          {/* Animated Pattern Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
            }}></div>
          </div>

          <div className="relative z-10 text-center py-16 px-4">
            {/* Animated Icons Header */}
            <motion.div 
              className="flex justify-center items-center space-x-4 mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl"
              >
                <Bell className="w-12 h-12 text-white" />
              </motion.div>
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl"
              >
                <Calendar className="w-12 h-12 text-white" />
              </motion.div>
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl"
              >
                <Clock className="w-12 h-12 text-white" />
              </motion.div>
            </motion.div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl">
              Smart Travel Reminders
            </h1>
            <p className="text-xl md:text-2xl text-pink-100 mb-8 max-w-3xl mx-auto">
              Never miss a beat on your journey - Intelligent alerts, perfect timing, seamless travel
            </p>

            {/* Stats Bar */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <motion.div 
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4"
              >
                <motion.div 
                  className="text-4xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {reminders.length}
                </motion.div>
                <div className="text-pink-100 text-sm font-medium">Active Reminders</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4"
              >
                <motion.div 
                  className="text-4xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                >
                  {calendarEvents.length}
                </motion.div>
                <div className="text-pink-100 text-sm font-medium">Scheduled Events</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4"
              >
                <motion.div 
                  className="text-4xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                >
                  {weatherAlerts.length}
                </motion.div>
                <div className="text-pink-100 text-sm font-medium">Weather Alerts</div>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4"
              >
                <motion.div 
                  className="text-4xl font-bold text-white mb-1"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
                >
                  {reminders.filter(r => r.isCompleted).length}
                </motion.div>
                <div className="text-pink-100 text-sm font-medium">Completed</div>
              </motion.div>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" className="w-full h-12">
              <path fill="rgb(249 250 251)" d="M0,32L48,37.3C96,43,192,53,288,58.7C384,64,480,64,576,58.7C672,53,768,43,864,48C960,53,1056,75,1152,74.7C1248,75,1344,53,1392,42.7L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"/>
            </svg>
          </div>
        </motion.div>

        {/* Enhanced View Toggle Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { id: 'calendar', label: 'Calendar View', icon: Calendar, gradient: 'from-blue-500 to-cyan-500' },
              { id: 'reminders', label: 'My Reminders', icon: Bell, gradient: 'from-purple-500 to-pink-500' },
              { id: 'weather', label: 'Weather Alerts', icon: Cloud, gradient: 'from-orange-500 to-red-500' }
            ].map((view) => {
              const Icon = view.icon;
              return (
                <motion.button
                  key={view.id}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentView(view.id as any)}
                  className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg flex items-center space-x-3 ${
                    currentView === view.id
                      ? `bg-gradient-to-r ${view.gradient} text-white shadow-2xl`
                      : 'bg-white text-gray-700 hover:shadow-xl'
                  }`}
                >
                  <motion.div
                    animate={currentView === view.id ? { rotate: [0, 360] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <span>{view.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Enhanced Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddReminder(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Reminder</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={exportReminders}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 hover:from-blue-600 hover:to-indigo-700"
            >
              <Download className="w-5 h-5" />
              <span>Export Data</span>
            </motion.button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={importReminders}
                className="hidden"
              />
              <motion.div
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 hover:from-purple-600 hover:to-pink-700"
              >
                <Upload className="w-5 h-5" />
                <span>Import Data</span>
              </motion.div>
            </label>

            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={requestNotificationPermission}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center space-x-2 hover:from-orange-600 hover:to-red-700"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Enhanced Search and Filter */}
        {currentView === 'reminders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search reminders, destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-80 shadow-lg"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg font-medium"
              >
                <option value="all">🌍 All Types</option>
                <option value="pre_trip">✈️ Pre-trip</option>
                <option value="during_trip">🗺️ During Trip</option>
                <option value="post_trip">📸 Post-trip</option>
                <option value="weather">☁️ Weather</option>
                <option value="document">📄 Documents</option>
                <option value="health">❤️ Health</option>
                <option value="booking">🎫 Bookings</option>
              </select>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Calendar View */}
          {currentView === 'calendar' && (
            <>
              {/* Calendar Component */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-purple-100"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                      <Calendar className="mr-3 h-8 w-8 text-purple-600" />
                      Travel Calendar
                    </h3>
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="text-4xl"
                    >
                      🗓️
                    </motion.div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="space-y-4">
                    {/* Month/Year Header */}
                    <div className="flex items-center justify-between mb-4">
                      <motion.button
                        whileHover={{ scale: 1.1, x: -5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg"
                      >
                        ‹
                      </motion.button>
                      <h4 className="text-2xl font-bold text-gray-800">January 2024</h4>
                      <motion.button
                        whileHover={{ scale: 1.1, x: 5 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg"
                      >
                        ›
                      </motion.button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-sm font-bold text-purple-600 p-3 bg-purple-50 rounded-lg">
                          {day}
                        </div>
                      ))}
                    </div>
                    
                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 35 }, (_, i) => {
                        const day = i - 5;
                        const date = new Date(2024, 0, day + 1);
                        const isToday = date.toDateString() === new Date().toDateString();
                        const hasEvent = calendarEvents.some(event => 
                          new Date(event.start).toDateString() === date.toDateString()
                        );
                        const dayEvents = calendarEvents.filter(event =>
                          new Date(event.start).toDateString() === date.toDateString()
                        );
                        
                        return (
                          <motion.div
                            key={i}
                            whileHover={{ scale: 1.1, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            className={`relative p-3 text-center cursor-pointer rounded-xl transition-all shadow-lg ${
                              isToday 
                                ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white ring-4 ring-blue-200' 
                                : hasEvent 
                                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:shadow-xl' 
                                  : 'bg-white text-gray-700 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 border-2 border-gray-100'
                            }`}
                            onClick={() => setSelectedDate(date.toISOString().split('T')[0])}
                          >
                            <div className="text-lg font-bold">{date.getDate()}</div>
                            {hasEvent && (
                              <div className="flex justify-center space-x-1 mt-1">
                                {dayEvents.slice(0, 3).map((event, idx) => (
                                  <motion.div
                                    key={idx}
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: idx * 0.2 }}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ backgroundColor: isToday ? 'white' : event.color }}
                                  />
                                ))}
                              </div>
                            )}
                            {isToday && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs">
                                ⭐
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Enhanced Events Sidebar */}
              <div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white rounded-3xl shadow-2xl p-6 border-2 border-purple-100 sticky top-4"
                >
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center">
                    <Plane className="mr-2 h-6 w-6 text-purple-600" />
                    Upcoming Events
                  </h3>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {calendarEvents.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.03, x: 5 }}
                        className="relative p-4 rounded-2xl shadow-lg border-2 border-gray-100 hover:shadow-xl transition-all bg-gradient-to-br from-white to-purple-50"
                      >
                        {/* Event Color Indicator */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-2 rounded-l-2xl"
                          style={{ backgroundColor: event.color }}
                        />

                        <div className="pl-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-900 text-lg">{event.title}</h4>
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                              className="text-2xl"
                            >
                              {event.type === 'flight' && '✈️'}
                              {event.type === 'hotel' && '🏨'}
                              {event.type === 'activity' && '🎯'}
                              {event.type === 'reminder' && '🔔'}
                            </motion.div>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 flex items-center">
                              <Clock className="inline mr-2 h-4 w-4 text-purple-500" />
                              {new Date(event.start).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            
                            {event.location && (
                              <p className="text-sm text-gray-600 flex items-center">
                                <MapPin className="inline mr-2 h-4 w-4 text-red-500" />
                                {event.location}
                              </p>
                            )}
                            
                            {event.description && (
                              <p className="text-sm text-gray-500 bg-white/50 p-2 rounded-lg">
                                {event.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </>
          )}

          {/* Enhanced Reminders View */}
          {currentView === 'reminders' && (
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-purple-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center">
                    <Bell className="mr-3 h-8 w-8 text-purple-600" />
                    Travel Reminders
                  </h3>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg">
                    <span className="font-bold text-2xl">{filteredReminders.length}</span>
                    <span className="text-sm">Total</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReminders.map((reminder, index) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.03, y: -8 }}
                      className={`relative p-6 rounded-2xl shadow-lg border-2 transition-all ${
                        reminder.isCompleted
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                          : 'bg-gradient-to-br from-white to-purple-50 border-purple-200 hover:shadow-2xl'
                      }`}
                    >
                      {/* Priority Badge */}
                      <div className="absolute -top-3 -right-3">
                        <motion.div
                          animate={{ 
                            scale: reminder.priority === 'urgent' ? [1, 1.2, 1] : 1,
                            rotate: reminder.priority === 'urgent' ? [0, 5, -5, 0] : 0
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${getPriorityColor(reminder.priority)}`}
                        >
                          {reminder.priority.toUpperCase()}
                        </motion.div>
                      </div>

                      {/* Reminder Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`p-3 rounded-xl ${getPriorityColor(reminder.priority)}`}
                          >
                            {getTypeIcon(reminder.type)}
                          </motion.div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleReminderComplete(reminder.id)}
                            className={`p-2 rounded-lg transition-colors shadow-md ${
                              reminder.isCompleted 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 text-gray-500 hover:bg-green-500 hover:text-white'
                            }`}
                          >
                            <CheckCircle className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingReminder(reminder)}
                            className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors shadow-md"
                          >
                            <Edit3 className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteReminder(reminder.id)}
                            className="p-2 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-lg transition-colors shadow-md"
                          >
                            <Trash2 className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>

                      {/* Reminder Content */}
                      <h4 className={`font-bold text-xl mb-3 ${
                        reminder.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'
                      }`}>
                        {reminder.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{reminder.description}</p>
                      
                      {reminder.destination && (
                        <div className="flex items-center mb-3 bg-white/60 p-2 rounded-lg">
                          <MapPin className="h-4 w-4 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">{reminder.destination}</span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600 mb-4 bg-white/60 p-2 rounded-lg">
                        <Clock className="mr-2 h-4 w-4 text-purple-500" />
                        <span className="font-medium">
                          {new Date(`${reminder.reminderDate}T${reminder.reminderTime}`).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })} at {reminder.reminderTime}
                        </span>
                      </div>

                      {/* Enhanced Checklist */}
                      {reminder.checklist.length > 0 && (
                        <div className="border-t-2 border-purple-100 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-bold text-gray-700 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1 text-purple-500" />
                              Checklist
                            </h5>
                            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {reminder.checklist.filter(i => i.isCompleted).length}/{reminder.checklist.length}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {reminder.checklist.slice(0, 3).map((item) => (
                              <motion.div 
                                key={item.id} 
                                className="flex items-center space-x-2 bg-white/60 p-2 rounded-lg hover:bg-white transition-colors"
                                whileHover={{ x: 5 }}
                              >
                                <input
                                  type="checkbox"
                                  checked={item.isCompleted}
                                  onChange={() => toggleChecklistItem(reminder.id, item.id)}
                                  className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                />
                                <span className={`text-sm flex-1 ${
                                  item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'
                                }`}>
                                  {item.text}
                                </span>
                              </motion.div>
                            ))}
                            {reminder.checklist.length > 3 && (
                              <div className="text-xs text-purple-600 font-semibold pl-6">
                                +{reminder.checklist.length - 3} more items
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notification Methods */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-purple-100">
                        {reminder.notificationMethods.map((method) => (
                          <span key={method} className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full font-semibold">
                            {method === 'push' && '🔔'}
                            {method === 'email' && '📧'}
                            {method === 'sms' && '📱'}
                            {' '}{method.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredReminders.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Bell className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-400 mb-2">No Reminders Found</h3>
                    <p className="text-gray-500">Create your first reminder to get started!</p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}

          {/* Enhanced Weather Alerts View */}
          {currentView === 'weather' && (
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-purple-100"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent flex items-center">
                    <Cloud className="mr-3 h-8 w-8 text-orange-600" />
                    Weather Alerts
                  </h3>
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="text-5xl"
                  >
                    ⛅
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {weatherAlerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className={`relative p-6 rounded-2xl border-2 shadow-lg overflow-hidden ${
                        alert.severity === 'severe' 
                          ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-300' 
                          : alert.severity === 'warning'
                            ? 'bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-300'
                            : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
                      }`}
                    >
                      {/* Animated Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <motion.div
                          animate={{ 
                            backgroundPosition: ['0% 0%', '100% 100%']
                          }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="w-full h-full"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px)'
                          }}
                        />
                      </div>

                      {/* Severity Badge */}
                      <div className="absolute -top-3 -right-3">
                        <motion.div
                          animate={{ 
                            scale: alert.severity === 'severe' ? [1, 1.2, 1] : 1,
                            rotate: alert.severity === 'severe' ? [0, 10, -10, 0] : 0
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center space-x-1 ${
                            alert.severity === 'severe' 
                              ? 'bg-red-500 text-white' 
                              : alert.severity === 'warning'
                                ? 'bg-orange-500 text-white'
                                : 'bg-blue-500 text-white'
                          }`}
                        >
                          <AlertTriangle className="h-4 w-4" />
                          <span>{alert.severity.toUpperCase()}</span>
                        </motion.div>
                      </div>

                      <div className="relative z-10">
                        {/* Location Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-bold text-xl text-gray-900 mb-1 flex items-center">
                              <MapPin className="h-5 w-5 mr-2 text-red-500" />
                              {alert.destination}
                            </h4>
                            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {alert.condition}
                            </p>
                          </div>
                          <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="text-4xl"
                          >
                            {alert.condition.includes('Rain') && '🌧️'}
                            {alert.condition.includes('Cold') && '🥶'}
                            {alert.condition.includes('Clear') && '☀️'}
                            {alert.condition.includes('Snow') && '❄️'}
                          </motion.div>
                        </div>

                        {/* Alert Message */}
                        <div className="bg-white/70 backdrop-blur-sm p-4 rounded-xl mb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">{alert.message}</p>
                        </div>
                        
                        {/* Date */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-600 bg-white/70 px-3 py-2 rounded-lg">
                            <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                            <span className="font-medium">
                              {new Date(alert.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`p-2 rounded-lg shadow-md ${
                              alert.severity === 'severe'
                                ? 'bg-red-500 text-white'
                                : alert.severity === 'warning'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-blue-500 text-white'
                            }`}
                          >
                            <Bell className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {weatherAlerts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <Cloud className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-400 mb-2">No Weather Alerts</h3>
                    <p className="text-gray-500">All clear for your travels!</p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          )}
        </div>

        {/* Enhanced Add Reminder Modal */}
        <AnimatePresence>
          {showAddReminder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddReminder(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-200"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-bold text-white flex items-center">
                      <Plus className="mr-3 h-8 w-8" />
                      Create New Reminder
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowAddReminder(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      <X className="h-6 w-6 text-white" />
                    </motion.button>
                  </div>
                  <p className="text-pink-100 mt-2">Set up your travel reminder with all the details</p>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Reminder Title *</label>
                    <input
                      type="text"
                      placeholder="e.g., Check passport expiry"
                      value={newReminder.title}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Add details about this reminder..."
                      value={newReminder.description}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Type and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Type</label>
                      <select
                        value={newReminder.type}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                      >
                        <option value="pre_trip">✈️ Pre-trip</option>
                        <option value="during_trip">🗺️ During Trip</option>
                        <option value="post_trip">📸 Post-trip</option>
                        <option value="weather">☁️ Weather</option>
                        <option value="document">📄 Documents</option>
                        <option value="health">❤️ Health</option>
                        <option value="booking">🎫 Bookings</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Priority</label>
                      <select
                        value={newReminder.priority}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, priority: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                      >
                        <option value="low">🟢 Low Priority</option>
                        <option value="medium">🟡 Medium Priority</option>
                        <option value="high">🟠 High Priority</option>
                        <option value="urgent">🔴 Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={newReminder.reminderDate}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, reminderDate: e.target.value }))}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Time *</label>
                      <input
                        type="time"
                        value={newReminder.reminderTime}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, reminderTime: e.target.value }))}
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                      />
                    </div>
                  </div>

                  {/* Destination */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Destination (Optional)</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="e.g., Paris, France"
                        value={newReminder.destination || ''}
                        onChange={(e) => setNewReminder(prev => ({ ...prev, destination: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
                      />
                    </div>
                  </div>

                  {/* Recurring Options */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newReminder.isRecurring}
                          onChange={(e) => setNewReminder(prev => ({ ...prev, isRecurring: e.target.checked }))}
                          className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                        />
                        <span className="text-sm font-bold text-gray-700">Recurring Reminder</span>
                      </label>

                      {newReminder.isRecurring && (
                        <select
                          value={newReminder.recurringPattern}
                          onChange={(e) => setNewReminder(prev => ({ ...prev, recurringPattern: e.target.value as any }))}
                          className="px-3 py-2 bg-white border-2 border-purple-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                        >
                          <option value="daily">📅 Daily</option>
                          <option value="weekly">🗓️ Weekly</option>
                          <option value="monthly">📆 Monthly</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Notification Methods */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Notification Methods</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { method: 'push', label: '🔔 Push', icon: Bell },
                        { method: 'email', label: '📧 Email', icon: Bell },
                        { method: 'sms', label: '📱 SMS', icon: Bell }
                      ].map(({ method, label }) => (
                        <label key={method} className="cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newReminder.notificationMethods?.includes(method as any)}
                            onChange={(e) => {
                              const methods = newReminder.notificationMethods || [];
                              if (e.target.checked) {
                                setNewReminder(prev => ({ 
                                  ...prev, 
                                  notificationMethods: [...methods, method as any] 
                                }));
                              } else {
                                setNewReminder(prev => ({ 
                                  ...prev, 
                                  notificationMethods: methods.filter(m => m !== method) 
                                }));
                              }
                            }}
                            className="sr-only"
                          />
                          <div className={`p-3 rounded-xl border-2 text-center font-semibold transition-all ${
                            newReminder.notificationMethods?.includes(method as any)
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                              : 'bg-white text-gray-600 border-gray-300 hover:border-purple-300'
                          }`}>
                            {label}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 p-6 bg-gray-50 rounded-b-3xl border-t-2 border-purple-100">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddReminder(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(139, 92, 246, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addReminder}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                  >
                    <Plus className="inline mr-2 h-5 w-5" />
                    Create Reminder
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SmartRemindersCalendar;