import React, { useState, useEffect } from 'react';
import {
  Modal,
  Animated,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  View,
} from 'react-native';
import { ThemedIcons } from '../ThemedIcons';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/hooks/useTheme';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';

interface ProcessModalProps {
  visible: boolean;
  success: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export default function ProcessModal({ 
  visible, 
  success, 
  successMessage, 
  errorMessage,
}: ProcessModalProps) {
  const [modalAnimation] = useState(new Animated.Value(0));
  const [slideAnimation] = useState(new Animated.Value(300));
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

  // Auto-redirect functionality like LoadingModal
  useEffect(() => {
    if ((visible && success) || (visible && errorMessage)) {
      const timer = setTimeout(() => {
        router.back()
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, success, errorMessage]);

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
          {/* Loading State */}
          {!success && !errorMessage && (
            <>
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
                <ActivityIndicator size={80} color="#00CAFF" />
              </Animated.View>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                Loading...
              </ThemedText>
            </>
          )}
          
          {/* Success State */}
          {success && (
            <>
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
              <ThemedText style={[styles.modalTitle, { color: '#4CAF50' }]}>
                {successMessage || 'Success!'}
              </ThemedText>
            </>
          )}
          
          {/* Error State */}
          {errorMessage && !success && (
            <>
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
                  name='error' 
                  size={80} 
                  color={'#FF3B30'} 
                />
              </Animated.View>
              <ThemedText style={[styles.modalTitle, { color: '#FF3B30' }]}>
                {errorMessage}
              </ThemedText>
            </>
          )}
        </Animated.View>
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
    minHeight: 120,
  },
  modalTitle: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 17,
  },
});
