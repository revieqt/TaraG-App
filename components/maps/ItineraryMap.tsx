import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import MapView, { MAP_TYPES } from 'react-native-maps';
import TaraMarker from './TaraMarker';
import { useMapType } from '@/hooks/useMapType';

interface Location {
  latitude: number;
  longitude: number;
  locationName: string;
  note?: string;
}

interface DateLocations {
  date: number; // timestamp
  locations: Location[];
}

interface Itinerary {
  userID: string;
  title: string;
  type: string;
  description: string;
  startDate: number;
  endDate: number;
  planDaily: boolean;
  status: string;
  manuallyUpdated: boolean;
  createdOn: number;
  updatedOn: number;
  locations: DateLocations[];
}

interface ItineraryMapProps {
  itinerary: Itinerary;
}

const ItineraryMap: React.FC<ItineraryMapProps> = ({ itinerary }) => {
  const { mapType: currentMapType } = useMapType();
  const allLocations: Location[] = Array.isArray(itinerary.locations)
    ? itinerary.locations
        .flatMap(day => Array.isArray(day.locations) ? day.locations : [])
        .filter(
          (loc): loc is Location =>
            !!loc &&
            typeof loc.latitude === 'number' &&
            typeof loc.longitude === 'number'
        )
    : [];

  // Center map on the first valid location, fallback to a default
  const initialRegion = allLocations.length > 0
    ? {
        latitude: allLocations[0].latitude,
        longitude: allLocations[0].longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 1,
        longitudeDelta: 1,
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
      <MapView style={styles.map} initialRegion={initialRegion} mapType={getMapTypeEnum(currentMapType)}>
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