import { useLocation } from '@/hooks/useLocation';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import TaraMap from './TaraMap';

const HomeMap: React.FC = () => {
  const { latitude, longitude, loading } = useLocation();
  const animationRef = useRef<number | null>(null);
  const [currentHeading, setCurrentHeading] = useState(0);

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

  // Camera props for 3D view with rotation - only when location is available
  const cameraProps = latitude !== 0 && longitude !== 0 && !loading ? {
    center: {
      latitude: latitude as number,
      longitude: longitude as number,
    },
    pitch: 45, // Better tilt angle to see buildings
    heading: currentHeading,
    zoom: 18, // Closer zoom to the user
    altitude: 500, // Lower altitude for closer view
    animationDuration: 100, // Slower animation for smoother transitions
  } : undefined;

  return (
    <TaraMap
      showMarker={true}
      markerTitle="You are here"
      markerDescription="Current Location"
      mapStyle={styles.map}
      cameraProps={cameraProps}
    />
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default HomeMap;
