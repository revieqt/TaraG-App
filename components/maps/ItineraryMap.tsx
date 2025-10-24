import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Alert, TouchableOpacity } from 'react-native';
import MapView, { MAP_TYPES, PROVIDER_DEFAULT } from 'react-native-maps';
import TaraMarker from './TaraMarker';
import { useMapType } from '@/hooks/useMapType';
import { useLocation } from '@/hooks/useLocation';
import BottomSheet from '@/components/BottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcons } from '@/components/ThemedIcons';
import LocationDisplay from '@/components/LocationDisplay';
import Button from '@/components/Button';
import WeatherCard from '@/components/custom/WeatherCard';
import { useSession } from '@/context/SessionContext';
import { generateRouteWithLocations } from '@/services/routeApiService';
import { router } from 'expo-router';

interface Location {
  latitude: number;
  longitude: number;
  locationName: string;
  note?: string;
  date?: number | Date | string;
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
  const { session, updateSession } = useSession();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const mapRef = useRef<MapView>(null);
  
  // Return null if no itinerary provided
  if (!itinerary) {
    return null;
  }
  const allLocations: Location[] = Array.isArray(itinerary?.locations)
    ? itinerary.locations
        .flatMap(item => {
          // Handle DateLocations format (has date and locations array)
          if (item && typeof item === 'object' && 'locations' in item && Array.isArray(item.locations)) {
            // Attach the date to each location
            return item.locations.map((loc: any) => ({
              ...loc,
              date: item.date
            }));
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

  const handleGetDirection = async (location: Location) => {
    if (session?.activeRoute) {
      Alert.alert(
        "Active Route Detected",
        "You must end the active route before creating a new one.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (!userLat || !userLng || !session?.user?.id) {
      Alert.alert("Error", "Unable to get your location or user information.");
      return;
    }

    try {
      const route = await generateRouteWithLocations({
        startLocation: { latitude: userLat, longitude: userLng },
        endLocation: { latitude: location.latitude, longitude: location.longitude },
        waypoints: [],
        mode: 'driving-car',
        userID: session.user.id
      });

      if (route) {
        const activeRoute = {
          routeID: `route_${Date.now()}`,
          userID: session.user.id,
          location: [
            { latitude: userLat, longitude: userLng, locationName: 'Your Location' },
            { latitude: location.latitude, longitude: location.longitude, locationName: location.locationName }
          ],
          mode: 'driving-car',
          status: 'active',
          createdOn: new Date(),
          routeData: route
        };

        await updateSession({ activeRoute });
        console.log('Route to location created:', activeRoute);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 50));
          router.replace('/(tabs)/maps');
        } catch (navError) {
          console.error('Navigation error:', navError);
          router.push('/(tabs)/maps');
        }
      } else {
        Alert.alert("Error", "Failed to generate route. Please try again.");
      }
    } catch (error) {
      console.error('Error generating route to location:', error);
      Alert.alert("Error", "Failed to generate route. Please try again.");
    }
  };

  const handleMarkerPress = (location: Location) => {
    setSelectedLocation(location);
  };

  const handleLocationClick = (location: Location) => {
    // Zoom map to the location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
    // Show the location details with Get Directions button
    setSelectedLocation(location);
  };

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      if (typeof dateValue === 'string') {
        return dateValue.slice(0, 10);
      }
      if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 10);
      }
      if (typeof dateValue === 'number') {
        return new Date(dateValue).toISOString().slice(0, 10);
      }
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toISOString().slice(0, 10);
      }
      return 'Invalid Date';
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return 'Invalid Date';
    }
  };

  const renderDayLocations = (loc: any) => {
    return (
      <LocationDisplay
        content={loc.locations && Array.isArray(loc.locations) ? loc.locations.map((l: any, i: number) => (
          <TouchableOpacity 
            key={i} 
            style={{flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginBottom: 10}}
            onPress={() => handleLocationClick(l)}
            activeOpacity={0.7}
          >
            <View>
              <ThemedText>{l.locationName} </ThemedText>
              <ThemedText style={{opacity: .5}}>{l.note ? `${l.note}` : ''}</ThemedText>
            </View>
          </TouchableOpacity>
        )) : []}
      />
    );
  };

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map} 
        initialRegion={initialRegion} 
        showsUserLocation={true}
        mapType={getMapTypeEnum(currentMapType)}
      >
        {allLocations.map((loc, idx) => {
          return (
            <TaraMarker
              key={`${loc.latitude},${loc.longitude},${idx}`}
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              onPress={() => handleMarkerPress(loc)}
              type="dot"
            />
          );
        })}
      </MapView>
      
      <BottomSheet snapPoints={[0.5, 0.9]} defaultIndex={0} style={{paddingHorizontal: 16}}>
        {selectedLocation ? (
          <View>
            <View style={styles.locationTitleContainer}>
              <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                <ThemedIcons library="MaterialIcons" name="arrow-back-ios" size={20} />
              </TouchableOpacity>
              <ThemedText type="subtitle">
                {selectedLocation.locationName}
              </ThemedText>
            </View>

            <View style={styles.locationDetailsContainer}>
              <ThemedIcons library="MaterialIcons" name="location-on" size={15} />
              <ThemedText style={{fontSize: 12}}>
                {selectedLocation.latitude}, {selectedLocation.longitude}
              </ThemedText>
            </View>
            
            {selectedLocation.note && (
              <ThemedText style={styles.locationNote}>
                {selectedLocation.note}
              </ThemedText>
            )}
            <Button
              title="Start Route"
              onPress={() => handleGetDirection(selectedLocation)}
              buttonStyle={styles.directionsButton}
              type="primary"
            />
            
            <WeatherCard
              latitude={selectedLocation.latitude}
              longitude={selectedLocation.longitude}
              locationName={selectedLocation.locationName}
              date={selectedLocation.date 
                ? formatDate(selectedLocation.date)
                : itinerary?.startDate 
                  ? formatDate(itinerary.startDate)
                  : undefined
              }
            />
          </View>
        ) : (
          itinerary && (
            <View style={{ flex: 1 }}>
              <ThemedText style={{marginBottom: 25}}>{itinerary.description}</ThemedText>
              {Array.isArray(itinerary.locations) && itinerary.locations.length > 0 && (
                itinerary.locations.map((loc: any, idx: number) => (
                  <View key={idx}>
                    {loc.date && (
                      <>
                        <ThemedText type='subtitle' style={{fontSize: 15}}>Day {idx + 1} </ThemedText>
                        <ThemedText style={{marginBottom: 12, opacity: .5}}>({formatDate(loc.date)})</ThemedText>
                      </>
                    )}
                    {renderDayLocations(loc)}
                  </View>
                ))
              )}
            </View>
          )
        )}
      </BottomSheet>
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
  locationNote: {
    opacity: 0.7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ccc5',
    borderRadius: 15,
    padding: 10,
    textAlign: 'center'
  },
  directionsButton: {
    marginVertical: 16,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10
  },
  locationDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    opacity: .5
  },
});