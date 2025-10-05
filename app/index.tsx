import { Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { useLocationUpdater } from '../hooks/useLocationUpdater';

export default function Index() {
  const { session, loading } = useSession();

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
  
  if (loading) {
    return null;
  }

  if (session?.user && session?.accessToken) {
    handleUpdateLocation();
    return <Redirect href="/(tabs)/home" />;
    
  }

  return <Redirect href="/auth/login" />;
}