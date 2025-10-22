import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedIcons } from '@/components/ThemedIcons';
import BackButton from './BackButton';

type IconLibrary = 'MaterialIcons' | 'MaterialCommunityIcons' | 'MaterialDesignIcons';

interface FadedHeaderProps {
  color?: string;
  title?: string;
  subtitle?: string;
  iconLibrary?: IconLibrary;
  iconName?: string;
}

const FadedHeader: React.FC<FadedHeaderProps> = ({ color, title, subtitle, iconLibrary, iconName }) => {
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  return (
    <View style={[styles.container, {backgroundColor: color || secondaryColor}]}>
      <BackButton style={{padding: 16, zIndex: 1000}} color='#fff'/>
      <LinearGradient
        colors={['transparent', backgroundColor]}
        style={styles.gradientOverlay}
      >
        {title && <ThemedText type='subtitle' >{title}</ThemedText>}
        {subtitle && <ThemedText style={{opacity: .7}}>{subtitle}</ThemedText>}
      </LinearGradient>
      {iconName && (
        <>
          <View style={styles.iconContainer}>
          
            <ThemedIcons
              library={iconLibrary || 'MaterialDesignIcons'}
              name={iconName}
              size={120}
              color="#fff"
            />
          </View>
          <LinearGradient
            colors={[backgroundColor, backgroundColor, 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.circle}
          >

            <LinearGradient
              colors={[backgroundColor, backgroundColor, 'transparent']}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={styles.innerCirlce}
            />
          </LinearGradient>
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
    top: 20,
    right: -10,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: .9,
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
    opacity: .4,
    padding: 30,
  },
  innerCirlce:{
    flex: 1,
    borderRadius: 1000,
    overflow: 'hidden',
    opacity: .5,
    padding: 30,
  }
});

export default FadedHeader;