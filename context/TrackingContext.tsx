import { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from './SessionContext';
import haversineDistance from '@/utils/haversineDistance';

// Optional imports for background tasks
let TaskManager: any;
let BackgroundFetch: any;

try {
  // These will be undefined if the modules aren't available
  TaskManager = require('expo-task-manager');
  BackgroundFetch = require('expo-background-fetch');
} catch (error) {
  console.warn('Background task modules not available:', error);
}

type BackgroundTaskData = {
  locations: Location.LocationObject[];
  error?: Error;
};

const TRACKING_TASK = 'background-location-tracking';

interface TrackingContextType {
  elapsedTime: number; // seconds
  distance: number; // meters
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

// Define the background task type
type TaskData = {
  data: BackgroundTaskData;
  error: Error | null;
};

// Only define the task if TaskManager is available
if (TaskManager) {
  TaskManager.defineTask(TRACKING_TASK, async ({ data, error }: TaskData) => {
    if (error) {
    console.error('Background task error:', error);
    return;
  }
  
  // This function runs in the background
  // We'll update the tracking data using AsyncStorage
  try {
    if (!data) return;
  const { locations } = data;
    const lastLocation = locations[locations.length - 1];
    
    if (lastLocation) {
      // Get previous tracking data
      const trackingData = await AsyncStorage.getItem('trackingData');
      const { distance: prevDistance, lastLocation: prevLocation } = trackingData 
        ? JSON.parse(trackingData) 
        : { distance: 0, lastLocation: null };
      
      let newDistance = prevDistance;
      
      // Calculate distance if we have a previous location
      if (prevLocation) {
        const d = haversineDistance(
          prevLocation.latitude,
          prevLocation.longitude,
          lastLocation.coords.latitude,
          lastLocation.coords.longitude
        );
        newDistance += d;
      }
      
      // Save updated tracking data
      await AsyncStorage.setItem('trackingData', JSON.stringify({
        distance: newDistance,
        lastLocation: lastLocation.coords,
        lastUpdated: new Date().toISOString()
      }));
    }
    
    return BackgroundFetch.Result.NewData;
  } catch (error) {
    console.error('Error in background task:', error);
      return BackgroundFetch.Result.Failed;
    }
  });
}

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSession();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const startTime = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocation = useRef<Location.LocationObjectCoords | null>(null);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  // Load saved tracking data
  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        const trackingData = await AsyncStorage.getItem('trackingData');
        if (trackingData) {
          const { distance: savedDistance } = JSON.parse(trackingData);
          setDistance(savedDistance);
        }
      } catch (error) {
        console.error('Error loading tracking data:', error);
      }
    };
    
    loadTrackingData();
  }, []);

  // Start/stop tracking based on active route
  useEffect(() => {
    if (session?.activeRoute) {
      startTracking();
    } else {
      stopTracking();
    }
    
    return () => {
      stopTracking();
    };
  }, [session?.activeRoute]);

  const startTracking = async () => {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      // Register background task if available
      if (TaskManager && BackgroundFetch) {
        try {
          await Location.startLocationUpdatesAsync(TRACKING_TASK, {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 10000, // Update every 10 seconds
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: 'Tracking your route',
              notificationBody: 'TaraG is tracking your route in the background',
              notificationColor: '#4CAF50',
            },
          });
        } catch (error) {
          console.warn('Failed to start background location updates:', error);
        }
      }

      // Start foreground tracking (more frequent updates when app is in foreground)
      subscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000, // Every second when in foreground
          distanceInterval: 1, // Every meter when in foreground
        },
        (location) => {
          // Update distance
          if (lastLocation.current) {
            const d = haversineDistance(
              lastLocation.current.latitude,
              lastLocation.current.longitude,
              location.coords.latitude,
              location.coords.longitude
            );
            setDistance(prev => {
              const newDistance = prev + d;
              // Save to AsyncStorage for background task access
              AsyncStorage.setItem('trackingData', JSON.stringify({
                distance: newDistance,
                lastLocation: location.coords,
                lastUpdated: new Date().toISOString()
              }));
              return newDistance;
            });
          }
          lastLocation.current = location.coords;
        }
      );

      // Start timer
      startTime.current = Date.now() - (elapsedTime * 1000);
      timer.current = setInterval(() => {
        if (startTime.current) {
          setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
        }
      }, 1000);

      setIsTracking(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  const stopTracking = async () => {
    // Clear timer
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
    
    // Stop location updates
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
    
    // Stop background task
    try {
      await Location.stopLocationUpdatesAsync(TRACKING_TASK);
    } catch (error) {
      console.error('Error stopping background task:', error);
    }
    
    // Reset state
    setIsTracking(false);
  };

  return (
    <TrackingContext.Provider 
      value={{
        elapsedTime,
        distance,
        isTracking,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = (): TrackingContextType => {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within a TrackingProvider');
  }
  return context;
};
