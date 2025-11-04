# 🚀 Wanderlust Backend

The Node.js Express backend API for the Wanderlust Travel App - providing authentication, trip management, and travel data services.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables  
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Start production server
npm start
```

## 🛠️ Technology Stack

- **Node.js** - JavaScript runtime environment
- **Express 4.18.2** - Web application framework
- **MongoDB with Mongoose 7.5.0** - NoSQL database and ODM
- **JWT (jsonwebtoken 9.0.2)** - Authentication tokens
- **bcrypt 5.1.1** - Password hashing and security
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 16.6.1** - Environment variable management
- **Axios 1.5.0** - HTTP client for external APIs

## 🔐 API Endpoints

### Authentication
- **POST** `/api/register` - User registration
- **POST** `/api/login` - User authentication

### Travel Data
- **GET** `/search-places` - Search locations with Foursquare API
- **GET** `/api/weather` - Current weather information
- **GET** `/api/weather/forecast` - 5-day weather forecast

## 🔒 Security Features

- bcrypt password hashing
- JWT token authentication
- CORS protection
- Environment variable security

## 🚀 Development Status

### ✅ Completed
- Server setup with Express
- User authentication system
- MongoDB integration
- Weather API endpoints
- Places search integration
- Security implementation

### 🔄 In Progress
- Real API integrations
- Trip management endpoints
- Enhanced middleware

---

**Backend API for Wanderlust Travel App 🌍**
