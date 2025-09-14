import { useState, useEffect } from 'react';
import { BACKEND_URL } from '@/constants/Config';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  weatherType: string;
  precipitation: number;
  humidity: number;
}

export const useWeather = (latitude: number, longitude: number) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = async () => {
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError(null);

    console.log('🌤️ Fetching weather for:', { latitude, longitude });

    try {
      const url = `${BACKEND_URL}/weather/current?latitude=${latitude}&longitude=${longitude}`;
      console.log('🌤️ Weather API URL:', url);

      const response = await fetch(url);

      console.log('🌤️ Weather response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🌤️ Weather API error response:', errorText);
        throw new Error(`Weather API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('🌤️ Weather data received:', data);
      setWeatherData(data);
    } catch (err: any) {
      console.error('🌤️ Weather fetch error:', err);
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      fetchWeather();
    }
  }, [latitude, longitude]);

  return {
    weatherData,
    loading,
    error,
    refetch: fetchWeather,
  };
};
