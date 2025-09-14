import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MapType = 'standard' | 'terrain' | 'satellite' | 'hybrid';

export const MAP_TYPES = {
  STANDARD: 'standard' as const,
  TERRAIN: 'terrain' as const,
  SATELLITE: 'satellite' as const,
  HYBRID: 'hybrid' as const
} as const;

const MAP_TYPE_STORAGE_KEY = 'selectedMapType';

export const useMapType = () => {
  const [mapType, setMapType] = useState<MapType>(MAP_TYPES.STANDARD);
  const [isLoading, setIsLoading] = useState(true);

  // Load map type from AsyncStorage
  const loadMapType = async (): Promise<MapType> => {
    try {
      const savedMapType = await AsyncStorage.getItem(MAP_TYPE_STORAGE_KEY);
      return (savedMapType as MapType) || MAP_TYPES.STANDARD;
    } catch (error) {
      console.error('Error loading map type from AsyncStorage:', error);
      return MAP_TYPES.STANDARD;
    }
  };

  // Save map type to AsyncStorage
  const saveMapType = async (newMapType: MapType): Promise<void> => {
    try {
      await AsyncStorage.setItem(MAP_TYPE_STORAGE_KEY, newMapType);
      setMapType(newMapType);
    } catch (error) {
      console.error('Error saving map type to AsyncStorage:', error);
      throw error;
    }
  };

  // Load initial map type on mount
  useEffect(() => {
    const initializeMapType = async () => {
      setIsLoading(true);
      const savedMapType = await loadMapType();
      setMapType(savedMapType);
      setIsLoading(false);
    };
    
    initializeMapType();
  }, []);

  // Listen for storage changes (for real-time updates across components)
  useEffect(() => {
    const checkForUpdates = async () => {
      const currentMapType = await loadMapType();
      setMapType(prevType => {
        if (prevType !== currentMapType) {
          return currentMapType;
        }
        return prevType;
      });
    };

    const interval = setInterval(checkForUpdates, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    mapType,
    setMapType: saveMapType,
    isLoading,
    MAP_TYPES
  };
};
