@echo off
echo 🚀 Starting Wanderlust Backend...
echo 📋 Installing dependencies...
call npm install

echo 🔧 Setting up environment...
if not exist .env (
    copy .env.example .env
    echo ⚠️  Please edit .env file with your API keys and MongoDB URI
    echo 📝 Required: MONGODB_URI, JWT_SECRET, FOURSQUARE_API_KEY, OPENCAGE_API_KEY
)

echo 🔥 Starting development server...
call npm run dev
