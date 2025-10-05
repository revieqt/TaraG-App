import { useCallback, useRef } from 'react';
import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import { updateLastKnownLocation } from '@/services/userApiService';

export const useLocationUpdater = () => {
  const { session, updateSession } = useSession();
  const { latitude, longitude, loading, error } = useLocation();
  const lastUpdateRef = useRef<{ lat: number; lng: number; time: number } | null>(null);
  const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUserLocation = useCallback(async (forceUpdate: boolean = false) => {
    // Only proceed if user is logged in and location is available
    if (!session?.user || !session?.accessToken || loading || error || !latitude || !longitude) {
      console.log('❌ Cannot update location: missing requirements', {
        hasUser: !!session?.user,
        hasToken: !!session?.accessToken,
        loading,
        error: !!error,
        hasCoords: !!(latitude && longitude)
      });
      return false;
    }

    const currentTime = Date.now();
    const lastUpdate = lastUpdateRef.current;
    const userLastKnownLocation = session.user.lastKnownLocation;

    // Check if we should update (force update, first time, no existing location, or significant change/time passed)
    const shouldUpdate = forceUpdate ||
      !lastUpdate || 
      !userLastKnownLocation?.latitude || // User has no previous location data
      !userLastKnownLocation?.longitude ||
      Math.abs(lastUpdate.lat - latitude) > 0.001 || // ~100m change
      Math.abs(lastUpdate.lng - longitude) > 0.001 ||
      (currentTime - lastUpdate.time) > 5 * 60 * 1000; // 5 minutes

    if (!shouldUpdate) {
      console.log('📍 Location update skipped - no significant change');
      return false;
    }

    // Clear any existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    try {
      console.log('📍 Updating location...', { latitude, longitude });
      await updateLastKnownLocation(latitude, longitude, session.accessToken!);
      
      // Update the session context with new location
      const updatedUser = {
        ...session.user!,
        lastKnownLocation: {
          latitude,
          longitude,
          updatedAt: new Date()
        }
      };
      
      await updateSession({ user: updatedUser });

      // Update the ref to track last update
      lastUpdateRef.current = {
        lat: latitude,
        lng: longitude,
        time: currentTime
      };

      console.log('✅ Last known location updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update last known location:', error);
      return false;
    }
  }, [session, latitude, longitude, loading, error, updateSession]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = null;
    }
  }, []);

  return {
    updateUserLocation,
    cleanup,
    isLocationAvailable: !!(latitude && longitude && !loading && !error),
    currentLocation: { latitude, longitude }
  };
};
