import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image } from 'react-native';
import MapView, { Region, Marker, MAP_TYPES, PROVIDER_DEFAULT } from 'react-native-maps';
import TaraMarker from './TaraMarker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionContext';
import { ThemedText } from '@/components/ThemedText';
import { useMapType } from '@/hooks/useMapType';
import { useLocation } from '@/hooks/useLocation';
import { useGroupMembers } from '@/hooks/useGroupMembers';

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
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const { mapType: currentMapType } = useMapType();
  const location = useLocation();
  
  // Fetch group members' locations from Firebase Realtime Database
  const { members: memberLocations } = useGroupMembers({ groupId, enabled: true });
  
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
    console.log('📍 Updating member locations:', sharingMembers.length, 'members sharing location');

    setAnimatedMembers(prev => {
      return sharingMembers.map(member => {
        const existing = prev.find(m => m.userID === member.userID);
        
        if (existing) {
          // Animate existing member to new position
          Animated.parallel([
            Animated.timing(existing.animatedLatitude, {
              toValue: member.latitude,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(existing.animatedLongitude, {
              toValue: member.longitude,
              duration: 1000,
              useNativeDriver: false,
            }),
          ]).start();
          
          return {
            ...existing,
            userName: member.username,
            location: { latitude: member.latitude, longitude: member.longitude },
            lastUpdated: new Date(member.lastUpdated).toISOString(),
            isInAnEmergency: member.isInAnEmergency,
            emergencyType: member.emergencyType,
          };
        } else {
          // Create new animated member
          return {
            userID: member.userID,
            userName: member.username,
            profileImage: '', // We'll need to get this from groupMembers prop
            location: { latitude: member.latitude, longitude: member.longitude },
            animatedLatitude: new Animated.Value(member.latitude),
            animatedLongitude: new Animated.Value(member.longitude),
            lastUpdated: new Date(member.lastUpdated).toISOString(),
            isInAnEmergency: member.isInAnEmergency,
            emergencyType: member.emergencyType,
          };
        }
      });
    });
  }, [memberLocations]);

  // Update map region when user location changes
  useEffect(() => {
    if (location.latitude && location.longitude) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [location.latitude, location.longitude]);

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
    if (!location.latitude || !location.longitude || !session?.user) return null;

    const isInEmergency = session.user.safetyState?.isInAnEmergency || false;
    const emergencyType = session.user.safetyState?.emergencyType as any;

    return (
      <TaraMarker
        key={`current-user-${session.user.id}`}
        coordinate={{
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        color={getCurrentUserMarkerColor()}
        icon={session.user.profileImage}
        title="You"
        description="Your current location"
        identifier={session.user.id}
        borderColor={isInEmergency ? '#FF0000' : undefined}
        emergencyType={isInEmergency ? emergencyType : undefined}
      />
    );
  };

  const renderMemberMarkers = () => {
    return animatedMembers.map((memberLocation) => {
      // Don't render marker for current user (handled separately)
      if (memberLocation.userID === session?.user?.id) {
        return null;
      }

      // Get profile image from groupMembers prop
      const memberInfo = groupMembers.find(m => m.userID === memberLocation.userID);
      const profileImage = memberInfo?.profileImage || '';
      
      // Emergency status
      const isInEmergency = memberLocation.isInAnEmergency || false;
      const emergencyType = memberLocation.emergencyType;
      
      // Get emergency emoji
      const getEmergencyEmoji = (type?: string): string => {
        if (!type) return '';
        const emojiMap: Record<string, string> = {
          medical: '🏥',
          criminal: '🚨',
          fire: '🔥',
          natural: '🌪️',
          utility: '⚡',
          road: '🚗',
          domestic: '🏠',
          animal: '🐾',
          other: '⚠️',
        };
        return emojiMap[type] || '';
      };
      
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
          <View style={styles.memberMarkerWrapper}>
            <View style={[
              styles.markerContainer, 
              { 
                backgroundColor: getOtherMemberMarkerColor(memberLocation.userID),
                borderColor: isInEmergency ? '#FF0000' : 'white',
                borderWidth: 4,
              }
            ]}>
              {profileImage ? (
                <View style={styles.profileImageContainer}>
                  <Image
                    source={{ uri: profileImage }}
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
            {isInEmergency && emergencyType && (
              <View style={styles.emergencyBadge}>
                <ThemedText style={styles.emergencyEmoji}>
                  {getEmergencyEmoji(emergencyType)}
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
  memberMarkerWrapper: {
    position: 'relative',
    width: 35,
    height: 35,
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
  emergencyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  emergencyEmoji: {
    fontSize: 10,
    lineHeight: 12,
  },
});