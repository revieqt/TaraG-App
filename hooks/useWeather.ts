import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/constants/Config';

interface HourlyWeatherData {
  time: string;
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherType: string;
}

interface WeatherResponse {
  date: string;
  hourlyData: HourlyWeatherData[];
}

const WEATHER_CACHE_PREFIX = '@weather_cache_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

interface CachedWeatherData {
  data: WeatherResponse;
  timestamp: number;
  cacheKey: string;
}

export const useWeather = (latitude: number, longitude: number, date?: string) => {
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate cache key based on location and date
  const getCacheKey = () => {
    const roundedLat = latitude.toFixed(2);
    const roundedLon = longitude.toFixed(2);
    const dateKey = date || 'current';
    return `${WEATHER_CACHE_PREFIX}${roundedLat}_${roundedLon}_${dateKey}`;
  };

  // Load cached data
  const loadCachedData = async (): Promise<WeatherResponse | null> => {
    try {
      const cacheKey = getCacheKey();
      const cachedJson = await AsyncStorage.getItem(cacheKey);
      
      if (cachedJson) {
        const cached: CachedWeatherData = JSON.parse(cachedJson);
        const now = Date.now();
        
        // Check if cache is still valid (within 30 minutes)
        if (now - cached.timestamp < CACHE_DURATION) {
          console.log('🌤️ Using cached weather data:', cacheKey);
          return cached.data;
        } else {
          console.log('🌤️ Cache expired, will fetch new data');
          // Delete expired cache
          await AsyncStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error('🌤️ Error loading cached weather:', err);
    }
    return null;
  };

  // Save data to cache and delete old caches
  const saveCachedData = async (data: WeatherResponse) => {
    try {
      const cacheKey = getCacheKey();
      const cached: CachedWeatherData = {
        data,
        timestamp: Date.now(),
        cacheKey
      };
      
      // Save new cache
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
      console.log('🌤️ Weather data cached:', cacheKey);
      
      // Delete old weather caches (keep only current one)
      const allKeys = await AsyncStorage.getAllKeys();
      const weatherCacheKeys = allKeys.filter(key => 
        key.startsWith(WEATHER_CACHE_PREFIX) && key !== cacheKey
      );
      
      if (weatherCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(weatherCacheKeys);
        console.log(`🌤️ Deleted ${weatherCacheKeys.length} old weather cache(s)`);
      }
    } catch (err) {
      console.error('🌤️ Error saving weather cache:', err);
    }
  };

  const fetchWeather = async () => {
    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      setError('Location not available');
      return;
    }

    setLoading(true);
    setError(null);

    // Try to load from cache first
    const cachedData = await loadCachedData();
    if (cachedData) {
      setWeatherData(cachedData);
      setLoading(false);
      return;
    }

    console.log('🌤️ Fetching weather from API for:', { latitude, longitude, date });

    try {
      let url = `${BACKEND_URL}/weather?latitude=${latitude}&longitude=${longitude}`;
      
      // Add date parameter if provided
      if (date) {
        url += `&date=${date}`;
      }
      
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
      
      // Save to cache
      await saveCachedData(data);
      
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
  }, [latitude, longitude, date]);

  return {
    weatherData,
    loading,
    error,
    refetch: fetchWeather,
  };
};
