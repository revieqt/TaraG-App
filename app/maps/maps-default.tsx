import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Alert } from 'react-native';
import MapView, { Region, PROVIDER_DEFAULT, MAP_TYPES } from 'react-native-maps';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import LocationAutocomplete, { LocationItem } from '@/components/LocationAutocomplete';
import TaraMarker from '@/components/maps/TaraMarker';
import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import { generateRouteWithLocations } from '@/services/routeApiService';
import { useLocation } from '@/hooks/useLocation';
import { useMapType } from '@/hooks/useMapType';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

export default function DefaultMap() {
  const primaryColor = useThemeColor({}, 'primary');
  const { latitude, longitude, loading, error } = useLocation();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { mapType: currentMapType } = useMapType();
  const { session, updateSession } = useSession();
  
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

  // State for map region and selected location
  const [region, setRegion] = useState<Region>({
    latitude: latitude || 0,
    longitude: longitude || 0,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update map region when user location changes
  useEffect(() => {
    if (latitude && longitude) {
      setRegion(prev => ({
        ...prev,
        latitude,
        longitude,
      }));
    }
  }, [latitude, longitude]);

  // Handle location selection from autocomplete
  const handleLocationSelect = (location: LocationItem) => {
    setSelectedLocation(location);
    setSearchQuery(location.locationName);
    
    if (location.latitude && location.longitude) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01, // Zoom in more for selected location
        longitudeDelta: 0.01 * ASPECT_RATIO,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  };

 

  const handleGetDirection = async (amenity: any) => {
    if (session?.activeRoute) {
    Alert.alert(
        "Active Route Detected",
        "You must end the active route before creating a new one.",
        [{ text: "OK", style: "default" }]
    );
    return;
    }

    if (!latitude || !longitude || !session?.user?.id) {
    Alert.alert("Error", "Unable to get your location or user information.");
    return;
    }

    try {
    const route = await generateRouteWithLocations({
        startLocation: { latitude, longitude },
        endLocation: { latitude: amenity.latitude, longitude: amenity.longitude },
        waypoints: [],
        mode: 'driving-car',
        userID: session.user.id
    });

    if (route) {
        const activeRoute = {
        routeID: `route_${Date.now()}`,
        userID: session.user.id,
        location: [
            { latitude, longitude, locationName: 'Your Location' },
            { latitude: amenity.latitude, longitude: amenity.longitude, locationName: amenity.name }
        ],
        mode: 'driving-car',
        status: 'active',
        createdOn: new Date(),
        routeData: route
        };

        await updateSession({ activeRoute });
        console.log('Route to amenity created:', activeRoute);
        
        // Use a more reliable navigation approach
        try {
        // Small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 50));
        router.replace('/(tabs)/maps');
        } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback navigation
        router.push('/(tabs)/maps');
        }
    } else {
        Alert.alert("Error", "Failed to generate route. Please try again.");
    }
    } catch (error) {
    console.error('Error generating route to amenity:', error);
    Alert.alert("Error", "Failed to generate route. Please try again.");
    }
};

const defaultRegion: Region = {
    latitude: latitude || 14.5995,
    longitude: longitude || 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };
  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType={getMapTypeEnum(currentMapType)}
        region={region}
        showsUserLocation
        zoomControlEnabled
        initialRegion={defaultRegion}
      >
        {/* Selected Location Marker */}
        {selectedLocation?.latitude && selectedLocation.longitude && (
          <TaraMarker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title={selectedLocation.locationName}
            description={selectedLocation.note}
          />
        )}
      </MapView>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <LocationAutocomplete
          value={searchQuery}
          onSelect={handleLocationSelect}
          placeholder="Search for a location"
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {/* Location Details Bottom Sheet */}
      {selectedLocation && (
        <BottomSheet snapPoints={[0.3, 0.5, 0.9]} defaultIndex={0}>
          <View style={styles.bottomSheetContent}>
            <ThemedText type="title">
              {selectedLocation.locationName}
            </ThemedText>
            {selectedLocation.note && (
              <ThemedText style={styles.locationNote}>
                {selectedLocation.note}
              </ThemedText>
            )}
            <ThemedText style={styles.coordinateValue}>
                lat {selectedLocation.latitude?.toFixed(6)}, long {selectedLocation.longitude?.toFixed(6)}
            </ThemedText>
            <Button
              title="Get Directions"
              onPress={() => handleGetDirection(selectedLocation)}
            />
          </View>
        </BottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 1000,
    borderRadius: 10,
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
  },
  locationNote: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  coordinateValue: {
    marginVertical: 10,
    opacity: 0.5,
  },
});
