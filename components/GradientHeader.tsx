import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet } from 'react-native';

type GradientHeaderProps = {
  color?: string;
};

const GradientHeader: React.FC<GradientHeaderProps> = ({
  color,
}) => {
  const secondaryColor = useThemeColor({}, 'accent');
  const gradientColor = color || secondaryColor;

  return (
    <LinearGradient
      colors={[gradientColor, 'transparent']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    />
  );
};

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
    height: 120, // Default height
  },
});

export default GradientHeader;