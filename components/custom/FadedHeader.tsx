import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcons } from '@/components/ThemedIcons';

interface FadedHeaderProps {
  color?: string;
  title?: string;
  subtitle?: string;
  iconName?: string;
}

const FadedHeader: React.FC<FadedHeaderProps> = ({ color, title, subtitle, iconName }) => {
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  return (
    <View style={[styles.container, {backgroundColor: color || secondaryColor}]}>
      <LinearGradient
        colors={['transparent', backgroundColor]}
        style={styles.gradientOverlay}
      >
        {title && <ThemedText type='subtitle'>{title}</ThemedText>}
        {subtitle && <ThemedText>{subtitle}</ThemedText>}
      </LinearGradient>
      {iconName && (
        <>
          <View style={styles.iconContainer}>
            <ThemedIcons
              library="MaterialDesignIcons"
              name={iconName}
              size={150}
              color="#fff"
            />
          </View>

          <View style={styles.circle}>
            <LinearGradient
              colors={[backgroundColor, backgroundColor, 'transparent']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={{ flex: 1 }}
            />
          </View>
        </>
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120,
    overflow: 'hidden'
  },
  label: {
    marginLeft: 12,
  },
  gradientOverlay: {
    paddingTop: 50,
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: .8,
    zIndex: 99
  },
  circle: {
    position: 'absolute',
    top: 10,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 1000,
    overflow: 'hidden',
    opacity: .4
  }
});

export default FadedHeader;