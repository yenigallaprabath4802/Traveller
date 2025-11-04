 // src/components/Weather.tsx
import React, { useEffect, useState } from "react";

type WeatherData = {
  temperature: number;
  description: string;
};

const Weather: React.FC = () => {
  const [city, setCity] = useState<string>("London");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const fetchWeather = async (cityName: string): Promise<void> => {
    try {
      // 🔹 Replace with your real API call
      const fakeApiResponse = {
        temperature: 25,
        description: "Sunny",
      };
      setWeather(fakeApiResponse);
    } catch (error) {
      console.error("Error fetching weather:", error);
    }
  };

  useEffect(() => {
    fetchWeather(city);
  }, [city]);

  return (
    <div>
      <h2>Weather App</h2>
      <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <button onClick={() => fetchWeather(city)}>Get Weather</button>

      {weather && (
        <div>
          <p>City: {city}</p>
          <p>Temperature: {weather.temperature}°C</p>
          <p>Condition: {weather.description}</p>
        </div>
      )}
    </div>
  );
};

export default Weather;
