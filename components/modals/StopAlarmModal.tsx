import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Dimensions, Vibration, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Button from '@/components/Button';

interface StopAlarmModalProps {
  visible: boolean;
  onDismiss: () => void;
  stopName: string;
  distance: number;
  routeMode: string;
}

const { height } = Dimensions.get('window');

export default function StopAlarmModal({ 
  visible, 
  onDismiss, 
  stopName, 
  distance,
  routeMode 
}: StopAlarmModalProps) {
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const secondaryColor = useThemeColor({}, 'secondary');
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Start animations when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Scale animation - gentle breathing effect
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Pulse animation - opacity effect
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      // Subtle rotation animation
      const rotateAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: -1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );

      scaleAnimation.start();
      pulseAnimation.start();
      rotateAnimation.start();

      return () => {
        scaleAnimation.stop();
        pulseAnimation.stop();
        rotateAnimation.stop();
      };
    } else {
      // Reset animations when modal is hidden
      scaleAnim.setValue(1);
      pulseAnim.setValue(0.8);
      rotateAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Vibration.vibrate([500, 300], true);
    } else {
      Vibration.cancel();
    }
    return () => {
      Vibration.cancel();
    };
  }, [visible]);

  const handleGoToMaps = () => {
    onDismiss(); // Close modal first
    router.push('/(tabs)/maps');
  };


  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      
      <ThemedView color='secondary' style={{flex: 1}}>
        <ThemedView style={[styles.circle, {marginTop: height * .25}]}>
          <ThemedView style={styles.circle}>
            <ThemedView style={styles.circle}>
            </ThemedView>
          </ThemedView>
        </ThemedView>
        <View style={styles.contentContainer}>
          <LinearGradient
            colors={['transparent', backgroundColor]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientOverlay}
            pointerEvents="none"
          >
            <Animated.View
              style={{
                transform: [
                  { 
                    scale: scaleAnim 
                  },
                  { 
                    rotate: rotateAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-10deg', '10deg']
                    })
                  }
                ],
                opacity: pulseAnim,
              }}
            >
              <ThemedIcons 
                library="MaterialIcons" 
                name="notifications-active" 
                size={100} 
                color={secondaryColor} 
              />
            </Animated.View>
          </LinearGradient>
          <ThemedView style={styles.content}>
            <ThemedText>Your next stop is approaching</ThemedText>
            <ThemedText type='subtitle' style={{textAlign: 'center'}}>{stopName}</ThemedText>
            <ThemedText style={{opacity: .5}}>{routeMode.charAt(0).toUpperCase() + routeMode.slice(1)} Route</ThemedText>
          </ThemedView>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Go to Maps"
            onPress={handleGoToMaps}
          />
          <Button
            title="Got it!"
            onPress={onDismiss}
            type="primary"
          />
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonContainer:{
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    gap: 10,
  },
  circle:{
    width: '100%',
    aspectRatio: 1,
    padding: 50,
    borderRadius: 500,
    opacity: .8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content:{
    paddingTop: 40,
    width: '100%',
    padding: 20,
    height: height,
    alignItems: 'center',
    gap: 10
  },
  contentContainer:{
    marginTop: height * .4,
    position: 'absolute',
    width: '100%',
  },
  gradientOverlay: {
    height: 100,
    width: '100%',
    pointerEvents: 'none',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
