import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useLocationUpdater } from '../hooks/useLocationUpdater';
import * as Location from 'expo-location';

export default function Index() {
  const { session, loading } = useSession();
  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(null);

  // Check location permission when user is logged in
  useEffect(() => {
    const checkLocationPermission = async () => {
      if (session?.user && session?.accessToken) {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          setLocationPermissionGranted(status === 'granted');
        } catch (error) {
          console.error('Error checking location permission:', error);
          setLocationPermissionGranted(false);
        }
      }
    };

    checkLocationPermission();
  }, [session?.user, session?.accessToken]);

  const handleUpdateLocation = async () => {
    const { updateUserLocation, isLocationAvailable } = useLocationUpdater();
  
    // Update location when user opens the app (if logged in)
    useEffect(() => {
      if (session?.user && session?.accessToken && isLocationAvailable) {
        // Trigger location update when app opens
        updateUserLocation(true); // Force update on app open
      }
    }, [session?.user, session?.accessToken, isLocationAvailable, updateUserLocation]);
  }
  
  if (loading || (session?.user && locationPermissionGranted === null)) {
    return null;
  }

  if (session?.user && session?.accessToken) {
    // Check if location permission is granted
    if (locationPermissionGranted === false) {
      return <Redirect href="/locationPermission" />;
    }
    
    handleUpdateLocation();
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}