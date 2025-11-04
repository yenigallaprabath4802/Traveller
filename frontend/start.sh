#!/bin/bash
echo "🎨 Starting Wanderlust Frontend..."
echo "📋 Installing dependencies..."
npm install

echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
fi

echo "🚀 Starting React development server..."
npm start
