// TaraMarker.tsx
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

type EmergencyType = 'medical' | 'criminal' | 'fire' | 'natural' | 'utility' | 'road' | 'domestic' | 'animal' | 'other';

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
  onPress?: () => void;
  type?: 'default' | 'dot';
  borderColor?: string;
  emergencyType?: EmergencyType;
}

const TaraMarker: React.FC<TaraMarkerProps> = ({
  coordinate,
  color,
  icon,
  label,
  title,
  description,
  identifier,
  onPress,
  type = 'default',
  borderColor,
  emergencyType,
}) => {
  const [tracksViewChanges, setTracksViewChanges] = useState<boolean>(true);
  const secondaryColor = useThemeColor({}, 'secondary');

  // Get emergency emoji based on type
  const getEmergencyEmoji = (type?: EmergencyType): string => {
    if (!type) return '';
    const emojiMap: Record<EmergencyType, string> = {
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

  // If there's no remote icon, we can immediately stop tracking view changes for performance.
  useEffect(() => {
    if (!icon) {
      setTracksViewChanges(false);
    }
  }, [icon]);
  
  if (type === 'dot') {
    const markerColor = color || secondaryColor || '#FF6B6B';
    return (
      <Marker
        coordinate={coordinate}
        title={title}
        description={description}
        identifier={identifier}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={onPress}
      >
        <View style={[styles.dotMarker, { backgroundColor: markerColor }]} />
      </Marker>
    );
  }

  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      identifier={identifier}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={1000}
      onPress={onPress}
    >
      <View style={[styles.markerContainer]}>
        <View style={[styles.circle, { backgroundColor: color, borderColor: borderColor || 'white' }]}>
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
        {emergencyType && (
          <View style={styles.emergencyBadge}>
            <ThemedText style={styles.emergencyEmoji}>
              {getEmergencyEmoji(emergencyType)}
            </ThemedText>
          </View>
        )}
      </View>
    </Marker>
  );
};

export default TaraMarker;

const styles = StyleSheet.create({
  markerContainer: {
    position: 'relative',
    width: 35,
    height: 35,
    zIndex: 1,
  },
  circle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
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
    zIndex: 1000
  },
  labelText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dotMarker: {
    width: 14,
    height: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 20,
    backgroundColor: 'red',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 10,
    zIndex: 100,
  },
  emergencyEmoji: {
    fontSize: 10,
    lineHeight: 12,
  },
});