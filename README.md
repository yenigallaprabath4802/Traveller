# 🌍 Wanderlust Travel App

A comprehensive AI-powered travel planning application built with React frontend and Node.js backend. This app helps users plan, manage, and track their travel experiences with intelligent recommendations and real-time information.

## 🚀 Features

### ✨ AI-Powered Features
- **Smart Trip Planning**: AI-generated itineraries based on user preferences
- **AI-Powered Dynamic Trip Planner**: Real-time trip optimization with weather monitoring, crowd analysis, and budget optimization
- **Advanced AI Travel Assistant**: Voice-enabled chatbot with context awareness and memory
- **Advanced Expense Tracker**: AI categorization with interactive charts and analytics
- **Real-time Map Enhancements**: Enhanced Mapbox integration with POI discovery and route optimization
- **Intelligent Recommendations**: Personalized destination and activity suggestions

### 🎯 Core Functionality
- **Trip Management**: Create, view, edit, and delete travel plans
- **Dashboard Analytics**: Track expenses, upcoming trips, and travel statistics
- **Weather Integration**: Real-time weather forecasts for destinations
- **Currency Converter**: Multi-currency conversion tool
- **Language Translator**: Built-in translation for international travel
- **User Authentication**: Secure login and registration system

### 🛠️ Travel Tools
- **Weather Forecast**: Get weather conditions for any destination
- **Currency Exchange**: Real-time currency conversion rates
- **Language Support**: Translate text between multiple languages
- **Interactive Maps**: Mapbox integration for route planning
- **Expense Tracking**: Monitor and categorize travel expenses with AI insights

## 🧠 AI Features Deep Dive

### AI-Powered Dynamic Trip Planner
- **Real-time Optimization**: Continuously adapts itineraries based on weather, events, and crowd data
- **Weather Monitoring**: Automatically suggests indoor alternatives during bad weather
- **Budget Optimization**: AI-powered cost reduction suggestions while maintaining experience quality
- **Crowd Analysis**: Recommends optimal visiting times to avoid crowds
- **Transportation Intelligence**: Route optimization using Mapbox Directions API
- **Adaptive Recommendations**: Smart suggestions for activities, restaurants, and attractions

### Advanced AI Travel Assistant
- **Voice Commands**: Speech-to-text and text-to-speech capabilities
- **Context Memory**: Remembers user preferences and conversation history
- **Multi-turn Conversations**: Natural dialogue flow with memory retention
- **Real-time Assistance**: Instant responses to travel questions and emergencies

### Advanced Expense Tracker
- **AI Categorization**: Automatic expense category detection and tagging
- **Interactive Charts**: Visual analytics with Recharts integration
- **Budget Predictions**: AI-powered spending forecasts and alerts
- **Multi-currency Support**: Automatic currency conversion and tracking

### Real-time Map Enhancements
- **POI Discovery**: AI-powered point of interest recommendations
- **Route Optimization**: Real-time traffic and route planning
- **Location Intelligence**: Context-aware suggestions based on current location
- **Interactive Features**: Custom markers, layers, and real-time updates

## 🏗️ Project Structure

```
wanderlust-app/
├── frontend/                 # React TypeScript Frontend
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/       # Reusable UI Components
│   │   │   ├── AIChatbot.tsx              # Advanced AI Travel Assistant
│   │   │   ├── AIDynamicTripPlanner.tsx   # AI-Powered Dynamic Trip Planner
│   │   │   ├── AdvancedExpenseTracker.tsx # AI Expense Tracking
│   │   │   ├── Button.tsx
│   │   │   ├── CurrencyConverter.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── EnhancedMapbox.tsx         # Real-time Map Enhancements
│   │   │   ├── EnhanceWeather.tsx
│   │   │   ├── Itinerary.js
│   │   │   ├── LanguageTranslator.tsx
│   │   │   ├── Login.js
│   │   │   ├── MapboxDirections.js
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── Register.js
│   │   │   ├── SmartItineraryGenerator.tsx
│   │   │   └── weather.tsx
│   │   ├── contexts/         # React Context Providers
│   │   │   └── AuthContext.js
│   │   ├── services/         # API Service Layer
│   │   │   └── travelService.ts
│   │   ├── types/           # TypeScript Type Definitions
│   │   │   └── Trip.ts
│   │   ├── utils/           # Utility Functions
│   │   │   └── API.js
│   │   ├── App.js
│   │   ├── index.css
│   │   └── index.js
│   ├── package.json
│   ├── tsconfig.json        # TypeScript Configuration
│   ├── tailwind.config.js   # Tailwind CSS Configuration
│   └── postcss.config.js
├── backend/                 # Node.js Express Backend
│   ├── routes/              # API Route Handlers
│   │   ├── dynamicItinerary.js    # AI Dynamic Trip Optimization API
│   │   ├── expenses.js            # Expense Management API
│   │   ├── itinerary.js           # Trip Planning API
│   │   ├── pois.js               # Points of Interest API
│   │   └── weather.js            # Weather Information API
│   ├── services/            # Business Logic Layer
│   │   ├── aiItineraryService.js      # AI Trip Planning Service
│   │   └── dynamicItineraryService.js # Real-time Optimization Service
│   ├── middleware/          # Express Middleware
│   │   └── auth.js                    # Authentication Middleware
│   ├── .env                 # Environment Variables
│   ├── package.json
│   ├── server.js           # Main Server File
│   ├── start.bat           # Windows Start Script
│   └── start.sh            # Unix Start Script
└── README.md               # This File
```

## 🛠️ Technology Stack

### Frontend
- **React 18.2.0** - Modern React with Hooks and Function Components
- **TypeScript 4.9.5** - Type-safe JavaScript
- **Tailwind CSS 3.3.0** - Utility-first CSS framework
- **Framer Motion 12.23.12** - Smooth animations and transitions
- **React Router DOM 6.15.0** - Client-side routing
- **React Hot Toast 2.6.0** - Beautiful toast notifications
- **Lucide React 0.274.0** - Modern icon library
- **Mapbox GL 3.14.0** - Interactive maps
- **Axios 1.5.0** - HTTP client for API calls

### Backend
- **Node.js** - JavaScript runtime
- **Express 4.18.2** - Web application framework
- **MongoDB with Mongoose 7.5.0** - NoSQL database and ODM
- **OpenAI API** - AI-powered trip planning and optimization
- **JWT (jsonwebtoken 9.0.2)** - Authentication tokens
- **bcrypt 5.1.1** - Password hashing
- **CORS 2.8.5** - Cross-origin resource sharing
- **Axios** - HTTP client for external API integration

### AI & Machine Learning
- **OpenAI GPT-4** - Advanced language model for trip planning
- **Web Speech API** - Voice recognition and text-to-speech
- **Mapbox Directions API** - Route optimization and navigation
- **Weather APIs** - Real-time weather data integration
- **Recharts** - Data visualization for analytics
- **dotenv 16.6.1** - Environment variable management

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd wanderlust-app
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your configurations:
# MONGODB_URI=mongodb://127.0.0.1:27017/wanderlust
# JWT_SECRET=your_super_secret_jwt_key_here
# PORT=5000
# NODE_ENV=development
# FOURSQUARE_API_KEY=your_foursquare_api_key
# WEATHER_API_KEY=your_weather_api_key

# Start the development server
npm run dev
```

### 3. Frontend Setup
```bash
# Open new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔧 Recent Improvements & Fixes

### 🐛 Bug Fixes
- ✅ Fixed TypeScript compilation errors in dashboard component
- ✅ Resolved JSX syntax issues with template literals
- ✅ Fixed missing import statements for React components
- ✅ Corrected navigation function calls with proper string formatting
- ✅ Fixed className prop issues in Button component
- ✅ Resolved backend bcrypt import issues

### 🆕 New Features Added
- ✅ Created comprehensive TypeScript interfaces for Trip and SavedTrip
- ✅ Implemented mock travel service with CRUD operations
- ✅ Enhanced Weather widget with improved UI and functionality
- ✅ Upgraded Language Translator with modern styling
- ✅ Redesigned AI Chatbot as a fixed position widget
- ✅ Added proper environment variable management
- ✅ Created weather API route for backend

### 🎨 UI/UX Improvements
- ✅ Applied Tailwind CSS styling across all components
- ✅ Added responsive design patterns
- ✅ Implemented smooth animations with Framer Motion
- ✅ Created consistent button component with className support
- ✅ Enhanced dashboard with statistics and quick actions
- ✅ Added gradient backgrounds and modern card layouts

### 🔐 Security & Performance
- ✅ Implemented proper password hashing with bcrypt
- ✅ Added JWT-based authentication
- ✅ Configured CORS for secure cross-origin requests
- ✅ Added environment variable protection for sensitive data
- ✅ Implemented proper error handling and validation

## 📱 Application Features

### 🏠 Dashboard
- **Statistics Overview**: Total trips, expenses, upcoming trips, savings
- **Quick Actions**: Plan new trip, smart recommendations, booking options
- **Travel Tools**: Weather, currency converter, language translator
- **Trip Management**: View, edit, cancel, and delete trips
- **AI Integration**: AI-planned trips with detailed itineraries

### 🤖 AI Assistant
- **24/7 Support**: Always available chat interface
- **Travel Queries**: Destination information, travel tips, planning advice
- **Real-time Responses**: Instant answers to travel-related questions
- **Contextual Help**: Understands travel-specific terminology

### 🌤️ Weather Integration
- **Current Conditions**: Real-time weather for any location
- **Forecasts**: 5-day weather predictions
- **Travel-friendly Display**: Temperature, humidity, wind speed
- **Location-based**: Automatic location detection

### 💱 Currency Tools
- **Multi-currency Support**: USD, EUR, INR with easy expansion
- **Real-time Conversion**: Accurate exchange rate calculations
- **Travel-focused**: Designed for international travelers

### 🗣️ Language Support
- **Multiple Languages**: English, Spanish, French, German, Chinese
- **Instant Translation**: Quick text translation for travelers
- **User-friendly Interface**: Simple and intuitive design

## 🚀 Development Status

### ✅ Completed
- Project structure setup
- TypeScript configuration
- React component architecture
- Backend API foundation
- Database integration
- Authentication system
- Core UI components
- Travel tool widgets
- Error handling and validation

### 🔄 In Progress
- Real API integrations (weather, currency, translation)
- Advanced trip planning algorithms
- Enhanced AI chatbot capabilities
- Mobile responsiveness improvements

### 📋 Planned Features
- Real-time collaborative trip planning
- Social features and trip sharing
- Advanced expense tracking and analytics
- Integration with booking platforms
- Offline mode support
- Push notifications
- Advanced map features
- Photo and memory management

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm test

# Backend tests (when implemented)
cd backend
npm test
```

## 🚀 Deployment

### Frontend (Netlify/Vercel)
```bash
cd frontend
npm run build
# Deploy the build folder
```

### Backend (Heroku/Railway)
```bash
cd backend
# Set environment variables on hosting platform
# Deploy to cloud hosting service
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Contact the development team

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- MongoDB for the flexible database solution
- All open-source contributors who made this project possible

---

**Happy Traveling! 🌍✈️**

## Features ✨

- 🔐 **Secure Authentication** - JWT-based login/registration with MongoDB
- 🏨 **Hotel Search** - Find nearby hotels and accommodations
- 🍴 **Restaurant Discovery** - Locate restaurants and dining options
- 📸 **Tourist Attractions** - Discover landmarks and attractions
- 🗺️ **Location Search** - Enter any address or city worldwide
- 🎨 **Beautiful Travel Theme** - Modern glass-morphism design with Tailwind CSS
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔒 **Secure API Handling** - Backend proxy for API keys protection

## Tech Stack 🛠️

**Frontend:**
- React 18
- Tailwind CSS
- React Router
- Axios
- Lucide React Icons

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcrypt for password hashing
- CORS enabled

**APIs:**
- Foursquare Places API v3
- OpenCage Geocoding API

## Prerequisites 📋

Before running this application, make sure you have:

- Node.js (version 14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Foursquare Places API key
- OpenCage Geocoding API key

## Quick Start 🚀

### 1. Clone and Setup

```bash
# Extract the project
unzip wanderlust-app.zip
cd wanderlust-app
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your API keys and MongoDB URI
# Start backend server
npm run dev
```

The backend will start on http://localhost:5000

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start React development server
npm start
```

The frontend will start on http://localhost:3000

## Getting API Keys 🔑

### Foursquare Places API
1. Visit Foursquare Developer Console
2. Create an account and new project
3. Generate a Places API key
4. Copy the key to your .env file

### OpenCage Geocoding API
1. Visit OpenCage API website
2. Sign up for a free account (2,500 requests/day)
3. Get your API key from the dashboard
4. Copy the key to your .env file

## Usage 📱

1. **Register/Login**: Create an account or log in
2. **Search Location**: Enter any city, address, or landmark
3. **Choose Type**: Select Hotels, Restaurants, or Attractions
4. **Explore Results**: Browse detailed information about nearby places
5. **Discover**: Click on different categories to explore more

**Happy Exploring with Wanderlust! 🌍✈️**
#   T r a v e l l e r  
 