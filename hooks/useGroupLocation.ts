import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import { BACKEND_URL } from '@/constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseGroupLocationProps {
  groupId: string;
  enabled?: boolean; // Allow enabling/disabling the hook
}

/**
 * Hook to automatically send location updates to group room every 10 seconds
 */
export const useGroupLocation = ({ groupId, enabled = true }: UseGroupLocationProps) => {
  const { session } = useSession();
  const location = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState(false);

  // Load sharing preference from AsyncStorage
  useEffect(() => {
    const loadSharingPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(`@location_sharing_${groupId}`);
        setIsSharingLocation(stored === 'true');
      } catch (error) {
        console.error('Error loading sharing preference:', error);
      }
    };
    if (groupId) {
      loadSharingPreference();
    }
  }, [groupId]);

  const sendLocationUpdate = async () => {
    if (!session?.accessToken || !session?.user || !location.latitude || !location.longitude) {
      console.log('⏭️ Skipping location update: missing data', {
        hasToken: !!session?.accessToken,
        hasUser: !!session?.user,
        hasLocation: !!(location.latitude && location.longitude)
      });
      return;
    }

    try {
      const payload = {
        groupId,
        userID: session.user.id,
        username: session.user.username,
        latitude: location.latitude,
        longitude: location.longitude,
        isInAnEmergency: session.user.safetyState?.isInAnEmergency || false,
        emergencyType: session.user.safetyState?.emergencyType || '',
        isSharingLocation,
      };

      console.log('📍 Sending location update to room:', {
        groupId,
        username: session.user.username,
        coords: { lat: location.latitude, lng: location.longitude }
      });

      const response = await fetch(`${BACKEND_URL}/groups/update-room-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to update location:', data.message);
        return;
      }

      console.log('✅ Location updated successfully');
    } catch (error) {
      console.error('❌ Error sending location update:', error);
    }
  };

  useEffect(() => {
    if (!enabled || !groupId || !isSharingLocation) {
      console.log('⏸️ Group location updates disabled:', { enabled, groupId, isSharingLocation });
      return;
    }

    console.log('▶️ Starting group location updates for group:', groupId);

    // Send initial location update
    sendLocationUpdate();

    // Set up interval to send updates every 10 seconds
    intervalRef.current = setInterval(() => {
      sendLocationUpdate();
    }, 10000);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        console.log('⏹️ Stopping group location updates for group:', groupId);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [groupId, enabled, isSharingLocation, session?.accessToken, session?.user?.id, location.latitude, location.longitude]);

  const toggleLocationSharing = async (value: boolean) => {
    try {
      // If turning OFF, send one final update with isSharingLocation: false
      if (!value && session?.accessToken && session?.user && location.latitude && location.longitude) {
        console.log('📍 Sending final location update before hiding...');
        
        const payload = {
          groupId,
          userID: session.user.id,
          username: session.user.username,
          latitude: location.latitude,
          longitude: location.longitude,
          isInAnEmergency: session.user.safetyState?.isInAnEmergency || false,
          emergencyType: session.user.safetyState?.emergencyType || '',
          isSharingLocation: false, // Explicitly set to false
        };

        await fetch(`${BACKEND_URL}/groups/update-room-location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        
        console.log('✅ Final location update sent');
      }
      
      await AsyncStorage.setItem(`@location_sharing_${groupId}`, value.toString());
      setIsSharingLocation(value);
      console.log('📍 Location sharing toggled:', value);
    } catch (error) {
      console.error('Error saving sharing preference:', error);
    }
  };

  return {
    isUpdating: !!intervalRef.current,
    isSharingLocation,
    toggleLocationSharing,
  };
};
