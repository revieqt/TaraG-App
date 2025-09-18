// TaraMarker.tsx
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface TaraMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  color?: string;
  icon?: string; // uri
  label?: string;
  title?: string;
  description?: string;
  identifier?: string;
}

const TaraMarker: React.FC<TaraMarkerProps> = ({
  coordinate,
  color,
  icon,
  label,
  title,
  description,
  identifier,
}) => {
  const [tracksViewChanges, setTracksViewChanges] = useState<boolean>(true);
  const secondaryColor = useThemeColor({}, 'secondary');

  // If there's no remote icon, we can immediately stop tracking view changes for performance.
  useEffect(() => {
    if (!icon) {
      setTracksViewChanges(false);
    }
  }, [icon]);
  
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      identifier={identifier}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={1000}
    >
      <View style={[styles.circle, { backgroundColor: color || '#f4f4f4' }]}>
        {icon ? (
          <Image
            source={{ uri: icon }}
            style={styles.icon}
            resizeMode="cover"
            onLoad={() => {
              console.log('Image loaded successfully');
              setTracksViewChanges(false);
            }}
            onError={(error) => {
              console.log('Image load error:', error);
              setTracksViewChanges(false);
            }}
          />
        ) : (
          <ThemedText style={styles.labelText}>
            {label || 'U'}
          </ThemedText>
        )}
      </View>
    </Marker>
  );
};

export default TaraMarker;

const styles = StyleSheet.create({
  circle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  labelText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
