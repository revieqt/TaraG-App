import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTracking } from '@/context/TrackingContext';
import { useDistanceTracker } from '@/hooks/useDistanceTracker';
import { useSession } from '@/context/SessionContext';
import { ThemedText } from '../ThemedText';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import ThemedIcons from '../ThemedIcons';

const ActiveRouteButton: React.FC = () => {
  const { isTracking } = useTracking();
  const distance = useDistanceTracker();
  const { session } = useSession();
  const borderAnim = useRef(new Animated.Value(0)).current;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format distance as km with 2 decimal places (same as maps.tsx)
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };

  // Get icon based on route mode
  const getRouteIcon = (mode: string) => {
    switch (mode) {
      case 'driving-car':
        return 'directions-car';
      case 'cycling-regular':
        return 'directions-bike';
      case 'foot-walking':
        return 'directions-walk';
      case 'foot-hiking':
        return 'hiking';
      default:
        return 'route';
    }
  };

  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1000, // fade in
          useNativeDriver: false, // must be false for borderColor
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1000, // fade out
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loopAnimation.start();
    return () => loopAnimation.stop();
  }, [borderAnim]);

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#00FFDE'],
  });

  return (
    <>
      {isTracking && (
        <View style={styles.container}>
          <TouchableOpacity
            style={styles.wrapper}
            onPress={() => router.push('/(tabs)/maps')}
          >
            <Animated.View
              style={[
                styles.button,
                {
                  borderColor: animatedBorderColor,
                  backgroundColor: 'rgba(0, 202, 255, .8)',
                },
              ]}
            >
              <ThemedIcons 
                library='MaterialIcons' 
                name={getRouteIcon(session?.activeRoute?.mode || 'route')} 
                size={18} 
                color="white" 
              />
              <ThemedText style={{color: '#fff', fontSize: 9}}>
                {formatDistance(distance)} km
              </ThemedText>
            </Animated.View>
          </TouchableOpacity>
        </View>
      )}
      
    </>
    
  );
};

export default ActiveRouteButton;


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 55,
    height: 55,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 4,
  },
});
