import { useThemeColor } from '@/hooks/useThemeColor';
import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  Easing,
} from 'react-native';

interface ActiveRouteButtonProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const ActiveRouteButton: React.FC<ActiveRouteButtonProps> = ({
  style,
  children,
}) => {
  const borderAnim = useRef(new Animated.Value(0)).current;
  const secondaryColor = useThemeColor({}, 'accent');

  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1000, // fade in
          useNativeDriver: false, // must be false for borderColor
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1000, // fade out
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loopAnimation.start();
    return () => loopAnimation.stop();
  }, [borderAnim]);

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', secondaryColor],
  });

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.wrapper}
        onPress={() => router.push('/(tabs)/maps')}
        activeOpacity={0.8}
      >
        <Animated.View
          style={[
            styles.button,
            {
              borderColor: animatedBorderColor,
              backgroundColor: secondaryColor,
            },
          ]}
        >
          {children}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default ActiveRouteButton;


const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 3,
  },
});
