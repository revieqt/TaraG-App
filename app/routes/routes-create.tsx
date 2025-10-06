import LocationAutocomplete, { LocationItem } from '@/components/LocationAutocomplete';
import TaraMap from '@/components/maps/TaraMap';
import { useRef } from 'react';
import MapView from 'react-native-maps';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import RoundedButton from '@/components/RoundedButton';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import BottomSheet from '@/components/BottomSheet';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import LocationDisplay from '@/components/LocationDisplay';
import { useLocation } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionContext';
import { getRoutes } from '@/services/routeApiService';
import BackButton from '@/components/custom/BackButton';
import { router } from 'expo-router';
import { Polyline } from 'react-native-maps';
import TaraMarker from '@/components/maps/TaraMarker';
import Header from '@/components/Header';

const MODES = [
  { label: 'Car', value: 'driving-car', icon: 'directions-car', iconLibrary: 'MaterialIcons' },
  { label: 'Bicycle', value: 'cycling-regular', icon: 'directions-bike', iconLibrary: 'MaterialIcons' },
  { label: 'Walking', value: 'foot-walking', icon: 'directions-walk', iconLibrary: 'MaterialIcons' },
  { label: 'Hiking', value: 'foot-hiking', icon: 'hiking', iconLibrary: 'MaterialCommunityIcons' },
];

export default function CreateRouteScreen() {
  const [endLocation, setEndLocation] = useState<LocationItem | null>(null);
  const [waypoints, setWaypoints] = useState<LocationItem[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchedLocations, setSearchedLocations] = useState<LocationItem[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<{latitude: number, longitude: number}[]>([]);
  const [animatedCoordinates, setAnimatedCoordinates] = useState<{ latitude: number; longitude: number }[]>([]);

  // Auto-fit map when searched locations change (but not during route generation)
  useEffect(() => {
    if (searchedLocations.length > 0 && !isGenerating) {
      console.log('Fitting map to', searchedLocations.length, 'searched locations');
      setTimeout(() => fitMapToLocations(), 300);
    }
  }, [searchedLocations, isGenerating]);

  const secondaryColor = useThemeColor({}, 'accent');
  const backgroundColor = useThemeColor({}, 'background');

  const { loading, suburb , city, latitude, longitude } = useLocation();
  const { session, updateSession } = useSession();
  const mapRef = useRef<MapView>(null);

  // Function to fit map to show all locations including route coordinates
  const fitMapToLocations = () => {
    if (!mapRef.current || !latitude || !longitude) {
      console.log('Cannot fit map: missing mapRef or location');
      return;
    }
    
    let allLocations = [
      { latitude: latitude as number, longitude: longitude as number },
      ...searchedLocations.filter(loc => loc.latitude && loc.longitude).map(loc => ({
        latitude: loc.latitude!,
        longitude: loc.longitude!
      }))
    ];
    
    // Don't include route coordinates in fitting to prevent zoom out
    // Only fit to user location and searched locations (waypoints)
    
    console.log('Fitting map to', allLocations.length, 'locations');
    
    if (allLocations.length > 1) {
      mapRef.current.fitToCoordinates(allLocations, {
        edgePadding: { top: 80, right: 50, bottom: 150, left: 50 },
        animated: true
      });
    } else if (allLocations.length === 1) {
      mapRef.current.animateToRegion({
        latitude: allLocations[0].latitude,
        longitude: allLocations[0].longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      }, 1000);
    }
  };

  // Animation function for polyline
  const animatePolyline = (coordinates: {latitude: number, longitude: number}[]) => {
    console.log('Starting polyline animation with', coordinates.length, 'coordinates');
    setAnimatedCoordinates([]);
    let index = 0;
    const interval = setInterval(() => {
      if (index < coordinates.length) {
        const currentCoords = coordinates.slice(0, index + 1);
        setAnimatedCoordinates(currentCoords);
        
        // Follow the animation with camera
        if (mapRef.current && currentCoords.length > 0) {
          const currentPoint = currentCoords[currentCoords.length - 1];
          mapRef.current.animateToRegion({
            latitude: currentPoint.latitude,
            longitude: currentPoint.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
          }, 50); // Fast camera follow
        }
        
        index++;
      } else {
        console.log('Animation completed - returning to fit all locations');
        clearInterval(interval);
        // Return to fit all locations after animation completes
        setTimeout(() => fitMapToLocations(), 500);
      }
    }, 5); // Very fast animation - 5ms intervals
  };

  // Handle end location selection
  const handleEndLocationSelect = (location: LocationItem) => {
    console.log('End location selected:', location);
    setEndLocation(location);
    
    // Add to searched locations for map markers
    if (location.latitude && location.longitude) {
      setSearchedLocations(prev => {
        const exists = prev.some(loc => 
          loc.latitude === location.latitude && loc.longitude === location.longitude
        );
        if (!exists) {
          const newLocations = [...prev, location];
          console.log('Updated searched locations:', newLocations);
          // Fit map to show all locations after state update
          setTimeout(() => fitMapToLocations(), 100);
          return newLocations;
        }
        return prev;
      });
    }
  };

  const handleAddWaypoint = () => {
    setWaypoints([...waypoints, { locationName: '', latitude: null, longitude: null, note: '' }]);
  };

  const handleWaypointSelect = (index: number, location: LocationItem) => {
    console.log('Waypoint selected:', location);
    const updatedWaypoints = [...waypoints];
    updatedWaypoints[index] = location;
    setWaypoints(updatedWaypoints);
    
    // Add to searched locations for map markers
    if (location.latitude && location.longitude) {
      setSearchedLocations(prev => {
        const exists = prev.some(loc => 
          loc.latitude === location.latitude && loc.longitude === location.longitude
        );
        if (!exists) {
          const newLocations = [...prev, location];
          console.log('Updated searched locations:', newLocations);
          // Fit map to show all locations after state update
          setTimeout(() => fitMapToLocations(), 100);
          return newLocations;
        }
        return prev;
      });
    }
  };

  const handleRemoveWaypoint = (index: number) => {
    const updatedWaypoints = waypoints.filter((_, i) => i !== index);
    setWaypoints(updatedWaypoints);
  };

  const handleModeToggle = (value: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedMode(value);
    } else {
      setSelectedMode(null);
    }
  };

  const handleGenerateRoute = async () => {
    if (!selectedMode || !endLocation || !session?.user?.id || !latitude || !longitude) {
      console.log('Missing required data for route generation');
      return;
    }

    setIsGenerating(true);
    try {
      // Build location array: start -> waypoints -> end
      const locationArray = [
        { latitude: latitude as number, longitude: longitude as number }, // Starting location
        ...waypoints.filter(wp => wp.latitude && wp.longitude).map(wp => ({
          latitude: wp.latitude!,
          longitude: wp.longitude!
        })), // Waypoints
        { latitude: endLocation.latitude!, longitude: endLocation.longitude! } // End location
      ];

      const route = await getRoutes({
        location: locationArray,
        mode: selectedMode
      });

      if (route) {
        setRouteData(route);
        console.log('Route generated:', route);
        
        // Extract coordinates for polyline from route geometry
        if (route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 0) {
          console.log('Route geometry found:', route.geometry);
          const coordinates = route.geometry.coordinates.map((coord: any) => ({
            latitude: coord[1],
            longitude: coord[0]
          }));
          console.log('Extracted coordinates:', coordinates.length, 'points');
          console.log('First few coordinates:', coordinates.slice(0, 3));
          setRouteCoordinates(coordinates);
          
          // Start animation without refitting map
          animatePolyline(coordinates);
        } else {
          console.log('No geometry coordinates found, trying to extract from segments/steps');
          // Fallback: create simple line between waypoints
          const fallbackCoordinates = [
            { latitude: latitude as number, longitude: longitude as number },
            ...waypoints.filter(wp => wp.latitude && wp.longitude).map(wp => ({
              latitude: wp.latitude!,
              longitude: wp.longitude!
            })),
            { latitude: endLocation.latitude!, longitude: endLocation.longitude! }
          ];
          console.log('Using fallback coordinates:', fallbackCoordinates.length, 'points');
          setRouteCoordinates(fallbackCoordinates);
          animatePolyline(fallbackCoordinates);
        }
      } else {
        console.log('Failed to generate route');
      }
    } catch (error) {
      console.error('Error generating route:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelRoute = async () => {
    Alert.alert(
      "Cancel Route",
      "Are you sure you want to cancel the route?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Cancel Route", 
          style: "destructive",
          onPress: async () => {
            router.back();
          }
        }
      ]
    );
  };

  const handleStartRoute = async () => {
    if (!routeData || !selectedMode || !endLocation || !session?.user?.id || !latitude || !longitude) {
      console.log('Missing required data for starting route');
      return;
    }

    try {
      // Build location array with names for ActiveRoute
      const locationArray = [
        { 
          latitude: latitude as number, 
          longitude: longitude as number, 
          locationName: `${suburb}, ${city}` 
        }, // Starting location
        ...waypoints.filter(wp => wp.latitude && wp.longitude).map(wp => ({
          latitude: wp.latitude!,
          longitude: wp.longitude!,
          locationName: wp.locationName
        })), // Waypoints
        { 
          latitude: endLocation.latitude!, 
          longitude: endLocation.longitude!,
          locationName: endLocation.locationName 
        } // End location
      ];

      const activeRoute = {
        routeID: `route_${Date.now()}`, // Generate unique ID
        userID: session.user.id,
        location: locationArray,
        mode: selectedMode,
        status: 'active',
        createdOn: new Date(),
        routeData: routeData
      };

      // Save to SessionContext
      await updateSession({ activeRoute });
      console.log('Route saved to session:', activeRoute);

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
    } catch (error) {
      console.error('Error starting route:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TaraMap
        ref={mapRef}
        showMarker={true}
        mapStyle={{ flex: 1, zIndex: 1 }}
        initialRegion={{
          latitude: latitude || 14.5995, // User location or Manila coords
          longitude: longitude || 120.9842,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        {/* User Location Marker */}
        {latitude && longitude && (
          <TaraMarker
            key="user-location"
            coordinate={{
              latitude: latitude,
              longitude: longitude
            }}
            title={`${suburb}, ${city}`}
            color="#4CAF50"
            label="S"
          />
        )}

        {/* Searched Location Markers - Using TaraMarker */}
        {searchedLocations.map((location, index) => {
          if (!location.latitude || !location.longitude) {
            console.log(`Skipping TaraMarker ${index}: missing coordinates`);
            return null;
          }
          console.log(`Rendering TaraMarker ${index + 1} at:`, location.latitude, location.longitude, 'with color:', '#FF6B6B');
          console.log(`TaraMarker coordinate validation:`, {
            lat: typeof location.latitude,
            lng: typeof location.longitude,
            latValue: location.latitude,
            lngValue: location.longitude
          });
          return (
            <TaraMarker
              key={`searched-${index}-${location.latitude}-${location.longitude}`}
              coordinate={{
                latitude: Number(location.latitude),
                longitude: Number(location.longitude)
              }}
              title={location.locationName}
              color="#FF6B6B"
              label={(index + 1).toString()}
            />
          );
        })}
        
        
        {/* Animated Route Polyline */}
        {animatedCoordinates.length > 1 && (
          <Polyline
            coordinates={animatedCoordinates}
            strokeColor={secondaryColor}
            strokeWidth={6}
          />
        )}
      </TaraMap>

      <LinearGradient
        colors={['#000', 'transparent']}
        style={styles.header}
      >
        {routeData? (
          <View style={styles.routeDataContainer}>
            <ThemedText type="title" style={{color: '#fff'}}>
              {(routeData.distance / 1000).toFixed(2)} km • {Math.round(routeData.duration / 60)} min
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={{color: '#fff', flexWrap: 'wrap'}}>
              {suburb}, {city}{waypoints.length > 0 && waypoints.map(wp => wp.locationName ? ` → ${wp.locationName}` : '').join('')} → {endLocation?.locationName}
            </ThemedText>
          </View>
        ):(<>
          <ThemedView color='primary' shadow style={styles.routeFormContainer}>
            <View style={styles.routeFormHeader}>
              <View style={{flexDirection: 'row', alignItems: 'center', marginLeft: 5}}>
                <BackButton/>
                <ThemedText type="subtitle">Create Route</ThemedText>
              </View>

              <TouchableOpacity style={[styles.addWaypointButton, {backgroundColor: backgroundColor}]} onPress={handleAddWaypoint}>
                <ThemedText>Add Waypoint</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={{padding: 12}}>
              <LocationDisplay
                content={[
                  // Start Location
                  <View key="start">
                    <ThemedText type="defaultSemiBold">Your Location</ThemedText>
                  </View>,
                  
                  // Waypoints
                  ...waypoints.map((waypoint, index) => (
                    <View key={`waypoint-${index}`}>
                      <TouchableOpacity 
                        onPress={() => handleRemoveWaypoint(index)}
                        style={styles.removeButton}
                      >
                        <ThemedIcons library="MaterialIcons" name="close" size={25} color="#ff4444" />
                      </TouchableOpacity>
                      <LocationAutocomplete
                        value={waypoint.locationName}
                        onSelect={(location) => handleWaypointSelect(index, location)}
                        placeholder={`Enter waypoint ${index + 1}`}
                      />
                    </View>
                  )),
                  
                  // End Location
                  <View key="end">
                    <LocationAutocomplete
                      value={endLocation?.locationName || ''}
                      onSelect={handleEndLocationSelect}
                      placeholder="Enter destination"
                    />
                  </View>
                ]}
              />

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.modeRowContent}
            >
                {MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode.value}
                    onPress={() => handleModeToggle(mode.value, true)}
                  >
                    <ThemedView
                    style={[
                      styles.modeButton,
                      selectedMode === mode.value && {backgroundColor: secondaryColor},
                    ]}>
                      <ThemedIcons library="MaterialIcons" name={mode.icon} size={15}/>
                      <ThemedText>
                        {mode.label}
                      </ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
          </ThemedView>
        </>)}
      </LinearGradient>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,.5)']}
        style={styles.buttonsContainer}
      >
        {routeData ? (<>
          <TouchableOpacity style={styles.sideButton} onPress={() => setRouteData(null)}>
            <ThemedIcons library="MaterialIcons" name="arrow-back" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.startButton} onPress={handleStartRoute}>
            <ThemedIcons library="MaterialIcons" name="play-arrow" size={35} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideButton} onPress={handleCancelRoute}>
            <ThemedIcons library="MaterialIcons" name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </>
      ):(
        <View style={styles.generateButtonContainer}>
          <Button
            title={isGenerating ? "Generating..." : "Generate Route"}
            onPress={handleGenerateRoute}
            type="primary"
            disabled={isGenerating || !selectedMode || !endLocation}
          />
        </View>
      )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    pointerEvents: 'box-none',
    padding: 16,
    paddingBottom: 50
  },
  routeDataContainer: {
    marginTop: 20,
    gap: 5,
  },
  routeFormContainer: {
    borderRadius: 10,
    position: 'absolute',
    top: 16,
    left: 10,
    right: 10,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  routeFormHeader:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderColor: '#ccc8',
    borderBottomWidth: 1,
    marginBottom: 10,
    paddingVertical: 7,
  },
  addWaypointButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ccc8',
    borderWidth: 1
  },
  removeButton: {
    position: 'absolute',
    right: 40,
    top: 11,
    zIndex: 20,
  },
  modeRowContent: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    minWidth: 80,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 15,
    paddingBottom: 40,
  },
  startButton:{
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideButton:{
    backgroundColor: 'rgba(0,0,0,.5)',
    padding: 10,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateButtonContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: -20,
  },
});