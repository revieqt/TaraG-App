import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RouteHistoryItem {
  id: string;
  activeRoute: {
    routeID: string;
    userID: string;
    location: { latitude: number; longitude: number; locationName: string }[];
    mode: string;
    status: string;
    createdOn: Date;
    routeData?: any;
    routeSegments?: any;
    routeSteps?: any;
  };
  time: number; // elapsed time in seconds
  distance: number; // distance in meters
  date: string; // ISO date string
}

const ROUTE_HISTORY_KEY = '@route_history';

export const saveRouteToHistory = async (
  activeRoute: RouteHistoryItem['activeRoute'],
  time: number,
  distance: number
): Promise<void> => {
  try {
    const historyItem: RouteHistoryItem = {
      id: Date.now().toString(), // Simple ID generation
      activeRoute,
      time,
      distance,
      date: new Date().toISOString(),
    };

    const existingHistory = await getRouteHistory();
    const updatedHistory = [historyItem, ...existingHistory]; // Add new item to the beginning

    await AsyncStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('Route saved to history:', historyItem);
  } catch (error) {
    console.error('Error saving route to history:', error);
  }
};

export const getRouteHistory = async (): Promise<RouteHistoryItem[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(ROUTE_HISTORY_KEY);
    if (historyJson) {
      return JSON.parse(historyJson);
    }
    return [];
  } catch (error) {
    console.error('Error getting route history:', error);
    return [];
  }
};

export const deleteRouteFromHistory = async (id: string): Promise<void> => {
  try {
    const existingHistory = await getRouteHistory();
    const updatedHistory = existingHistory.filter(item => item.id !== id);
    await AsyncStorage.setItem(ROUTE_HISTORY_KEY, JSON.stringify(updatedHistory));
    console.log('Route deleted from history:', id);
  } catch (error) {
    console.error('Error deleting route from history:', error);
  }
};

export const clearAllRouteHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ROUTE_HISTORY_KEY);
    console.log('All route history cleared');
  } catch (error) {
    console.error('Error clearing route history:', error);
  }
};

// Utility functions for formatting
export const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2);
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, '0')}m`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Check if it's today
  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Check if it's yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise show the date
  return date.toLocaleDateString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatRouteStops = (locations: { locationName: string }[]): string => {
  if (locations.length === 0) return 'Unknown Route';
  if (locations.length === 1) return locations[0].locationName;
  if (locations.length === 2) {
    return `${locations[0].locationName} → ${locations[1].locationName}`;
  }
  // For multiple stops, show first → last
  return `${locations[0].locationName} → ${locations[locations.length - 1].locationName}`;
};

export const formatMode = (mode: string): string => {
  switch (mode.toLowerCase()) {
    case 'driving-car':
      return 'Car';
    case 'foot-walking':
      return 'Walking';
    case 'cycling-regular':
      return 'Cycling';
    case 'foot-hiking':
      return 'Hiking';
    default:
      return `${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  }
};
