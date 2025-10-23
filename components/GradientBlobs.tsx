import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type GradientBlobsProps = {
  color?: string;
};

const GradientBlobs: React.FC<GradientBlobsProps> = ({
  color,
}) => {
  const secondaryColor = useThemeColor({}, 'accent');
  const gradientColor = color || secondaryColor;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['transparent',gradientColor ]}
        start={{ x: 0, y: 0.5 }}   // left side
        end={{ x: 1, y: 0.5 }}     // right side
        style={styles.topRightBlob}
      />
      <LinearGradient
        colors={['transparent',gradientColor ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomLeftBlob}
      />
      <LinearGradient
        colors={[gradientColor,'transparent' ]}
        start={{ x: 0, y: 0.5 }}   // left side
        end={{ x: 1, y: 0.5 }} 
        style={styles.bottomCenterBlob}
      />
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRightBlob: {
    width: '60%',
    aspectRatio: 1,
    opacity: 0.4,
    position: 'absolute',
    top: '-13%',
    right: '-13%',
    borderRadius: 10000,
  },
  bottomLeftBlob: {
    width: '70%',
    aspectRatio: 1,
    opacity: 0.5,
    position: 'absolute',
    bottom: '-10%',
    left: '-15%',
    borderRadius: 10000,
  },
  bottomCenterBlob: {
    width: '40%',
    aspectRatio: 1,
    opacity: 0.2,
    position: 'absolute',
    bottom: '-10%',
    left: '40%',
    borderRadius: 10000,
  },
});

export default GradientBlobs;