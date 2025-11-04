#!/bin/bash
echo "🚀 Starting Wanderlust Backend..."
echo "📋 Installing dependencies..."
npm install

echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys and MongoDB URI"
    echo "📝 Required: MONGODB_URI, JWT_SECRET, FOURSQUARE_API_KEY, OPENCAGE_API_KEY"
fi

echo "🔥 Starting development server..."
npm run dev
