// TaraMarker.tsx
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { ThemedText } from '../ThemedText';

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

  // Prevent native re-parenting issues with remote images:
  const [tracksViewChanges, setTracksViewChanges] = useState<boolean>(true);

  // If there's no remote icon, we can immediately stop tracking view changes for performance.
  useEffect(() => {
    if (!icon) setTracksViewChanges(false);
  }, [icon]);

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      identifier={identifier}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.circle}>
        {icon ? (
          <Image
            source={{ uri: icon }}
            style={styles.icon}
            resizeMode="cover"
            onLoad={() => setTracksViewChanges(false)}
            onError={() => setTracksViewChanges(false)}
          />
        ) : (
          <ThemedText style={{textAlign: 'center' }}>
            {label}
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
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
