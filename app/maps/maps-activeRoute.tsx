import RouteMap from '@/components/maps/RouteMap';
import { StyleSheet,  View, TouchableOpacity, Alert, Dimensions, Modal, ScrollView } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { useTracking } from '@/context/TrackingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useRouter } from 'expo-router';
import {useDistanceTracker} from '@/hooks/useDistanceTracker';
import { useRouteTimer } from "@/hooks/useTimer";
import * as Speech from 'expo-speech';
import { useState, useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import haversineDistance from '@/utils/haversineDistance';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMapType } from '@/hooks/useMapType';
import { MAP_TYPES } from 'react-native-maps';
import * as Location from 'expo-location';
import RoundedButton from '@/components/RoundedButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OptionsPopup from '@/components/OptionsPopup';
import EndRouteModal from '@/components/modals/EndRouteModal';
import Switch from '@/components/Switch';
import { Image } from 'react-native';
import RouteSettingsModal from '@/app/routes/routes-settings';

export default function ActiveRouteMap() {
  const { session, updateSession } = useSession();
  const { stopTracking } = useTracking();
  const router = useRouter();
  const distance = useDistanceTracker();
  const elapsed = useRouteTimer(session?.activeRoute !== undefined);
  const { latitude, longitude } = useLocation();
  const { mapType, setMapType } = useMapType();
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [route3dEnabled, setRoute3dEnabled] = useState(true);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [nextStop, setNextStop] = useState<string>('');
  const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [lastSpokenInstruction, setLastSpokenInstruction] = useState<string>('');
  const [lastSpokenStop, setLastSpokenStop] = useState<string>('');
  const [isNearStop, setIsNearStop] = useState<boolean>(false);
  const [currentNearbyStop, setCurrentNearbyStop] = useState<string>('');
  
  // 3D View and Orientation states
  const [deviceOrientation, setDeviceOrientation] = useState(0);
  const [is3DView, setIs3DView] = useState(true);
  const [cameraHeading, setCameraHeading] = useState(0);
  const [cameraPitch, setCameraPitch] = useState(0);
  const [targetHeading, setTargetHeading] = useState(0);
  const [smoothHeading, setSmoothHeading] = useState(0);
  const [targetPitch, setTargetPitch] = useState(0);
  const [smoothPitch, setSmoothPitch] = useState(0);
  
  // Direction arrow states
  const [nextRouteDirection, setNextRouteDirection] = useState(0);
  const [showDirectionArrow, setShowDirectionArrow] = useState(false);
  const secondaryColor = useThemeColor({}, 'secondary');
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');

  // Default map states (always rendered to maintain hook consistency)
  const [showEndRouteModal, setShowEndRouteModal] = useState(false);
  const [completedRouteStops, setCompletedRouteStops] = useState<{ latitude: number; longitude: number; locationName: string }[]>([]);
  const [completedDistance, setCompletedDistance] = useState(0);
  const [completedTime, setCompletedTime] = useState(0);
  const [alarmNearStop, setAlarmNearStop] = useState<boolean>(false);
  const [showRouteSettingsModal, setShowRouteSettingsModal] = useState(false);

  // Load alarm setting from AsyncStorage
  useEffect(() => {
    const loadAlarmSetting = async () => {
      try {
        const saved = await AsyncStorage.getItem('alarmNearStop');
        if (saved !== null) {
          setAlarmNearStop(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading alarm setting:', error);
      }
    };
    loadAlarmSetting();
  }, []);

  // Save alarm setting to AsyncStorage
  const handleAlarmToggle = async (value: boolean) => {
    try {
      setAlarmNearStop(value);
      await AsyncStorage.setItem('alarmNearStop', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving alarm setting:', error);
    }
  };

  // Handle map type selection
  const handleMapTypeSelect = async (mapType: string) => {
    try {
      await setMapType(mapType as any);
    } catch (error) {
      console.error('Error saving map type:', error);
      Alert.alert('Error', 'Failed to save map type preference');
    }
  };

  // Get map type display name
  const getMapTypeDisplayName = (mapType: string) => {
    switch (mapType) {
      case MAP_TYPES.STANDARD:
        return 'Standard';
      case MAP_TYPES.TERRAIN:
        return 'Terrain';
      case MAP_TYPES.SATELLITE:
        return 'Satellite';
      case MAP_TYPES.HYBRID:
        return 'Hybrid';
      default:
        return 'Standard';
    }
  };

  // Calculate bearing between two points
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Reset navigation state when route changes
  useEffect(() => {
    if (session?.activeRoute) {
      setCurrentStepIndex(0);
      setCurrentSegmentIndex(0);
    } else {
      // Reset all navigation states when no active route
      setCurrentStepIndex(0);
      setCurrentSegmentIndex(0);
      setCurrentInstruction('');
      setNextStop('');
      setDistanceToNextStep(0);
      setLastSpokenInstruction('');
      setLastSpokenStop('');
      setIsNearStop(false);
      setCurrentNearbyStop('');
      setShowDirectionArrow(false);
      setNextRouteDirection(0);
    }
  }, [session?.activeRoute?.routeID]);

  // Device orientation listener for both normal and 3D view
  useEffect(() => {
    let orientationSubscription: any;

    const startOrientationTracking = async () => {
      try {
        // Request permission for location (needed for orientation)
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission not granted');
          return;
        }

        // Start watching device orientation
        orientationSubscription = Location.watchHeadingAsync((heading) => {
          setDeviceOrientation(heading.magHeading);
          setTargetHeading(heading.magHeading);
        });
      } catch (error) {
        console.error('Error starting orientation tracking:', error);
      }
    };

    startOrientationTracking();

    return () => {
      if (orientationSubscription && typeof orientationSubscription.remove === 'function') {
        orientationSubscription.remove();
      }
    };
  }, []); // Always track orientation

  // Smooth rotation interpolation for 3D view only
  useEffect(() => {
    if (!is3DView) return;

    const smoothRotation = () => {
      const diff = targetHeading - smoothHeading;
      const absDiff = Math.abs(diff);
      
      // Handle 360-degree wraparound
      let normalizedDiff = diff;
      if (absDiff > 180) {
        normalizedDiff = diff > 0 ? diff - 360 : diff + 360;
      }
      
      // Smooth rotation for 3D view
      const lerpFactor = 0.15;
      const newSmoothHeading = smoothHeading + (normalizedDiff * lerpFactor);
      
      // Normalize to 0-360 range
      const normalizedHeading = ((newSmoothHeading % 360) + 360) % 360;
      
      setSmoothHeading(normalizedHeading);
      setCameraHeading(normalizedHeading);
    };

    const interval = setInterval(smoothRotation, 16); // ~60fps
    return () => clearInterval(interval);
  }, [targetHeading, smoothHeading, is3DView]);

  // Reset camera states when disabling 3D view
  useEffect(() => {
    if (!is3DView) {
      setCameraPitch(0);
      setCameraHeading(0);
      setSmoothHeading(0);
      setTargetHeading(0);
      setTargetPitch(0);
      setSmoothPitch(0);
    }
  }, [is3DView]);
  

  // Navigation logic to find current instruction and next stop
  useEffect(() => {
    if (!session?.activeRoute?.routeData || !latitude || !longitude) {
      // Reset navigation states when no active route or location
      setCurrentInstruction('');
      setNextStop('');
      setDistanceToNextStep(0);
      setShowDirectionArrow(false);
      return;
    }

    const routeData = session.activeRoute.routeData;
    const locations = session.activeRoute.location;
    
    // Check proximity to stops (100m for completion detection)
    let nearestStopDistance = Infinity;
    let nearestStopIndex = -1;
    
    locations.forEach((location, index) => {
      const distanceToStop = haversineDistance(
        latitude,
        longitude,
        location.latitude,
        location.longitude
      );
      
      if (distanceToStop < nearestStopDistance) {
        nearestStopDistance = distanceToStop;
        nearestStopIndex = index;
      }
    });

    // Handle stop proximity (100m detection)
    const wasNearStop = isNearStop;
    const previousNearbyStop = currentNearbyStop;
    
    if (nearestStopDistance < 100 && nearestStopIndex >= 0) {
      const stopName = locations[nearestStopIndex].locationName;
      
      if (!wasNearStop || previousNearbyStop !== stopName) {
        // Entering stop proximity
        setIsNearStop(true);
        setCurrentNearbyStop(stopName);
        
        // Mark stop as completed if it's the next expected stop
        if (nearestStopIndex >= currentSegmentIndex) {
          setCurrentSegmentIndex(nearestStopIndex);
          setCurrentStepIndex(0);
        }
        
        // Update next stop display and speech
        const nextStopName = nearestStopIndex < locations.length - 1 
          ? locations[nearestStopIndex + 1].locationName 
          : 'Destination';
        
        setNextStop(`You've reached ${stopName}. Next stop: ${nextStopName}`);
        
        if (speechEnabled) {
          Speech.speak(`You've reached ${stopName}. Next stop: ${nextStopName}`);
          setLastSpokenStop(`You've reached ${stopName}. Next stop: ${nextStopName}`);
        }
      }
    } else {
      // Outside stop proximity
      if (wasNearStop) {
        setIsNearStop(false);
        setCurrentNearbyStop('');
        
        // Update to regular next stop display
        const nextStopName = currentSegmentIndex < locations.length - 1 
          ? locations[currentSegmentIndex + 1].locationName 
          : 'Destination';
        
        setNextStop(`Next stop: ${nextStopName}`);
        
        if (speechEnabled && `Next stop: ${nextStopName}` !== lastSpokenStop) {
          Speech.speak(`Next stop: ${nextStopName}`);
          setLastSpokenStop(`Next stop: ${nextStopName}`);
        }
      } else {
        // Regular next stop when not near any stop
        const nextStopName = currentSegmentIndex < locations.length - 1 
          ? locations[currentSegmentIndex + 1].locationName 
          : 'Destination';
        
        const nextStopMessage = `Next stop: ${nextStopName}`;
        if (nextStop !== nextStopMessage) {
          setNextStop(nextStopMessage);
          
          if (speechEnabled && nextStopMessage !== lastSpokenStop) {
            Speech.speak(nextStopMessage);
            setLastSpokenStop(nextStopMessage);
          }
        }
      }
    }

    // Get all steps from all segments for instruction tracking
    let allSteps: any[] = [];
    let stepSegmentMap: number[] = [];
    let stepIndexMap: number[] = [];
    
    routeData.segments.forEach((segment, segIndex) => {
      segment.steps?.forEach((step, stepIndex) => {
        allSteps.push(step);
        stepSegmentMap.push(segIndex);
        stepIndexMap.push(stepIndex);
      });
    });

    // Find next upcoming step based on current progress
    let targetStepIndex = -1;
    let minStepDistance = Infinity;
    
    for (let i = 0; i < allSteps.length; i++) {
      const step = allSteps[i];
      const segIndex = stepSegmentMap[i];
      const stepIndex = stepIndexMap[i];
      
      // Only consider steps from current segment onwards
      if (segIndex < currentSegmentIndex) continue;
      if (segIndex === currentSegmentIndex && stepIndex < currentStepIndex) continue;
      
      if (step.way_points && routeData.geometry.coordinates[step.way_points[0]]) {
        const [lon, lat] = routeData.geometry.coordinates[step.way_points[0]];
        const distance = haversineDistance(latitude, longitude, lat, lon);
        
        if (distance < minStepDistance) {
          minStepDistance = distance;
          targetStepIndex = i;
        }
      }
    }

    // Update current instruction and advance step if completed
    if (targetStepIndex >= 0) {
      const currentStep = allSteps[targetStepIndex];
      const newInstruction = currentStep.instruction;
      
      setCurrentInstruction(newInstruction);
      setDistanceToNextStep(minStepDistance);
      
      // Calculate direction to next step for arrow
      if (currentStep.way_points && routeData.geometry.coordinates[currentStep.way_points[0]]) {
        const [lon, lat] = routeData.geometry.coordinates[currentStep.way_points[0]];
        const bearing = calculateBearing(latitude, longitude, lat, lon);
        setNextRouteDirection(bearing);
        setShowDirectionArrow(true);
      }
      
      // Check if current step is completed (within 30m)
      if (minStepDistance < 30) {
        const segIndex = stepSegmentMap[targetStepIndex];
        const stepIndex = stepIndexMap[targetStepIndex];
        
        // Advance to next step
        const nextStepInSegment = stepIndex + 1;
        const segmentStepCount = routeData.segments[segIndex]?.steps?.length || 0;
        
        if (nextStepInSegment < segmentStepCount) {
          setCurrentStepIndex(nextStepInSegment);
        } else if (segIndex < routeData.segments.length - 1) {
          setCurrentSegmentIndex(segIndex + 1);
          setCurrentStepIndex(0);
        }
      }
      
      // Speak instruction if it changed and speech is enabled
      if (speechEnabled && newInstruction !== lastSpokenInstruction && newInstruction) {
        Speech.speak(newInstruction);
        setLastSpokenInstruction(newInstruction);
      }
    } else {
      setShowDirectionArrow(false);
    }

    console.log('Navigation Debug:', {
      currentSegmentIndex,
      currentStepIndex,
      instruction: allSteps[targetStepIndex]?.instruction,
      distanceToStep: minStepDistance,
      nearestStopDistance,
      isNearStop,
      totalSteps: allSteps.length
    });

  }, [latitude, longitude, session?.activeRoute, speechEnabled, currentStepIndex, currentSegmentIndex, isNearStop, currentNearbyStop, nextStop, lastSpokenStop, lastSpokenInstruction]);

  const toggleSpeech = () => {
    setSpeechEnabled(!speechEnabled);
    if (!speechEnabled) {
      Speech.speak("Voice navigation enabled");
      // Immediately read current instruction and next stop when enabling
      if (currentInstruction) {
        setTimeout(() => Speech.speak(currentInstruction), 1500);
      }
      if (nextStop) {
        setTimeout(() => Speech.speak(`Next stop: ${nextStop}`), 3000);
      }
    } else {
      Speech.speak("Voice navigation disabled");
    }
  };

  const toggle3DView = () => {
    const new3DState = !is3DView;
    setIs3DView(new3DState);
    setRoute3dEnabled(new3DState);
    
    if (new3DState) {
      Speech.speak("3D view enabled");
    } else {
      Speech.speak("3D view disabled");
      // Reset camera states when disabling 3D
      setCameraHeading(0);
      setDeviceOrientation(0);
      setSmoothHeading(0);
      setTargetHeading(0);
    }
  };

  const handleEndRoute = async () => {
    Alert.alert(
      "End Route",
      "Are you sure you want to end the current route?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Route", 
          style: "destructive",
          onPress: async () => {
            try {
              // Capture route data before clearing active route
              if (session?.activeRoute?.location) {
                setCompletedRouteStops(session.activeRoute.location);
              }
              
              // Capture current distance and time
              setCompletedDistance(distance);
              setCompletedTime(elapsed);
              
              // Show end route modal
              setShowEndRouteModal(true);
              
              // Reset all states first
              setCurrentInstruction('');
              setNextStop('');
              setDistanceToNextStep(0);
              setCurrentStepIndex(0);
              setCurrentSegmentIndex(0);
              setLastSpokenInstruction('');
              setLastSpokenStop('');
              setIsNearStop(false);
              setCurrentNearbyStop('');
              setShowDirectionArrow(false);
              setNextRouteDirection(0);
              
              // Stop tracking and clean up
              await stopTracking();
              await AsyncStorage.removeItem('trackingData');
              
              // Update session after state reset
              await updateSession({ activeRoute: undefined });
              console.log('Route ended successfully');
            } catch (error) {
              console.error('Error ending route:', error);
            }
          }
        }
      ]
    );
  };

  // Clean up tracking data when component unmounts
  useEffect(() => {
    return () => {
      if (!session?.activeRoute) {
        // If there's no active route when unmounting, clean up tracking data
        AsyncStorage.removeItem('trackingData').catch(console.error);
      }
    };
  }, [session?.activeRoute]);

  const renderActiveRoute = () => (
    <View style={styles.contentContainer}>
      {/* Route Map */}
      <RouteMap 
        style={styles.mapContainer}
        mapType={mapType}
        showUserLocation={true}
        showRouteMarkers={true}
        is3DView={is3DView}
        cameraHeading={cameraHeading}
        cameraPitch={cameraPitch}
        focusOnUserLocation={!is3DView}
      />
      

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#000', 'transparent']}
          style={styles.headerGradient}
        />
        <TouchableOpacity 
          style={styles.infoButton} 
          onPress={() => router.push('/routes/routes')}
        >
          <ThemedIcons 
            library='MaterialIcons' 
            name="info"
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
        <ThemedText type="title" style={{color: '#fff'}}>
          {(distance / 1000).toFixed(2)} km • {Math.floor(elapsed / 60)}m {elapsed % 60}s
        </ThemedText>
        <ThemedText type="subtitle" style={{color: '#fff'}}>
          {currentInstruction || 'Continue straight'}
        </ThemedText>
        <ThemedText style={{color: '#fff', marginTop: 5}}>
          Next Stop: {nextStop || 'Destination'}
        </ThemedText>
      </View>
      <View style={styles.buttonContainer}>
        <LinearGradient
          colors={['transparent','transparent', primaryColor]}
          style={styles.bottomGradient}
        />
        
        {/* Direction Arrow above stop button */}
        {showDirectionArrow && (
          <View style={styles.directionArrowContainer}>
            <View style={[
              styles.directionArrow,
              {
                transform: [
                  { rotate: `${nextRouteDirection - (is3DView ? smoothHeading : 0)}deg` }
                ]
              }
            ]}>
              <ThemedIcons 
                library="MaterialIcons" 
                name="navigation" 
                size={50} 
                color={accentColor} 
              />
            </View>
          </View>
        )}
        
        <OptionsPopup
        style={styles.sideButton}
          options={[
          <TouchableOpacity 
            key="standard" 
            style={styles.mapTypeOption}
            onPress={() => handleMapTypeSelect(MAP_TYPES.STANDARD)}
          >
            <Image source={require('@/assets/images/map-standard.png')} style={styles.mapTypeImage} />
            <ThemedText>Standard</ThemedText>
            {mapType === MAP_TYPES.STANDARD && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
          <TouchableOpacity 
            key="terrain" 
            style={styles.mapTypeOption}
            onPress={() => handleMapTypeSelect(MAP_TYPES.TERRAIN)}
          >
            <Image source={require('@/assets/images/map-terrain.png')} style={styles.mapTypeImage} />
            <ThemedText>Terrain</ThemedText>
            {mapType === MAP_TYPES.TERRAIN && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
          <TouchableOpacity 
            key="satellite" 
            style={styles.mapTypeOption}
            onPress={() => handleMapTypeSelect(MAP_TYPES.SATELLITE)}
          >
            <Image source={require('@/assets/images/map-satellite.png')} style={styles.mapTypeImage} />
            <ThemedText>Satellite</ThemedText>
            {mapType === MAP_TYPES.SATELLITE && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
          <TouchableOpacity 
            key="hybrid" 
            style={styles.mapTypeOption}
            onPress={() => handleMapTypeSelect(MAP_TYPES.HYBRID)}
          >
            <Image source={require('@/assets/images/map-hybrid.png')} style={styles.mapTypeImage} />
            <ThemedText>Hybrid</ThemedText>
            {mapType === MAP_TYPES.HYBRID && (
              <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
            )}
          </TouchableOpacity>,
        ]}
        >
          <ThemedIcons 
            library='MaterialIcons' 
            name="map"
            size={20} 
            color="white" 
          />
        </OptionsPopup>
        
        <TouchableOpacity 
          style={[styles.sideButton, route3dEnabled && {backgroundColor: secondaryColor}]} 
          onPress={toggle3DView}
        >
          <ThemedIcons 
            library='MaterialDesignIcons' 
            name={route3dEnabled ? "video-3d" : "video-3d-off"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.stopButton} onPress={handleEndRoute}>
          <ThemedIcons library='MaterialIcons' name="stop" size={30} color="white" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sideButton, speechEnabled && {backgroundColor: secondaryColor}]} 
          onPress={toggleSpeech}
        >
          <ThemedIcons 
            library='MaterialIcons' 
            name={speechEnabled ? "volume-up" : "volume-off"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sideButton, alarmNearStop && {backgroundColor: secondaryColor}]} 
          onPress={() => handleAlarmToggle(!alarmNearStop)}
        >
          <ThemedIcons 
            library='MaterialIcons' 
            name={alarmNearStop ? "notifications-active" : "notifications-off"} 
            size={20} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </View>
  )


  return (
    <View style={{flex: 1}}>
      {renderActiveRoute()}
      <EndRouteModal
        visible={showEndRouteModal}
        onClose={() => setShowEndRouteModal(false)}
        distance={completedDistance}
        timeElapsed={completedTime}
        routeStops={completedRouteStops}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentContainer:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000
  },
  mapContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  headerContainer:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    pointerEvents: 'box-none',
    padding: 20,
    paddingTop: 40
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: .9,
    pointerEvents: 'none',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    pointerEvents: 'none',
  },
  stopButton:{
    width: 60,
    height: 60,
    marginBottom: 30,
    borderRadius: 50,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    zIndex: 1001,
    gap: 15
  },
  sideButton:{
    width: 40,
    height: 40,
    marginBottom: 30,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionArrowContainer: {
    position: 'absolute',
    bottom: 120, // Position above the stop button (70px button + 30px margin + 20px gap)
    left: '50%',
    marginLeft: -25, // Half of arrow width (50px)
    zIndex: 1002,
    pointerEvents: 'none',
  },
  directionArrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  mapTypeImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  infoButton:{
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 35,
    right: 20,
    zIndex: 1000
  },
});