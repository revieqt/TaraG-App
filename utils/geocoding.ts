import * as Location from 'expo-location';

export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  locationName: string;
}

/**
 * Convert a location name/address to coordinates using Expo Location geocoding
 * Falls back to Nominatim if Expo geocoding fails
 */
export async function geocodeLocation(locationName: string): Promise<GeocodedLocation | null> {
  try {
    // Try Expo Location geocoding first
    const geocoded = await Location.geocodeAsync(locationName);
    
    if (geocoded && geocoded.length > 0) {
      const result = geocoded[0];
      return {
        latitude: result.latitude,
        longitude: result.longitude,
        locationName: locationName,
      };
    }

    // Fallback to Nominatim (OpenStreetMap) geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`;
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'TaraG/1.0',
      },
    });

    if (!response.ok) {
      console.error('Nominatim geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        locationName: result.display_name || locationName,
      };
    }

    console.error('No geocoding results found for:', locationName);
    return null;
  } catch (error) {
    console.error('Error geocoding location:', error);
    return null;
  }
}

/**
 * Get current location coordinates
 * Returns null if location permission is denied or location unavailable
 */
export async function getCurrentLocationCoords(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Location permission denied');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}
