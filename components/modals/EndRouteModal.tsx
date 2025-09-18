import React, { useState, useEffect } from 'react';
import {
  Modal,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedIcons } from '../ThemedIcons';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/hooks/useTheme';
import { useColorScheme } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface EndRouteModalProps {
  visible: boolean;
  onClose: () => void;
  distance: number; // in meters
  timeElapsed: number; // in seconds
  routeStops?: { latitude: number; longitude: number; locationName: string }[]; // route stops
}

export default function EndRouteModal({ 
  visible, 
  onClose, 
  distance, 
  timeElapsed,
  routeStops = []
}: EndRouteModalProps) {
  const [modalAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(300)); // Start from bottom
  const [iconAnimation] = useState(new Animated.Value(0));
  const [rotationAnimation] = useState(new Animated.Value(0));
  
  const primaryColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const { theme: selectedTheme } = useTheme();
  const deviceColorScheme = useColorScheme();
  
  // Get overlay color based on theme
  const getOverlayColor = () => {
    if (selectedTheme === 'light') {
      return 'rgba(244,244,244,.90)';
    } else if (selectedTheme === 'dark') {
      return 'rgba(2,13,25,.90)';
    } else if (selectedTheme === 'device') {
      // Use device's actual theme colors
      if (deviceColorScheme === 'light') {
        return 'rgba(244,244,244,.90)';
      } else {
        return 'rgba(2,13,25,.90)';
      }
    }
    // Fallback
    return 'rgba(0, 0, 0, 0.9)';
  };
  
  // Format distance as km with 2 decimal places
  const formatDistance = (meters: number) => {
    return (meters / 1000).toFixed(2);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format route stops as "Start > Destination"
  const formatRouteStops = () => {
    if (routeStops.length === 0) return '';
    if (routeStops.length === 1) return routeStops[0].locationName;
    if (routeStops.length === 2) {
      return `${routeStops[0].locationName} > ${routeStops[1].locationName}`;
    }
    // For multiple stops, show first > last
    return `${routeStops[0].locationName} > ${routeStops[routeStops.length - 1].locationName}`;
  };

  useEffect(() => {
    if (visible) {
      // Start modal animations
      Animated.parallel([
        Animated.timing(modalAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(iconAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(rotationAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animations when modal is hidden
      modalAnimation.setValue(0);
      slideAnimation.setValue(300);
      iconAnimation.setValue(0);
      rotationAnimation.setValue(0);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnimation, {
        toValue: 300,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
      // Reset animations
      modalAnimation.setValue(0);
      slideAnimation.setValue(300);
      iconAnimation.setValue(0);
      rotationAnimation.setValue(0);
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
    >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              backgroundColor: getOverlayColor(),
              opacity: modalAnimation,
            }
          ]}
        >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: slideAnimation
                },
                {
                  scale: iconAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  })
                }
              ]
            }
          ]}
        >
          <Animated.View
            style={{
              transform: [{
                rotate: rotationAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}
          >
            <ThemedIcons 
              library='MaterialIcons' 
              name='check-circle' 
              size={80} 
              color={'#4CAF50'} 
            />
          </Animated.View>
          <ThemedText type="title" style={[styles.modalTitle, { color: textColor }]}>
            Route Ended
          </ThemedText>
          
          {formatRouteStops() && (
            <ThemedText style={[styles.routeStops, { color: textColor }]}>
              {formatRouteStops()}
            </ThemedText>
          )}
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <ThemedIcons 
                library='MaterialIcons' 
                name='straighten' 
                size={24}
              />
              <ThemedText style={[styles.statLabel, { color: textColor }]}>
                Distance
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.statValue, { color: textColor }]}>
                {formatDistance(distance)} km
              </ThemedText>
            </View>
            
            <View style={styles.statItem}>
              <ThemedIcons 
                library='MaterialIcons' 
                name='schedule' 
                size={24}
              />
              <ThemedText style={[styles.statLabel, { color: textColor }]}>
                Time
              </ThemedText>
              <ThemedText type="defaultSemiBold" style={[styles.statValue, { color: textColor }]}>
                {formatTime(timeElapsed)}
              </ThemedText>
            </View>
          </View>
          
          
        </Animated.View>
        <TouchableOpacity 
        style={[styles.closeButton, { backgroundColor: primaryColor }]}
        onPress={handleClose}
        >
         <ThemedText>Close</ThemedText>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 250,
  },
  modalTitle: {
    textAlign: 'center',
    marginTop: 20,
  },
  routeStops: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  statLabel: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.5,
  },
  statValue: {
    marginTop: 4,
    fontSize: 18,
  },
  closeButton: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
});
