import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import MapView, { Region, Marker, MAP_TYPES, PROVIDER_DEFAULT } from 'react-native-maps';
import TaraMarker from './TaraMarker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionContext';
import { ThemedText } from '@/components/ThemedText';
import { useMapType } from '@/hooks/useMapType';
import { useLocation } from '@/hooks/useLocation';
import { useTourMembers } from '@/hooks/useTourMembers';

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
  isInAnEmergency?: boolean;
  emergencyType?: string;
}

interface TourMapProps {
  tourId: string;
  tourParticipants: Array<{
    userID: string;
    name: string;
    profileImage: string;
    isApproved: boolean;
  }>;
}

export default function TourMap({ tourId, tourParticipants }: TourMapProps) {
  const { session } = useSession();
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const { mapType: currentMapType } = useMapType();
  const location = useLocation();
  
  // Fetch tour members' locations from Firebase Realtime Database
  const { members: memberLocations } = useTourMembers({ tourId, enabled: true });
  
  const [region, setRegion] = useState<Region>({
    latitude: 10.2374, // Minglanilla, Cebu, Philippines
    longitude: 123.7970,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  
  const [animatedMembers, setAnimatedMembers] = useState<MemberLocation[]>([]);

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

  // Update animated members when memberLocations change
  useEffect(() => {
    if (!memberLocations || memberLocations.length === 0) {
      return;
    }

    // Filter only members who are sharing their location
    const sharingMembers = memberLocations.filter(m => m.isSharingLocation);

    console.log('🗺️ Updating tour member locations:', {
      total: memberLocations.length,
      sharing: sharingMembers.length,
    });

    setAnimatedMembers(prevMembers => {
      const updatedMembers = sharingMembers.map(member => {
        const existingMember = prevMembers.find(m => m.userID === member.userID);

        if (existingMember) {
          // Animate existing member to new location
          console.log('🎯 Animating member:', member.username, 'to', member.latitude, member.longitude);

          Animated.parallel([
            Animated.timing(existingMember.animatedLatitude, {
              toValue: member.latitude,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(existingMember.animatedLongitude, {
              toValue: member.longitude,
              duration: 1000,
              useNativeDriver: false,
            }),
          ]).start(() => {
            console.log('✅ Animation completed for:', member.username);
          });

          return {
            ...existingMember,
            userName: member.username,
            lastUpdated: new Date(member.lastUpdated).toISOString(),
            isInAnEmergency: member.isInAnEmergency,
            emergencyType: member.emergencyType,
          };
        } else {
          // Create new animated member
          console.log('➕ Adding new member:', member.username);
          return {
            userID: member.userID,
            userName: member.username,
            profileImage: '',
            location: {
              latitude: member.latitude,
              longitude: member.longitude,
            },
            animatedLatitude: new Animated.Value(member.latitude),
            animatedLongitude: new Animated.Value(member.longitude),
            lastUpdated: new Date(member.lastUpdated).toISOString(),
            isInAnEmergency: member.isInAnEmergency,
            emergencyType: member.emergencyType,
          };
        }
      });

      return updatedMembers;
    });
  }, [memberLocations]);

  // Update region when user location changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [location.latitude, location.longitude]);

  // Get member color based on userID
  const getMemberColor = (userID: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const index = userID.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <MapView
      mapType={getMapTypeEnum(currentMapType)}
      provider={PROVIDER_DEFAULT}
      style={styles.map}
      initialRegion={region}
      showsMyLocationButton
    >
      {/* Render current user with TaraMarker */}
      {location.latitude && location.longitude && (
        <TaraMarker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          color={accentColor}
          icon={session?.user?.profileImage}
          title="You"
          description="Your current location"
          identifier={session?.user?.id || 'current-user'}
        />
      )}

      {/* Render animated markers for other tour members */}
      {animatedMembers
        .filter(member => member.userID !== session?.user?.id)
        .map((member) => {
          const animatedCoordinate = {
            latitude: member.animatedLatitude,
            longitude: member.animatedLongitude,
          };

          const memberColor = getMemberColor(member.userID);

          return (
            <AnimatedMarker
              key={member.userID}
              coordinate={animatedCoordinate}
              title={member.userName}
              description={`Last updated: ${new Date(member.lastUpdated).toLocaleTimeString()}`}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.markerContainer, { 
                backgroundColor: memberColor,
                borderColor: member.isInAnEmergency ? '#FF0000' : 'white'
              }]}>
                <View style={styles.markerContent}>
                  {member.profileImage ? (
                    <Image
                      source={{ uri: member.profileImage }}
                      style={styles.profileImage}
                    />
                  ) : (
                    <ThemedText style={styles.markerText}>
                      {member.userName.charAt(0).toUpperCase()}
                    </ThemedText>
                  )}
                </View>
                {member.isInAnEmergency && (
                  <View style={styles.emergencyBadge}>
                    <ThemedText style={styles.emergencyText}>!</ThemedText>
                  </View>
                )}
              </View>
            </AnimatedMarker>
          );
        })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerContent: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  markerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  emergencyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF0000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
});
