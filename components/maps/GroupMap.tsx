import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Alert, Platform, Animated, Image } from 'react-native';
import MapView, { Region, Marker, AnimatedRegion, MAP_TYPES, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import TaraMarker from './TaraMarker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionContext';
import { useSocket } from '@/context/SocketContext';
import { ThemedText } from '@/components/ThemedText';
import { useMapType } from '@/hooks/useMapType';

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

interface MemberLocation {
  userID: string;
  userName: string;
  profileImage: string;
  location: {
    latitude: number;
    longitude: number;
  };
  animatedLatitude: Animated.Value;
  animatedLongitude: Animated.Value;
  lastUpdated: string;
}

interface GroupMapProps {
  groupId: string;
  groupMembers: Array<{
    userID: string;
    name: string;
    profileImage: string;
    isApproved: boolean;
  }>;
}

export default function GroupMap({ groupId, groupMembers }: GroupMapProps) {
  const { session } = useSession();
  const { socket, joinGroup, leaveGroup, updateLocation } = useSocket();
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const { mapType: currentMapType } = useMapType();
  
  const [memberLocations, setMemberLocations] = useState<MemberLocation[]>([]);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  // Convert string map type to MAP_TYPES enum
  const getMapTypeEnum = (mapType: string) => {
    switch (mapType) {
      case 'satellite':
        return MAP_TYPES.SATELLITE;
      case 'hybrid':
        return MAP_TYPES.HYBRID;
      case 'terrain':
        return MAP_TYPES.TERRAIN;
      case 'standard':
      default:
        return MAP_TYPES.STANDARD;
    }
  };

  // Initialize socket listeners and location tracking
  useEffect(() => {
    if (!session?.user?.id || !groupId || !socket) {
      console.log('❌ Missing session user ID, group ID, or socket:', { 
        userId: session?.user?.id, 
        groupId, 
        socketConnected: !!socket 
      });
      return;
    }

    console.log('📍 Setting up GroupMap for group:', groupId);
    
    // Join the group room
    joinGroup(groupId);

    // Listen for location updates from other members
    socket.on('member-location-update', (data: {
      groupId: string;
      userId: string;
      userName: string;
      profileImage: string;
      location: { latitude: number; longitude: number };
      timestamp: number;
    }) => {
    
      
      setMemberLocations(prev => {
        const existingMember = prev.find(loc => loc.userID === data.userId);
        const filtered = prev.filter(loc => loc.userID !== data.userId);
        
        let animatedLatitude: Animated.Value;
        let animatedLongitude: Animated.Value;
        
        if (existingMember) {
          // Animate from previous position to new position
          console.log('🎬 Animating marker from', existingMember.location, 'to', data.location);
          animatedLatitude = existingMember.animatedLatitude;
          animatedLongitude = existingMember.animatedLongitude;
          
          // Animate to new position over 1 second
          Animated.parallel([
            Animated.timing(animatedLatitude, {
              toValue: data.location.latitude,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(animatedLongitude, {
              toValue: data.location.longitude,
              duration: 1000,
              useNativeDriver: false,
            }),
          ]).start(() => {
            console.log('✅ Animation completed for', data.userName);
          });
        } else {
          // Create new animated values for first-time location
          console.log('🆕 Creating new animated marker for', data.userName);
          animatedLatitude = new Animated.Value(data.location.latitude);
          animatedLongitude = new Animated.Value(data.location.longitude);
        }
        
        const newMemberLocation: MemberLocation = {
          userID: data.userId,
          userName: data.userName,
          profileImage: data.profileImage,
          location: data.location,
          animatedLatitude,
          animatedLongitude,
          lastUpdated: new Date(data.timestamp).toISOString()
        };
        
    
        return [...filtered, newMemberLocation];
      });
    });

    // Request location permissions and start tracking
    requestLocationPermission();

    return () => {
      // Cleanup
      if (locationWatchRef.current) {
        locationWatchRef.current.remove();
      }
      // Leave group room
      leaveGroup(groupId);
      
      // Remove socket listeners
      socket.off('member-location-update');
    };
  }, [groupId, session?.user?.id, socket, joinGroup, leaveGroup]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permissions to share your location with group members.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get initial location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setUserLocation(location);
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Start watching location changes
      startLocationTracking();
      
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to get location permissions');
    }
  };

  const startLocationTracking = async () => {
    try {
      locationWatchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update when moved 10 meters
        },
        (location) => {
          setUserLocation(location);
          
          // Emit location update to other group members
          if (session?.user) {
            const locationData = {
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            };
            console.log('📤 Emitting location update:', locationData);
            updateLocation(groupId, locationData);
          }
        }
      );
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  };

  const getCurrentUserMarkerColor = () => {
    return accentColor;
  };

  const getOtherMemberMarkerColor = (userId: string) => {
    // Generate consistent color for each member based on their ID
    const colors = [primaryColor, '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const index = userId.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderCurrentUserMarker = () => {
    if (!userLocation || !session?.user) return null;

    return (
      <TaraMarker
        key={`current-user-${session.user.id}`}
        coordinate={{
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
        }}
        color={getCurrentUserMarkerColor()}
        icon={session.user.profileImage}
        title="You"
        description="Your current location"
        identifier={session.user.id}
      />
    );
  };

  const renderMemberMarkers = () => {
    
    return memberLocations.map((memberLocation) => {
      // Don't render marker for current user (handled separately)
      if (memberLocation.userID === session?.user?.id) {
        console.log('🎯 Skipping current user marker:', memberLocation.userID);
        return null;
      }

      console.log('🎯 Rendering animated marker for:', memberLocation.userName, memberLocation.location);
      
      // Create animated coordinate object from animated values
      const animatedCoordinate = {
        latitude: memberLocation.animatedLatitude,
        longitude: memberLocation.animatedLongitude,
      };
      
      // Use AnimatedMarker for smooth movement
      return (
        <AnimatedMarker
          key={`member-${memberLocation.userID}`}
          coordinate={animatedCoordinate}
          title={memberLocation.userName}
          description={`Last updated: ${new Date(memberLocation.lastUpdated).toLocaleTimeString()}`}
          identifier={memberLocation.userID}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={1000}
        >
          <View style={[
            styles.markerContainer, 
            { backgroundColor: getOtherMemberMarkerColor(memberLocation.userID) }
          ]}>
            {memberLocation.profileImage ? (
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: memberLocation.profileImage }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.initialsContainer}>
                <ThemedText style={styles.initialsText}>
                  {memberLocation.userName.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
        </AnimatedMarker>
      );
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        mapType={getMapTypeEnum(currentMapType)}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={false} // We'll use our custom marker
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
      >
        {renderCurrentUserMarker()}
        {renderMemberMarkers()}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImageContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});