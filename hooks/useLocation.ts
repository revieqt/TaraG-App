import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { BACKEND_URL } from '@/constants/Config';

export interface LocationData {
  latitude: number;
  longitude: number;
  suburb: string;
  city: string;
  state: string;
  region: string;
  country: string;
}

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  quarter?: string;
  hamlet?: string;
  village?: string;
  town?: string;
  city?: string;
  municipality?: string;
  county?: string;
  state?: string;
  region?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResponse {
  address: NominatimAddress;
  display_name: string;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
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
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "TaraG/1.0 (contact@example.com)" // 👈 replace with your app/email
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch address data');

      const data: NominatimResponse = await response.json();
      const address = data.address;

      // Extract fields with better fallbacks
      const suburb =
        address.suburb ||
        address.neighbourhood ||
        address.quarter ||
        address.hamlet ||
        address.village ||
        '';

      const city =
        address.city ||
        address.town ||
        address.municipality ||
        address.county ||
        '';

      const state = address.state || '';
      const region = address.region || state;
      const country = address.country || '';

      return {
        latitude,
        longitude,
        suburb,
        city,
        state,
        region,
        country,
      };
    } catch (err) {
      // Fallback to Metro Cebu JSON
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
