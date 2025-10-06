import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
const AnimatedMarker = Animated.createAnimatedComponent(Marker);
import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedIcons } from '@/components/ThemedIcons';

interface RouteMapProps {
  style?: any;
  showUserLocation?: boolean;
  showRouteMarkers?: boolean;
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  is3DView?: boolean;
  cameraHeading?: number;
  cameraPitch?: number;
  focusOnUserLocation?: boolean;
}

export default function RouteMap({ 
  style, 
  showUserLocation = true, 
  showRouteMarkers = true,
  mapType = 'standard',
  is3DView = false,
  cameraHeading = 0,
  cameraPitch = 0,
  focusOnUserLocation = false
}: RouteMapProps) {
  const { session } = useSession();
  const { latitude, longitude } = useLocation();
  const [region, setRegion] = useState({
    latitude: 10.3157, // Default to Cebu City
    longitude: 123.8854,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Animated user location for smooth movement
  const animatedLatitude = useRef(new Animated.Value(latitude || 10.3157));
  const animatedLongitude = useRef(new Animated.Value(longitude || 123.8854));

  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  const activeRoute = session?.activeRoute;

  // Calculate region based on route bounds or user location
  useEffect(() => {
    if (focusOnUserLocation && latitude && longitude) {
      // Focus on user location for normal view
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else if (activeRoute?.routeData?.geometry?.coordinates) {
      const coordinates = activeRoute.routeData.geometry.coordinates;
      
      if (coordinates.length > 0) {
        let minLat = coordinates[0][1];
        let maxLat = coordinates[0][1];
        let minLon = coordinates[0][0];
        let maxLon = coordinates[0][0];

        // Find bounds
        coordinates.forEach(([lon, lat]) => {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
        });

        // Add padding
        const latPadding = (maxLat - minLat) * 0.1;
        const lonPadding = (maxLon - minLon) * 0.1;

        setRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: Math.max(maxLat - minLat + latPadding, 0.01),
          longitudeDelta: Math.max(maxLon - minLon + lonPadding, 0.01),
        });
      }
    } else if (latitude && longitude) {
      // Use current location if no route
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [activeRoute, latitude, longitude, focusOnUserLocation]);

  // Animate user location for smooth movement
  useEffect(() => {
    if (latitude && longitude) {
      // Animate both coordinates simultaneously for smooth movement
      Animated.parallel([
        Animated.timing(animatedLatitude.current, {
          toValue: latitude,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedLongitude.current, {
          toValue: longitude,
          duration: 1000,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [latitude, longitude]);

  // Convert route coordinates to map format
  const routeCoordinates = activeRoute?.routeData?.geometry?.coordinates?.map(([lon, lat]) => ({
    latitude: lat,
    longitude: lon,
  })) || [];

  // Get route locations for markers
  const routeLocations = activeRoute?.location || [];

  // Camera configuration for both 3D and normal view
  const cameraConfig = {
    center: {
      latitude: latitude || region.latitude,
      longitude: longitude || region.longitude,
    },
    pitch: is3DView ? 60 : 0, // Fixed 60-degree pitch for 3D view
    heading: is3DView ? cameraHeading : 0, // Only apply heading rotation in 3D view
    altitude: is3DView ? Math.max(100, Math.min(2000, 300)) : Math.max(100, Math.min(2000, 1000)), // Slightly higher altitude for 3D
    zoom: is3DView ? Math.max(10, Math.min(22, 18)) : Math.max(10, Math.min(22, 18)), // Slightly less zoom for 3D view
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        mapType={mapType}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        loadingEnabled={true}
        loadingIndicatorColor={secondaryColor}
        loadingBackgroundColor={primaryColor}
        camera={cameraConfig}
        pitchEnabled={is3DView}
        rotateEnabled={is3DView} // Only allow rotation in 3D view
        scrollEnabled={!is3DView}
        zoomEnabled={!is3DView}
        zoomTapEnabled={!is3DView}
      >
        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={secondaryColor}
            strokeWidth={4}
            lineDashPattern={[1, 0]}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Route Markers */}
        {showRouteMarkers && routeLocations.map((location, index) => {
          const isStart = index === 0;
          const isEnd = index === routeLocations.length - 1;
          
          return (
            <Marker
              key={`${location.latitude}-${location.longitude}-${index}`}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={location.locationName}
              description={isStart ? 'Start' : isEnd ? 'Destination' : `Stop ${index}`}
            >
              <View style={[
                styles.markerContainer,
                { backgroundColor: isStart ? '#4CAF50' : isEnd ? '#F44336' : secondaryColor }
              ]}>
                <ThemedIcons
                  library="MaterialIcons"
                  name={isStart ? 'play-arrow' : isEnd ? 'flag' : 'place'}
                  size={20}
                  color="white"
                />
              </View>
            </Marker>
          );
        })}

        {/* Current Location Marker (if not showing user location) - Animated */}
        {!showUserLocation && latitude && longitude && (
          <AnimatedMarker
            coordinate={{
              latitude: animatedLatitude.current,
              longitude: animatedLongitude.current,
            }}
            title="Your Location"
            description="Current position"
          >
            <View style={[styles.markerContainer, { backgroundColor: '#2196F3' }]}>
              <ThemedIcons
                library="MaterialIcons"
                name="my-location"
                size={20}
                color="white"
              />
            </View>
          </AnimatedMarker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
