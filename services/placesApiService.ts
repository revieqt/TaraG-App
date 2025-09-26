import { BACKEND_URL } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import { useEffect, useState } from 'react';

interface PlaceSuggestion {
  description: string;
  placeId: string;
  mainText: string;
  secondaryText: string;
}

interface PlaceDetails {
  name: string;
  placeId: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  totalRatings?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  photoReference?: string;
}

export const usePlacesApi = () => {
  const { session } = useSession();
  const location = useLocation();
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    if (location.latitude && location.longitude) {
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location.latitude, location.longitude]);

  const searchAutocomplete = async (searchQuery: string): Promise<PlaceSuggestion[]> => {
    if (!searchQuery.trim()) {
      return [];
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/places/search?search=${encodeURIComponent(searchQuery)}&latitude=${currentLocation?.latitude}&longitude=${currentLocation?.longitude}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch place suggestions');
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error in searchAutocomplete:', error);
      throw error;
    }
  };

  const getPlaceDetails = async (placeId: string): Promise<PlaceDetails> => {
    if (!placeId) {
      throw new Error('Place ID is required');
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/places/details/${placeId}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in getPlaceDetails:', error);
      throw error;
    }
  };

  return {
    searchAutocomplete,
    getPlaceDetails,
  };
};

export default usePlacesApi;
