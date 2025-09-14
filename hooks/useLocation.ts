import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/constants/Config';

interface LocationData {
  latitude: number;
  longitude: number;
  suburb: string;
  city: string;
  state: string;
  region: string;
  country: string;
}

interface BigDataCloudResponse {
  locality?: string; // e.g., barangay / suburb
  city?: string;
  principalSubdivision?: string; // province/region
  countryName?: string;
  localityInfo?: {
    administrative?: Array<{
      name?: string;
      description?: string;
      isoName?: string;
      order?: number;
    }>;
  };
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  // Haversine formula
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function fetchMetroCebuData(): Promise<any[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/public/address-metroCebu.json`);
    if (!response.ok) throw new Error('Failed to fetch Metro Cebu data');
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getNearestMetroCebuAddressFromList(lat: number, lon: number, metroCebuData: any[]) {
  let minDist = Infinity;
  let nearest = { barangay: '', city: '' };
  for (const cityObj of metroCebuData as any[]) {
    for (const district of cityObj.districts) {
      const dist = getDistance(lat, lon, district.lat, district.lon);
      if (dist < minDist) {
        minDist = dist;
        nearest = { barangay: district.barangay, city: cityObj.city };
      }
    }
  }
  return nearest;
}

export const useLocation = () => {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
      // BigDataCloud reverse geocoding (free, no API key required)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch address data');
      }
      const data: BigDataCloudResponse = await response.json();

      // Attempt to resolve suburb from locality or administrative levels
      const adminLevels = data.localityInfo?.administrative || [];
      const adminSuburb = adminLevels.find(l => (l.description || '').toLowerCase().includes('suburb'))?.name;
      const suburb = data.locality || adminSuburb || data.city || '';
      const city = data.city || data.locality || '';
      const principalSubdivision = data.principalSubdivision || '';
      const country = data.countryName || '';

      return {
        latitude,
        longitude,
        suburb,
        city,
        state: principalSubdivision,
        region: principalSubdivision,
        country,
      };
    } catch (err) {
      // Fallback: fetch Metro Cebu data from backend public
      const metroCebuData = await fetchMetroCebuData();
      const nearest = getNearestMetroCebuAddressFromList(latitude, longitude, metroCebuData);
      return {
        latitude,
        longitude,
        suburb: nearest.barangay,
        city: nearest.city,
        state: '',
        region: '',
        country: '',
      };
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      const addressData = await getAddressFromCoordinates(latitude, longitude);
      setLocationData(addressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const refreshLocation = () => {
    getCurrentLocation();
  };

  return {
    ...locationData,
    loading,
    error,
    refreshLocation,
  };
};
