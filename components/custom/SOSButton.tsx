import React, { useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
  StyleProp,
  ViewStyle,
  Dimensions
} from 'react-native';
import ThemedIcons from '../ThemedIcons';

interface SOSButtonProps {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  state?: 'active' | 'notActive';
  children?: React.ReactNode;
}

const SOSButton: React.FC<SOSButtonProps> = ({
  onPress,
  style,
  state = 'notActive',
  children,
}) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  const isActive = state === 'active';

  useEffect(() => {
    const createPulse = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ])
      );
    };

    createPulse(pulse1, 0).start();
    createPulse(pulse2, 500).start();
  }, [pulse1, pulse2]);

  const getAnimatedStyle = (animatedValue: Animated.Value) => ({
    ...styles.ring,
    borderColor: isActive ? 'red' : '#ccc',
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.3],
        }),
      },
    ],
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0],
    }),
  });

  return (
    <View style={[styles.container, style]}>
      <View style={styles.wrapper}>
        <Animated.View style={getAnimatedStyle(pulse1)} />
        <Animated.View style={getAnimatedStyle(pulse2)} />
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isActive ? 'red' : 'white' },
          ]}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <ThemedIcons library='MaterialDesignIcons' name="exclamation" size={70} color={isActive ? 'white' : '#ccc'}/>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SOSButton;

const BUTTON_SIZE = 150;
const RING_SIZE = 170;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  wrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 8,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    borderWidth: 8,
    borderColor: '#ccc',
  },
});