import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Animated } from 'react-native';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
interface AlertsContainerProps {
  children?: React.ReactNode;
}

const AlertsContainer: React.FC<AlertsContainerProps> = ({
  children,
}) => {
  const [hideAlert, setHideAlert] = useState(false);
  
  // Animation values
  const containerOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(0.8)).current;
  const contentSlide = useRef(new Animated.Value(-50)).current;
  const openContainerOpacity = useRef(new Animated.Value(0)).current;
  const openContainerScale = useRef(new Animated.Value(0.5)).current;
  const hideButtonScale = useRef(new Animated.Value(0)).current;
  const hideButtonOpacity = useRef(new Animated.Value(0)).current;

  // Handle animations when hideAlert state changes
  useEffect(() => {
    if (hideAlert) {
      // Animate container out and open container in
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(containerScale, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(contentSlide, {
          toValue: -50,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(hideButtonScale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(hideButtonOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(openContainerOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(openContainerScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate open container out and container in
      Animated.sequence([
        // First, hide the open container
        Animated.parallel([
          Animated.timing(openContainerOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(openContainerScale, {
            toValue: 0.5,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Then show the container and grow the hide button from the open container position
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(containerScale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(contentSlide, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          // Hide button grows out from the open container position
          Animated.timing(hideButtonScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(hideButtonOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [hideAlert]);

  // Initial animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(containerScale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(contentSlide, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(hideButtonScale, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(hideButtonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <>
      {/* Open Container (Hidden State) */}
      <Animated.View
        style={[
          styles.openContainer,
          {
            opacity: openContainerOpacity,
            transform: [{ scale: openContainerScale }],
          }
        ]}
        pointerEvents={hideAlert ? 'auto' : 'none'}
      >
        <ThemedView style={styles.openContainerInner} shadow color='secondary'>
          <TouchableOpacity onPress={() => setHideAlert(false)}>
            <ThemedIcons library='MaterialIcons' name="notifications" size={20} color='white'/>
          </TouchableOpacity>
        </ThemedView>
      </Animated.View>

      {/* Main Container (Visible State) */}
      <Animated.View
        style={[
          styles.container,
          {
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          }
        ]}
        pointerEvents={hideAlert ? 'none' : 'auto'}
      >
        
        <Animated.View
          style={{
            transform: [{ translateY: contentSlide }],
          }}
        >
          {children}
        </Animated.View>
        
        <Animated.View
          style={{
            transform: [{ translateY: contentSlide }],
          }}
        >
          <ThemedView style={styles.alertButton} shadow>
            {/* DISPLAY ALERTS HERE WHEN CLICKED */}
            <TouchableOpacity onPress={() => []} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
              <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
            </TouchableOpacity> 
          </ThemedView>
        </Animated.View>

        <Animated.View
          style={{
            transform: [
              { translateY: contentSlide },
              { scale: hideButtonScale }
            ],
            opacity: hideButtonOpacity,
            alignSelf: 'center',
          }}
        >
          <ThemedView style={styles.hideButton} shadow color='primary'>
            <TouchableOpacity onPress={() => setHideAlert(true)} style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5}}>
              <ThemedIcons library='MaterialIcons' name="keyboard-arrow-down" size={25}/>
            </TouchableOpacity>
          </ThemedView>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    pointerEvents: 'box-none',
    position: 'absolute',
    bottom: 10,
    right: 10,
    top: 10,
    zIndex: 1000,
    width: 70,
    alignItems: 'flex-end',
    flexDirection: 'column-reverse',
    gap: 7,
  },
  openContainer:{
    position: 'absolute',
    bottom: 10,
    right: 10,
    zIndex: 1000,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  openContainerInner:{
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  hideButton:{
    width: '100%',
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,.2)',
    opacity: .7,

  },
  alertButton:{
    width: '100%',
    aspectRatio: 1,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#FFB74D',
    borderWidth: 3,
    borderColor: '#fff'
  },
  taraImage:{
    width: 120,
    height: 120,
    marginLeft: 10,
    objectFit: 'contain',
  }
});

export default AlertsContainer; 