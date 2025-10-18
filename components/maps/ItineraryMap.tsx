import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { MAP_TYPES } from 'react-native-maps';
import TaraMarker from './TaraMarker';
import { useMapType } from '@/hooks/useMapType';
import { useLocation } from '@/hooks/useLocation';

interface Location {
  latitude: number;
  longitude: number;
  locationName: string;
  note?: string;
}

interface DateLocations {
  date: number | Date | string; // flexible date format
  locations: Location[];
}

interface Itinerary {
  userID?: string;
  title?: string;
  type?: string;
  description?: string;
  startDate?: number | Date | string;
  endDate?: number | Date | string;
  planDaily?: boolean;
  status?: string;
  manuallyUpdated?: boolean;
  createdOn?: number | Date | string;
  updatedOn?: number | Date | string;
  locations?: DateLocations[] | Location[]; // flexible locations format
}

interface ItineraryMapProps {
  itinerary: Itinerary | null;
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ itinerary }) => {
  const { mapType: currentMapType } = useMapType();
  const { latitude: userLat, longitude: userLng } = useLocation();
  
  // Return null if no itinerary provided
  if (!itinerary) {
    return null;
  }
  const allLocations: Location[] = Array.isArray(itinerary?.locations)
    ? itinerary.locations
        .flatMap(item => {
          // Handle DateLocations format (has date and locations array)
          if (item && typeof item === 'object' && 'locations' in item && Array.isArray(item.locations)) {
            return item.locations;
          }
          // Handle direct Location format
          if (item && typeof item === 'object' && 'latitude' in item && 'longitude' in item) {
            return [item];
          }
          return [];
        })
        .filter(
          (loc): loc is Location =>
            !!loc &&
            typeof loc.latitude === 'number' &&
            typeof loc.longitude === 'number'
        )
    : [];

  // Center map on the first valid location, fallback to user's location, then default
  const initialRegion = allLocations.length > 0
    ? {
        latitude: allLocations[0].latitude,
        longitude: allLocations[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : userLat && userLng
    ? {
        latitude: userLat,
        longitude: userLng,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 10.3157, // Default to Cebu City coordinates
        longitude: 123.8854,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

    const getMapTypeEnum = (mapType: string) => {
        switch (mapType) {
          case 'satellite':
            return MAP_TYPES.SATELLITE;
          case 'hybrid':
            return MAP_TYPES.HYBRID;
          case 'terrain':
            return MAP_TYPES.TERRAIN;
          case 'standard':
          default:
            return MAP_TYPES.STANDARD;
        }
      };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} 
      showsUserLocation={true}
      mapType={getMapTypeEnum(currentMapType)}>
        {allLocations.map((loc, idx) => (
          <TaraMarker
            key={`${loc.latitude},${loc.longitude},${idx}`}
            coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
            label={loc.locationName?.charAt(0).toUpperCase()}
            title={loc.locationName}
            description={loc.note}
          />
        ))}
      </MapView>
    </View>
  );
};

export default ItineraryMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    borderRadius: 10,
    overflow: 'hidden',
  },
});