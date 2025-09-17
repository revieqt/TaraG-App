import TaraMap from '@/components/maps/TaraMap';
import { StyleSheet,  View, TouchableOpacity, Alert } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { useTracking } from '@/context/TrackingContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { useRouter } from 'expo-router';
import TextField from '@/components/TextField';
import {useDistanceTracker} from '@/hooks/useDistanceTracker';
import { useRouteTimer } from "@/hooks/useTimer";
import * as Speech from 'expo-speech';
import { useState, useEffect } from 'react';
import { useLocation } from '@/hooks/useLocation';
import haversineDistance from '@/utils/haversineDistance';
import { useThemeColor } from '@/hooks/useThemeColor';
import { renderDefaultMap } from '../maps/default-state';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MapScreen() {
  const { session, updateSession } = useSession();
  const { stopTracking } = useTracking();
  const router = useRouter();
  const distance = useDistanceTracker();
  const elapsed = useRouteTimer(session?.activeRoute !== undefined);
  const { latitude, longitude } = useLocation();
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [route3dEnabled, setRoute3dEnabled] = useState(false);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [nextStop, setNextStop] = useState<string>('');
  const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState<number>(0);
  const [lastSpokenInstruction, setLastSpokenInstruction] = useState<string>('');
  const [lastSpokenStop, setLastSpokenStop] = useState<string>('');
  const [isNearStop, setIsNearStop] = useState<boolean>(false);
  const [currentNearbyStop, setCurrentNearbyStop] = useState<string>('');
  const secondaryColor = useThemeColor({}, 'secondary');
  const primaryColor = useThemeColor({}, 'primary');

  // Reset navigation state when route changes
  useEffect(() => {
    if (session?.activeRoute) {
      setCurrentStepIndex(0);
      setCurrentSegmentIndex(0);
    }
  }, [session?.activeRoute?.routeID]);
  

  // Navigation logic to find current instruction and next stop
  useEffect(() => {
    if (!session?.activeRoute?.routeData || !latitude || !longitude) return;

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
            // Stop tracking and clean up
            await stopTracking();
            await AsyncStorage.removeItem('trackingData');
            await updateSession({ activeRoute: undefined });
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
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#000', 'transparent']}
          style={styles.headerGradient}
        />
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
        <TouchableOpacity 
          style={[styles.sideButton, route3dEnabled && {backgroundColor: secondaryColor}]} 
          onPress={() => []}
        >
          <ThemedIcons 
            library='MaterialDesignIcons' 
            name={route3dEnabled ? "video-3d" : "video-3d-off"} 
            size={25} 
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
            size={25} 
            color="white" 
          />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={{flex: 1}}>
      {/* <TaraMap /> */}
      {session?.activeRoute ? (
        renderActiveRoute()
      ):(
        renderDefaultMap()
      )}
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
  headerContainer:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1001,
    pointerEvents: 'none',
    padding: 20,
    paddingTop: 40
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
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    pointerEvents: 'none',
  },
  stopButton:{
    width: 70,
    height: 70,
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
    gap: 15
  },
  sideButton:{
    width: 50,
    height: 50,
    marginBottom: 30,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaContainer:{
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  etaChild:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5
  },
  searchContent:{
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1002
  },
  detailsButton:{
    paddingVertical: 8,
    paddingHorizontal: 15,
    width: 120,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 7,
    zIndex: 10000000
  },
});