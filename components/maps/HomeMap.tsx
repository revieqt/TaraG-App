import { useLocation } from '@/hooks/useLocation';
import { useSession } from '@/context/SessionContext';
import { useMapType } from '@/hooks/useMapType';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { MAP_TYPES, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import TaraMarker from './TaraMarker';

const HomeMap: React.FC = () => {
  const { latitude, longitude, loading } = useLocation();
  const { session } = useSession();
  const { mapType: currentMapType } = useMapType();
  const animationRef = useRef<number | null>(null);
  const mapRef = useRef<MapView>(null);
  const [currentHeading, setCurrentHeading] = useState(0);

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

  // Start 360-degree rotation animation
  useEffect(() => {
    if (latitude !== 0 && longitude !== 0 && !loading) {
      // Clear any existing animation
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }

      // Start new rotation
      animationRef.current = setInterval(() => {
        setCurrentHeading(prev => (prev + 0.5) % 360); // Slower rotation (0.5 degrees per update)
      }, 100); // Slower update rate (100ms) for smoother animation

      // Cleanup on unmount or when location changes
      return () => {
        if (animationRef.current) {
          clearInterval(animationRef.current);
          animationRef.current = null;
        }
      };
    }
  }, [latitude, longitude, loading]);

  // Default region for Philippines
  const defaultRegion: Region = {
    latitude: latitude || 14.5995,
    longitude: longitude || 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  // Animate camera for 3D rotation effect
  useEffect(() => {
    if (latitude !== 0 && longitude !== 0 && mapRef.current && !loading) {
      mapRef.current.animateCamera({
        center: {
          latitude: latitude as number,
          longitude: longitude as number,
        },
        pitch: 45, // Better tilt angle to see buildings
        heading: currentHeading,
        zoom: 18, // Closer zoom to the user
        altitude: 500, // Lower altitude for closer view
      }, {
        duration: 100, // Slower animation for smoother transitions
      });
    }
  }, [latitude, longitude, currentHeading, loading]);


  return (
    <View style={{ flex: 1 }}>
      <MapView
        mapType={getMapTypeEnum(currentMapType)}
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
      >
        {session &&
          latitude !== 0 &&
          longitude !== 0 &&
          !loading && (
            <TaraMarker
              key="user-marker"
              coordinate={{ latitude: latitude as number, longitude: longitude as number }}
              title="You are here"
              description="Current Location"
              color="#0065F8"
              icon={session.user?.profileImage}
              label="U"
            />
          )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default HomeMap;
