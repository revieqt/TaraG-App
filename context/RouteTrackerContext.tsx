import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSession } from './SessionContext';
import haversineDistance from '@/utils/haversineDistance';
import { usePathname } from 'expo-router';

interface RouteTrackerContextType {
  currentLocation: Location.LocationObjectCoords | null;
  nextStop: { latitude: number; longitude: number; locationName: string } | null;
  distanceToNextStop: number | null;
  alarmNearStop: boolean;
  setAlarmNearStop: (enabled: boolean) => void;
  showStopAlarm: boolean;
  dismissAlarm: () => void;
}

const RouteTrackerContext = createContext<RouteTrackerContextType | undefined>(undefined);

export const RouteTrackerProvider = ({ children }: { children: React.ReactNode }) => {
  const { session } = useSession();
  const pathname = usePathname();
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [nextStop, setNextStop] = useState<{ latitude: number; longitude: number; locationName: string } | null>(null);
  const [distanceToNextStop, setDistanceToNextStop] = useState<number | null>(null);
  const [alarmNearStop, setAlarmNearStop] = useState<boolean>(false);
  const [showStopAlarm, setShowStopAlarm] = useState<boolean>(false);
  const [lastAlarmStop, setLastAlarmStop] = useState<string>('');
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Load alarm setting from AsyncStorage
  useEffect(() => {
    const loadAlarmSetting = async () => {
      try {
        const saved = await AsyncStorage.getItem('alarmNearStop');
        if (saved !== null) {
          setAlarmNearStop(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading alarm setting:', error);
      }
    };
    loadAlarmSetting();
  }, []);

  // Save alarm setting to AsyncStorage
  const handleSetAlarmNearStop = async (enabled: boolean) => {
    try {
      await AsyncStorage.setItem('alarmNearStop', JSON.stringify(enabled));
      setAlarmNearStop(enabled);
    } catch (error) {
      console.error('Error saving alarm setting:', error);
    }
  };

  // Get distance threshold based on route mode
  const getDistanceThreshold = (mode: string): number => {
    switch (mode.toLowerCase()) {
      case 'walking':
        return 50; // 50 meters
      case 'hiking':
        return 100; // 100 meters
      case 'biking':
      case 'cycling':
        return 100; // 100 meters
      case 'driving':
      case 'car':
        return 200; // 200 meters
      default:
        return 100; // Default to 100 meters
    }
  };

  // Start location tracking when there's an active route
  useEffect(() => {
    if (session?.activeRoute && alarmNearStop) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [session?.activeRoute, alarmNearStop]);

  // Update next stop when route or current location changes
  useEffect(() => {
    if (session?.activeRoute && currentLocation) {
      updateNextStop();
    }
  }, [session?.activeRoute, currentLocation]);

  // Check if user is within alarm radius of any stop
  useEffect(() => {
    if (
      alarmNearStop &&
      session?.activeRoute &&
      currentLocation
    ) {
      checkForNearbyStops();
    }
  }, [alarmNearStop, currentLocation, session?.activeRoute]);

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        (location) => {
          setCurrentLocation(location.coords);
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setCurrentLocation(null);
    setNextStop(null);
    setDistanceToNextStop(null);
  };

  const updateNextStop = () => {
    if (!session?.activeRoute || !currentLocation) return;

    const stops = session.activeRoute.location;
    if (stops.length === 0) return;

    // Find the closest upcoming stop (for display purposes)
    let closestStop = null;
    let minDistance = Infinity;

    for (const stop of stops) {
      const distance = haversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        stop.latitude,
        stop.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestStop = stop;
      }
    }

    if (closestStop) {
      setNextStop(closestStop);
      setDistanceToNextStop(minDistance);
    }
  };

  const checkForNearbyStops = () => {
    if (!session?.activeRoute || !currentLocation) return;

    // Don't trigger alarm if user is already on the maps screen
    if (pathname === '/(tabs)/maps') {
      console.log('🚫 Alarm suppressed - user is on maps screen');
      return;
    }

    const stops = session.activeRoute.location;
    if (stops.length === 0) return;

    const threshold = getDistanceThreshold(session.activeRoute.mode);
    let foundNearbyStop = false;

    // Check if user is within alarm radius of ANY stop (skip first stop - starting location)
    for (let i = 1; i < stops.length; i++) {
      const stop = stops[i];
      const distance = haversineDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        stop.latitude,
        stop.longitude
      );

      // If user is within the alarm radius and we haven't already alerted for this stop
      if (distance <= threshold) {
        foundNearbyStop = true;
        
        if (lastAlarmStop !== stop.locationName) {
          // Set this as the next stop for the alarm
          setNextStop(stop);
          setDistanceToNextStop(distance);
          
          // Trigger alarm
          setShowStopAlarm(true);
          setLastAlarmStop(stop.locationName);
          
          console.log(`🚨 ALARM: Within ${distance.toFixed(0)}m of ${stop.locationName} (threshold: ${threshold}m) - Stop ${i + 1}/${stops.length}`);
          break; // Only trigger for the first stop found within radius
        }
      }
    }

    // Reset alarm state if user is no longer near any stops (allows re-triggering)
    if (!foundNearbyStop && lastAlarmStop) {
      // Check if user is far enough from the last alarmed stop to reset
      const lastStop = stops.find(stop => stop.locationName === lastAlarmStop);
      if (lastStop) {
        const distanceFromLastStop = haversineDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          lastStop.latitude,
          lastStop.longitude
        );
        
        // Reset if user is more than 1.5x the threshold away from the last alarmed stop
        if (distanceFromLastStop > threshold * 1.5) {
          setLastAlarmStop('');
          console.log(`✅ Reset alarm state - user moved ${distanceFromLastStop.toFixed(0)}m away from ${lastStop.locationName}`);
        }
      }
    }
  };

  const dismissAlarm = () => {
    setShowStopAlarm(false);
  };

  return (
    <RouteTrackerContext.Provider
      value={{
        currentLocation,
        nextStop,
        distanceToNextStop,
        alarmNearStop,
        setAlarmNearStop: handleSetAlarmNearStop,
        showStopAlarm,
        dismissAlarm,
      }}
    >
      {children}
    </RouteTrackerContext.Provider>
  );
};

export const useRouteTracker = (): RouteTrackerContextType => {
  const context = useContext(RouteTrackerContext);
  if (!context) {
    throw new Error('useRouteTracker must be used within a RouteTrackerProvider');
  }
  return context;
};