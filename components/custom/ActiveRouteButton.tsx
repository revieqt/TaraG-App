import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useTracking } from '@/context/TrackingContext';
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
  const { distance, isTracking } = useTracking();
  const borderAnim = useRef(new Animated.Value(0)).current;
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Format distance as km with 2 decimal places
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
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
              <ThemedIcons library='MaterialIcons' name="route" size={25} color="white" />
              <ThemedText style={{color: '#fff', fontSize: 12}}>
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
    width: 70,
    height: 70,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 4,
  },
});
