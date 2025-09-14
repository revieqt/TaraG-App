import LocationAutocomplete, { LocationItem } from '@/components/LocationAutocomplete';
import TaraMap from '@/components/maps/TaraMap';
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
  const secondaryColor = useThemeColor({}, 'accent');

  const { loading, suburb , city, latitude, longitude } = useLocation();
  const { session, updateSession } = useSession();

  const handleAddWaypoint = () => {
    setWaypoints([...waypoints, { locationName: '', latitude: null, longitude: null, note: '' }]);
  };

  const handleWaypointSelect = (index: number, location: LocationItem) => {
    const updatedWaypoints = [...waypoints];
    updatedWaypoints[index] = location;
    setWaypoints(updatedWaypoints);
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

      // Navigate to maps tab
      router.push('/(tabs)/maps');
    } catch (error) {
      console.error('Error starting route:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* <TaraMap
        showMarker={false}
        mapStyle={{ flex: 1, zIndex: 0 }}
        region={{
          latitude: 14.5995, // Manila coords
          longitude: 120.9842,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      /> */}
      <View style={styles.header}>
        
        <LinearGradient
          colors={['#000', 'transparent']}
          style={styles.headerGradient}
        />
        <View style={styles.headerTitle}>
          <BackButton/>
          <View style={{marginLeft: 10, pointerEvents: 'none',}}>
            {routeData ? (
              <>
                <ThemedText type="title" style={{color: '#fff'}}>
                  {(routeData.distance / 1000).toFixed(2)} km • {Math.round(routeData.duration / 60)} min
                </ThemedText>
                <ThemedText type="defaultSemiBold" style={{color: '#fff', flexWrap: 'wrap'}}>
                  {suburb}, {city}{waypoints.length > 0 && waypoints.map(wp => wp.locationName ? ` → ${wp.locationName}` : '').join('')} → {endLocation?.locationName}
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText type="title" style={{color: '#fff'}}>
                  Hello Traveler
                </ThemedText>
                <ThemedText type="subtitle" style={{color: '#fff'}}>
                  Where are we going today?
                </ThemedText>
              </>
            )}
          </View>
          
        </View>
      </View>
      
      {routeData ? (
        <View style={styles.buttonsContainer}>
          <LinearGradient
            colors={['transparent', '#000']}
            style={styles.headerGradient}
          />
          <RoundedButton
            size={50}
            iconName="arrow-back"
            iconColor="#ccc"
            color="white"
            onPress={() => setRouteData(null)}
            style={{borderRadius: 100}}
          />
          <RoundedButton
            size={70}
            iconName="play-arrow"
            iconSize={35}
            iconColor="#fff"
            onPress={handleStartRoute}
            style={{borderRadius: 100}}
          />
          <RoundedButton
            size={50}
            iconName="close"
            iconColor="#ccc"
            color="white"
            onPress={handleCancelRoute}
            style={{borderRadius: 100}}
          />
        </View>
      ) : (
        <BottomSheet 
          snapPoints={[0.5, 0.83]} 
          defaultIndex={0} 
          style={{zIndex: 100}}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={{marginBottom: 30}}
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

            <LocationDisplay
              content={[
                // Start Location
                <View key="start" style={{marginBottom: 10}}>
                  <ThemedText type="defaultSemiBold">Your Location</ThemedText>
                  {!loading && (
                    <ThemedText style={{opacity: .5}}>{suburb}, {city}</ThemedText>
                  )}
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
                    onSelect={setEndLocation}
                    placeholder="Enter destination"
                  />
                </View>
              ]}
            />

            {/* Add Waypoint Button */}
            <Button
              title="Add Waypoint"
              onPress={handleAddWaypoint}
              type="outline"
            />
            <Button
              title={isGenerating ? "Generating..." : "Generate Route"}
              onPress={handleGenerateRoute}
              type="primary"
              buttonStyle={{marginTop: 10}}
              disabled={isGenerating || !selectedMode || !endLocation}
            />
            </ScrollView>
        </BottomSheet>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    zIndex: 100,
    pointerEvents: 'none',
  },
  headerTitle: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 20,
    color: '#fff',
    pointerEvents: 'none',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: .7,
    pointerEvents: 'none',
  },
  waypointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    paddingHorizontal: 5,
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
  modeButtonText: {
    color: '#333',
    fontSize: 16,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 20,
  },
});