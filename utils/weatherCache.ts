import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '@/constants/Config';
import { geocodeLocation } from './geocoding';

const WEATHER_CACHE_PREFIX = '@weather_cache_';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_FORECAST_DAYS = 14; // Most weather APIs provide 14-day forecast

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

interface CachedWeatherData {
  data: WeatherResponse;
  timestamp: number;
  cacheKey: string;
}

interface WeatherRequestResult {
  success: boolean;
  data?: WeatherResponse;
  error?: string;
  fromCache?: boolean;
}

// Generate cache key based on location and date
const getCacheKey = (latitude: number, longitude: number, date?: string) => {
  const roundedLat = latitude.toFixed(2);
  const roundedLon = longitude.toFixed(2);
  const dateKey = date || 'current';
  return `${WEATHER_CACHE_PREFIX}${roundedLat}_${roundedLon}_${dateKey}`;
};

// Load cached data
const loadCachedData = async (latitude: number, longitude: number, date?: string): Promise<WeatherResponse | null> => {
  try {
    const cacheKey = getCacheKey(latitude, longitude, date);
    const cachedJson = await AsyncStorage.getItem(cacheKey);
    
    if (cachedJson) {
      const cached: CachedWeatherData = JSON.parse(cachedJson);
      const now = Date.now();
      
      // Check if cache is still valid (within 30 minutes)
      if (now - cached.timestamp < CACHE_DURATION) {
        console.log('🌤️ [AI Chat] Using cached weather data:', cacheKey);
        return cached.data;
      } else {
        console.log('🌤️ [AI Chat] Cache expired, will fetch new data');
        // Delete expired cache
        await AsyncStorage.removeItem(cacheKey);
      }
    }
  } catch (err) {
    console.error('🌤️ [AI Chat] Error loading cached weather:', err);
  }
  return null;
};

// Save data to cache
const saveCachedData = async (latitude: number, longitude: number, data: WeatherResponse, date?: string) => {
  try {
    const cacheKey = getCacheKey(latitude, longitude, date);
    const cached: CachedWeatherData = {
      data,
      timestamp: Date.now(),
      cacheKey
    };
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(cached));
    console.log('🌤️ [AI Chat] Weather data cached:', cacheKey);
  } catch (err) {
    console.error('🌤️ [AI Chat] Error saving weather cache:', err);
  }
};

// Check if date is too far in the future
const isDateTooFarInFuture = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const requestedDate = new Date(dateString);
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + MAX_FORECAST_DAYS);
  
  return requestedDate > maxDate;
};

// Fetch weather from API
const fetchWeatherFromAPI = async (latitude: number, longitude: number, date?: string): Promise<WeatherResponse> => {
  let url = `${BACKEND_URL}/weather?latitude=${latitude}&longitude=${longitude}`;
  
  if (date) {
    url += `&date=${date}`;
  }
  
  console.log('🌤️ [AI Chat] Fetching weather from API:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Weather API error: ${response.status} ${errorText}`);
  }
  
  const data = await response.json();
  console.log('🌤️ [AI Chat] Weather data received from API');
  
  return data;
};

/**
 * Get weather for current location
 */
export const getWeatherForCurrentLocation = async (
  latitude: number,
  longitude: number,
  date?: string
): Promise<WeatherRequestResult> => {
  try {
    // Check if date is too far in the future
    if (isDateTooFarInFuture(date)) {
      return {
        success: false,
        error: `I can only provide weather forecasts up to ${MAX_FORECAST_DAYS} days in advance. The date you requested is too far in the future.`
      };
    }
    
    // Try to load from cache first
    const cachedData = await loadCachedData(latitude, longitude, date);
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        fromCache: true
      };
    }
    
    // Fetch from API
    const data = await fetchWeatherFromAPI(latitude, longitude, date);
    
    // Save to cache
    await saveCachedData(latitude, longitude, data, date);
    
    return {
      success: true,
      data,
      fromCache: false
    };
  } catch (err: any) {
    console.error('🌤️ [AI Chat] Error getting weather:', err);
    return {
      success: false,
      error: err.message || 'Failed to fetch weather data'
    };
  }
};

/**
 * Get weather for a specific location (by name)
 */
export const getWeatherForLocation = async (
  locationName: string,
  date?: string
): Promise<WeatherRequestResult> => {
  try {
    // Check if date is too far in the future
    if (isDateTooFarInFuture(date)) {
      return {
        success: false,
        error: `I can only provide weather forecasts up to ${MAX_FORECAST_DAYS} days in advance. The date you requested is too far in the future.`
      };
    }
    
    // Geocode the location
    console.log('🌤️ [AI Chat] Geocoding location:', locationName);
    const geocoded = await geocodeLocation(locationName);
    
    if (!geocoded) {
      return {
        success: false,
        error: `I couldn't find the location "${locationName}". Please try a more specific location name.`
      };
    }
    
    console.log('🌤️ [AI Chat] Location geocoded:', geocoded);
    
    // Try to load from cache first
    const cachedData = await loadCachedData(geocoded.latitude, geocoded.longitude, date);
    if (cachedData) {
      return {
        success: true,
        data: cachedData,
        fromCache: true
      };
    }
    
    // Fetch from API
    const data = await fetchWeatherFromAPI(geocoded.latitude, geocoded.longitude, date);
    
    // Save to cache
    await saveCachedData(geocoded.latitude, geocoded.longitude, data, date);
    
    return {
      success: true,
      data,
      fromCache: false
    };
  } catch (err: any) {
    console.error('🌤️ [AI Chat] Error getting weather for location:', err);
    return {
      success: false,
      error: err.message || 'Failed to fetch weather data'
    };
  }
};

/**
 * Format weather data for AI chat response
 */
export const formatWeatherForChat = (weatherData: WeatherResponse, locationName: string): string => {
  if (!weatherData.hourlyData || weatherData.hourlyData.length === 0) {
    return `I couldn't get weather data for ${locationName}.`;
  }
  
  // Get current hour or first available hour
  const now = new Date();
  const currentHour = now.getHours();
  
  const currentWeather = weatherData.hourlyData.find(h => {
    const hourTime = new Date(h.time);
    return hourTime.getHours() === currentHour;
  }) || weatherData.hourlyData[0];
  
  // Get daily summary
  const temps = weatherData.hourlyData.map(h => h.temperature);
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  
  const avgPrecipitation = weatherData.hourlyData.reduce((sum, h) => sum + h.precipitation, 0) / weatherData.hourlyData.length;
  const avgHumidity = weatherData.hourlyData.reduce((sum, h) => sum + h.humidity, 0) / weatherData.hourlyData.length;
  
  return `Weather for ${locationName} on ${weatherData.date}:

🌡️ Current: ${currentWeather.temperature.toFixed(1)}°C - ${currentWeather.weatherType}
📊 Temperature Range: ${minTemp.toFixed(1)}°C - ${maxTemp.toFixed(1)}°C
💧 Humidity: ${avgHumidity.toFixed(0)}%
🌧️ Precipitation: ${avgPrecipitation.toFixed(1)}mm
💨 Wind Speed: ${currentWeather.windSpeed.toFixed(1)} km/h`;
};
