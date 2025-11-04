import React, { useState, useEffect } from 'react';

const EnhanceWeather: React.FC = () => {
    const [weather, setWeather] = useState({
        temperature: 25,
        condition: 'Sunny',
        location: 'Current Location',
        humidity: 60,
        windSpeed: 10
    });
    const [loading, setLoading] = useState(false);

    const fetchWeather = async (location: string) => {
        setLoading(true);
        try {
            // Mock API call - replace with actual weather service
            setTimeout(() => {
                setWeather({
                    temperature: Math.floor(Math.random() * 30) + 10,
                    condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy'][Math.floor(Math.random() * 4)],
                    location: location || 'Current Location',
                    humidity: Math.floor(Math.random() * 40) + 40,
                    windSpeed: Math.floor(Math.random() * 20) + 5
                });
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Weather fetch error:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather('');
    }, []);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Weather Forecast</h3>
            {loading ? (
                <div className="text-center py-4">Loading...</div>
            ) : (
                <div className="space-y-4">
                    <div className="text-center">
                        <h4 className="font-medium text-gray-900">{weather.location}</h4>
                        <div className="text-3xl font-bold text-blue-600 my-2">{weather.temperature}°C</div>
                        <p className="text-gray-600">{weather.condition}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Humidity</p>
                            <p className="font-semibold">{weather.humidity}%</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-500">Wind Speed</p>
                            <p className="font-semibold">{weather.windSpeed} km/h</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => fetchWeather(weather.location)}
                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        disabled={loading}
                    >
                        Refresh Weather
                    </button>
                </div>
            )}
        </div>
    );
};

export default EnhanceWeather;