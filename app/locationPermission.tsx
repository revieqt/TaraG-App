import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Alert, Dimensions } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function LocationPermissionScreen() {
  const iconColor = useThemeColor({}, 'icon');
  const accentColor = useThemeColor({}, 'accent');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const [isRequesting, setIsRequesting] = useState(false);

  const requestLocationPermission = async () => {
    try {
      setIsRequesting(true);
      
      // Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        // Permission granted, redirect to home
        router.replace('/(tabs)/home');
      } else {
        // Permission denied - stay on this screen
        Alert.alert(
          'Location Permission Required',
          'TaraG needs location access to provide you with location-based features like navigation, nearby places, and safety features. Please try again or enable location permission in your device settings.',
          [
            {
              text: 'Try Again',
              onPress: requestLocationPermission,
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
        // User stays on this screen - no navigation
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert(
        'Error',
        'Failed to request location permission. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: requestLocationPermission,
          },
        ]
      );
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Location Icon */}
        <View style={[styles.iconContainer, { backgroundColor: accentColor + '20' }]}>
          <Ionicons 
            name="location" 
            size={80} 
            color={accentColor} 
          />
        </View>

        {/* Title */}
        <ThemedText style={styles.title}>
          Enable Location Access
        </ThemedText>

        {/* Description */}
        <ThemedText style={styles.description}>
          TaraG needs access to your location to provide you with the best experience including:
        </ThemedText>

        {/* Features List */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Ionicons name="navigate" size={24} color={accentColor} />
            <ThemedText style={styles.featureText}>Turn-by-turn navigation</ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="people" size={24} color={accentColor} />
            <ThemedText style={styles.featureText}>Share location with groups</ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark" size={24} color={accentColor} />
            <ThemedText style={styles.featureText}>Safety and emergency features</ThemedText>
          </View>
          
          <View style={styles.featureItem}>
            <Ionicons name="business" size={24} color={accentColor} />
            <ThemedText style={styles.featureText}>Discover nearby places</ThemedText>
          </View>
        </View>

        {/* Allow Location Button */}
        <TouchableOpacity
          style={[styles.allowButton, { backgroundColor: accentColor }]}
          onPress={requestLocationPermission}
          disabled={isRequesting}
        >
          <ThemedText style={[styles.allowButtonText, { color: backgroundColor }]}>
            {isRequesting ? 'Requesting...' : 'Allow Location Access'}
          </ThemedText>
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            Alert.alert(
              'Skip Location Permission',
              'Some features may not work properly without location access. You can enable it later in Settings.',
              [
                {
                  text: 'Enable Now',
                  onPress: requestLocationPermission,
                },
                {
                  text: 'Skip',
                  style: 'destructive',
                  onPress: () => router.replace('/(tabs)/home'),
                },
              ]
            );
          }}
        >
          <ThemedText style={[styles.skipButtonText, { color: textColor + '80' }]}>
            Skip for now
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    opacity: 0.8,
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
  allowButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  allowButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
});