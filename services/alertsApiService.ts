import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData } from '@/hooks/useLocation';
import { BACKEND_URL } from '@/constants/Config';

const ALERTS_CACHE_KEY = '@TaraG:alerts';
const LAST_FETCH_TIME_KEY = '@TaraG:lastAlertsFetchTime';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  startOn: Date;
  endOn: Date;
  locations: string[];
  target: 'traveler' | 'tourGuide' | 'everyone';
  createdOn?: Date;
}

/**
 * Convert Firestore timestamp to JavaScript Date
 */
const convertFirestoreTimestamp = (timestamp: any): Date => {
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  if (timestamp && typeof timestamp === 'object' && timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }
  return new Date();
};

/**
 * Check if we should fetch new alerts based on the last fetch time
 * Fetches are only allowed at 6am, 12pm, 6pm, and 12am
 */
const shouldFetchAlerts = async (): Promise<boolean> => {
  try {
    const lastFetchTime = await AsyncStorage.getItem(LAST_FETCH_TIME_KEY);
    if (!lastFetchTime) return true;

    const lastFetch = new Date(parseInt(lastFetchTime, 10));
    const now = new Date();
    
    // Check if it's been more than 6 hours since last fetch
    const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastFetch >= 6) return true;

    // Check if we've crossed into a new fetch window (6am, 12pm, 6pm, 12am)
    const fetchHours = [0, 6, 12, 18]; // 12am, 6am, 12pm, 6pm
    const currentHour = now.getHours();
    const lastFetchHour = lastFetch.getHours();
    
    // If we're in a different fetch window than the last fetch
    const currentWindow = fetchHours.findIndex(h => currentHour < h);
    const lastWindow = fetchHours.findIndex(h => lastFetchHour < h);
    
    return currentWindow !== lastWindow;
  } catch (error) {
    console.error('Error checking fetch time:', error);
    return true; // If there's an error, try to fetch fresh data
  }
};

/**
 * Generate location strings from location data
 */
const generateLocationQueries = (location: LocationData): string[] => {
  const locations: string[] = [];
  
  // Add each non-empty location component
  if (location.suburb) locations.push(location.suburb.toLowerCase());
  if (location.city) locations.push(location.city.toLowerCase());
  if (location.state) locations.push(location.state.toLowerCase());
  if (location.region && location.region !== location.state) {
    locations.push(location.region.toLowerCase());
  }
  if (location.country) locations.push(location.country.toLowerCase());
  
  // Add combinations
  if (location.suburb && location.city) {
    locations.push(`${location.suburb.toLowerCase()}, ${location.city.toLowerCase()}`);
  }
  if (location.city && location.state) {
    locations.push(`${location.city.toLowerCase()}, ${location.state.toLowerCase()}`);
  }
  
  return [...new Set(locations)]; // Remove duplicates
};

/**
 * Fetch alerts from the backend
 */
const fetchAlertsFromBackend = async (locations: string[], userType?: string): Promise<Alert[]> => {
  try {
    console.log('Fetching alerts for locations:', locations);
    console.log('Backend URL:', `${BACKEND_URL}/alerts`);
    
    const url = `${BACKEND_URL}/alerts/by-location?locations=${encodeURIComponent(locations.join(','))}${userType ? `&type=${encodeURIComponent(userType)}` : ''}`;
    const response = await fetch(url);
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    
    
    // Process alerts to convert Firestore timestamps
    const processedAlerts = (data || []).map((alert: any) => {
      console.log('Processing alert:', alert);
      return {
        ...alert,
        startOn: convertFirestoreTimestamp(alert.startOn),
        endOn: convertFirestoreTimestamp(alert.endOn),
        createdOn: alert.createdOn ? convertFirestoreTimestamp(alert.createdOn) : undefined,
      };
    }) as Alert[];
    
    console.log('Processed alerts:', processedAlerts);
    
    // Update last fetch time
    await AsyncStorage.setItem(LAST_FETCH_TIME_KEY, Date.now().toString());
    
    return processedAlerts;
  } catch (error) {
    console.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Get alerts from cache or fetch new ones if needed
 */
export const getAlerts = async (location: LocationData, userType?: string): Promise<Alert[]> => {
  try {
    // Check if we should fetch new alerts
    const shouldFetch = await shouldFetchAlerts();
    
    if (shouldFetch) {
      const locations = generateLocationQueries(location);
      if (locations.length === 0) {
        throw new Error('No valid location data available');
      }
      
      const alerts = await fetchAlertsFromBackend(locations, userType);
      
      // Cache the results
      await AsyncStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify({
        data: alerts,
        timestamp: Date.now(),
      }));
      
      return alerts;
    }
    
    // Return cached alerts if we don't need to fetch
    const cachedData = await AsyncStorage.getItem(ALERTS_CACHE_KEY);
    if (cachedData) {
      const { data } = JSON.parse(cachedData);
      return data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error in getAlerts:', error);
    
    // Return cached data if available, even if there was an error
    try {
      const cachedData = await AsyncStorage.getItem(ALERTS_CACHE_KEY);
      if (cachedData) {
        const { data } = JSON.parse(cachedData);
        return data || [];
      }
    } catch (cacheError) {
      console.error('Error reading from cache:', cacheError);
    }
    
    throw error;
  }
};

/**
 * Manually fetch alerts bypassing time restrictions (for developer use)
 */
export const manualFetchAlerts = async (location: LocationData, userType?: string): Promise<Alert[]> => {
  try {
    console.log('Manual fetch alerts triggered');
    
    const locations = generateLocationQueries(location);
    if (locations.length === 0) {
      throw new Error('No valid location data available');
    }
    
    // Force fetch from backend regardless of time restrictions
    const alerts = await fetchAlertsFromBackend(locations, userType);
    
    // Cache the results
    await AsyncStorage.setItem(ALERTS_CACHE_KEY, JSON.stringify({
      data: alerts,
      timestamp: Date.now(),
    }));
    
    console.log(`Manual fetch completed: ${alerts.length} alerts retrieved`);
    return alerts;
  } catch (error) {
    console.error('Error in manual fetch alerts:', error);
    throw error;
  }
};

/**
 * Clear the alerts cache
 */
export const clearAlertsCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ALERTS_CACHE_KEY);
    await AsyncStorage.removeItem(LAST_FETCH_TIME_KEY);
  } catch (error) {
    console.error('Error clearing alerts cache:', error);
    throw error;
  }
};
