// PulsatingGradient.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type PulsatingGradientProps = {
  color?: string;
  style?: StyleProp<ViewStyle>;
};

const PulsatingGradient: React.FC<PulsatingGradientProps> = ({
  color = "blue",
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500, // slow soft pulse
          useNativeDriver: false, // height can't use native driver
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Animate opacity + height
  const animatedStyle = {
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 0.9],
    }),
    height: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [50, 80], // softly expand/shrink
    }),
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <LinearGradient
        colors={[color, "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }} // vertical gradient
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
});

export default PulsatingGradient;
