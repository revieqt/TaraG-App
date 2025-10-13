import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, ViewProps, AccessibilityProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/useThemeColor";

type Props = ViewProps & {
  /** control animation speed in ms */
  duration?: number;
  /** whether animation runs (default true) */
  running?: boolean;
  /** background overlay color under the wipe */
  backgroundColor?: string;
};

export default function LoadingContainerAnimation({
  duration = 1200,
  running = true,
  backgroundColor = "transparent",
  style,
  ...rest
}: Props & AccessibilityProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const color1 = useThemeColor({}, 'background');

  useEffect(() => {
    if (!running) {
      translateX.stopAnimation();
      return;
    }

    const loopAnim = () => {
      translateX.setValue(-1);
      animRef.current = Animated.timing(translateX, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      Animated.loop(animRef.current).start();
    };

    loopAnim();

    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [duration, running, translateX]);

  const translateInterpolation = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-1, 1],
  });

  const translatePx = translateInterpolation.interpolate({
    inputRange: [-1, 1],
    outputRange: [-1000, 1000], // large values to cover the screen
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      style={[styles.container, style]}
      {...rest}
    >
      {/* subtle background */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ccc1' }]} pointerEvents="none" />

      {/* full-screen wiping gradient */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [
              { translateX: translatePx as any },
            ],
          },
        ]}
      >
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={["#ccc4", '#ccc5', "#ccc4"]}
          start={[0, 0.5]}
          end={[1, 0.5]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});