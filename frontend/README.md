# 🌍 Wanderlust Frontend

The React TypeScript frontend for the Wanderlust Travel App - an AI-powered travel planning application with modern UI/UX and comprehensive travel tools.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 🛠️ Technology Stack

- **React 18.2.0** with Hooks and Function Components
- **TypeScript 4.9.5** for type safety
- **Tailwind CSS 3.3.0** for styling
- **Framer Motion 12.23.12** for animations
- **React Router DOM 6.15.0** for routing
- **React Hot Toast 2.6.0** for notifications
- **Lucide React 0.274.0** for icons
- **Mapbox GL 3.14.0** for maps
- **Axios 1.5.0** for API calls

## 📁 Project Structure

```
src/
├── components/           # React Components
│   ├── AIChatbot.tsx    # AI Assistant Widget
│   ├── Button.tsx       # Reusable Button Component
│   ├── CurrencyConverter.tsx  # Currency Exchange Tool
│   ├── dashboard.tsx    # Main Dashboard Page
│   ├── EnhanceWeather.tsx     # Weather Widget
│   ├── LanguageTranslator.tsx # Translation Tool
│   ├── Login.js         # User Login Form
│   ├── Register.js      # User Registration Form
│   └── ...
├── contexts/            # React Context Providers
│   └── AuthContext.js   # Authentication Context
├── services/            # API Service Layer
│   └── travelService.ts # Travel-related API calls
├── types/               # TypeScript Definitions
│   └── Trip.ts          # Trip and SavedTrip interfaces
├── utils/               # Utility Functions
│   └── API.js           # API configuration
├── App.js               # Main App Component
├── index.css            # Global Styles
└── index.js             # App Entry Point
```

## 🎨 Components Overview

### 🏠 Dashboard (`dashboard.tsx`)
The main application dashboard featuring:
- **Statistics Cards**: Trip count, expenses, upcoming trips, savings
- **Quick Actions**: Trip planning, recommendations, bookings
- **Travel Widgets**: Weather, currency, translation tools
- **Trip Management**: View, edit, delete AI-planned trips
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### 🤖 AI Chatbot (`AIChatbot.tsx`)
Fixed-position chat widget with:
- Real-time conversation interface
- Travel-specific assistance
- Modern chat bubble design
- Responsive positioning

### 🌤️ Enhanced Weather (`EnhanceWeather.tsx`)
Weather information widget featuring:
- Current weather conditions
- Temperature, humidity, wind speed
- Location-based forecasts
- Refresh functionality
- Clean, card-based design

### 💱 Currency Converter (`CurrencyConverter.tsx`)
Multi-currency conversion tool with:
- Support for USD, EUR, INR
- Real-time rate calculations
- Simple input/output interface
- Dropdown currency selection

### 🗣️ Language Translator (`LanguageTranslator.tsx`)
Text translation component offering:
- Multiple language support
- Instant translation
- Clean textarea interface
- Loading states and error handling

### 🔘 Button Component (`Button.tsx`)
Reusable button with:
- TypeScript prop definitions
- Customizable className support
- Default Tailwind styling
- Multiple button types and states

## 🔧 Configuration Files

### `tsconfig.json`
TypeScript configuration for:
- ES5 target compilation
- JSX React support
- Strict mode disabled for gradual migration
- Module resolution and path mapping

### `tailwind.config.js`
Tailwind CSS configuration for:
- Custom color schemes
- Responsive breakpoints
- Animation utilities
- Component-specific styling

### `postcss.config.js`
PostCSS configuration for:
- Tailwind CSS processing
- Autoprefixer support
- CSS optimization

## 🔗 API Integration

### Travel Service (`services/travelService.ts`)
Centralized API service for:
- Trip CRUD operations
- Mock data handling
- Error management
- TypeScript interfaces

### Authentication Context (`contexts/AuthContext.js`)
React context providing:
- User authentication state
- Login/logout functionality
- Registration handling
- User session management

## 🎯 Features Implemented

### ✅ Completed Features
- **TypeScript Integration**: Full type safety across components
- **Responsive Design**: Mobile-first Tailwind CSS implementation
- **Component Architecture**: Modular, reusable React components
- **State Management**: React Context for authentication
- **API Layer**: Structured service layer for backend communication
- **Error Handling**: Comprehensive error boundaries and validation
- **Modern UI**: Clean, professional interface with animations

### 🔄 Component Status
- ✅ Dashboard - Fully functional with all widgets
- ✅ AI Chatbot - Interactive chat interface
- ✅ Weather Widget - Real-time weather display
- ✅ Currency Converter - Multi-currency support
- ✅ Language Translator - Text translation tool
- ✅ Button Component - Reusable with custom styling
- ✅ Authentication - Login/register forms

## 🚀 Development Guidelines

### Code Style
- Use TypeScript for new components
- Follow React Hooks patterns
- Implement proper error boundaries
- Use Tailwind CSS for styling
- Add proper TypeScript interfaces

### Component Structure
```tsx
// Component template
import React, { useState, useEffect } from 'react';

interface ComponentProps {
  // Define props with TypeScript
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic
  
  return (
    <div className="tailwind-classes">
      {/* JSX content */}
    </div>
  );
};

export default Component;
```

### State Management
- Use React Context for global state
- Use useState for local component state
- Use useEffect for side effects
- Implement proper cleanup

## 🎨 Styling Guidelines

### Tailwind CSS Classes
- Use utility classes for styling
- Implement responsive design patterns
- Create consistent spacing and colors
- Use Flexbox and Grid for layouts

### Animation Guidelines
- Use Framer Motion for smooth transitions
- Implement loading states
- Add hover effects for interactivity
- Keep animations subtle and purposeful

## 🧪 Testing Strategy

### Component Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

### Testing Guidelines
- Test component rendering
- Test user interactions
- Test prop handling
- Mock external dependencies

## 🚀 Build & Deployment

### Development Build
```bash
npm start
# Runs on http://localhost:3000
```

### Production Build
```bash
npm run build
# Creates optimized build in 'build' folder
```

### Environment Variables
Create `.env` file for:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_WEATHER_API_KEY=your_weather_api_key
```

## 🔧 Performance Optimization

### Code Splitting
- Lazy load routes and components
- Use React.lazy() for heavy components
- Implement proper loading states

### Bundle Optimization
- Tree shaking for unused code
- Image optimization
- CSS purging with Tailwind
- Minimize dependencies

## 📱 Mobile Responsiveness

### Breakpoint Strategy
- Mobile-first design approach
- Tablet optimization (md: prefix)
- Desktop enhancements (lg: prefix)
- Large screen support (xl: prefix)

### Touch-Friendly Design
- Adequate button sizes
- Swipe gestures support
- Proper spacing for touch
- Optimized typography

## 🐛 Common Issues & Solutions

### TypeScript Errors
- Ensure proper type definitions
- Check import/export statements
- Verify interface implementations
- Use proper generic types

### Build Issues
- Clear node_modules and reinstall
- Check for conflicting dependencies
- Verify environment variables
- Update outdated packages

### Styling Issues
- Check Tailwind class names
- Verify CSS compilation
- Check responsive breakpoints
- Validate custom CSS

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use proper component naming
3. Implement responsive design
4. Add proper error handling
5. Write descriptive commit messages

---

**Built with ❤️ using React & TypeScript**

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm start
```

## Components

- Login/Register forms
- Dashboard with search
- Protected routes
- Auth context

## Styling

Uses Tailwind CSS with custom travel theme colors and glass-morphism effects.
