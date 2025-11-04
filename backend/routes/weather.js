const express = require('express');
const router = express.Router();

// Mock weather data - replace with actual weather API
const mockWeatherData = {
  temperature: 25,
  condition: 'Sunny',
  humidity: 60,
  windSpeed: 10,
  location: 'Default Location'
};

// Get weather information
router.get('/', (req, res) => {
  try {
    const { location, lat, lon } = req.query;
    
    // Mock response - replace with actual weather API call
    const weatherData = {
      ...mockWeatherData,
      location: location || `Lat: ${lat}, Lon: ${lon}`,
      temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40
    };
    
    res.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Get forecast
router.get('/forecast', (req, res) => {
  try {
    const { location } = req.query;
    
    // Mock 5-day forecast
    const forecast = Array.from({ length: 5 }, (_, i) => ({
      date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      temperature: Math.floor(Math.random() * 30) + 10,
      condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
    }));
    
    res.json({ location, forecast });
  } catch (error) {
    console.error('Forecast API error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

module.exports = router;