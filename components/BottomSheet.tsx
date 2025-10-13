import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    PanResponder,
    ScrollView,
    StyleSheet,
    View,
    ViewStyle,
    Keyboard,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: number[]; // decimals (e.g., 0.25 = 25% of screen height)
  defaultIndex?: number; // starting snap index
  style?: ViewStyle; // optional custom styles
}

export default function BottomSheet({
  children,
  snapPoints = [0.25, 0.5, 0.9],
  defaultIndex = 0,
  style,
}: BottomSheetProps) {
  const backgroundColor = useThemeColor({}, "primary");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Hidden offset (only handle visible)
  const hiddenOffset = SCREEN_HEIGHT - 40;

  // Convert decimals to pixel snap values - adjust for keyboard
  const effectiveScreenHeight = SCREEN_HEIGHT - keyboardHeight;
  const snapValues = [...snapPoints.map((p) => effectiveScreenHeight * (1 - p)), hiddenOffset];

  const translateY = useRef(new Animated.Value(snapValues[defaultIndex])).current;
  const lastSnap = useRef(snapValues[defaultIndex]);

  // Create animated height based on translateY position
  const animatedHeight = translateY.interpolate({
    inputRange: snapValues.slice(0, -1).reverse(), // Exclude hidden state and reverse for ascending order
    outputRange: snapPoints.slice().reverse().map(point => effectiveScreenHeight * point - 60), // Reverse output to match
    extrapolate: 'clamp',
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: snapValues[defaultIndex],
      useNativeDriver: true,
    }).start();
  }, [snapValues]);

  // Update position when keyboard height changes
  useEffect(() => {
    if (keyboardHeight > 0) {
      // Move to a higher snap point when keyboard is visible
      const keyboardAdjustedValue = snapValues[defaultIndex];
      Animated.spring(translateY, {
        toValue: keyboardAdjustedValue,
        useNativeDriver: true,
      }).start();
      lastSnap.current = keyboardAdjustedValue;
    }
  }, [keyboardHeight, snapValues]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        let newY = lastSnap.current + g.dy;

        const minSnap = Math.min(...snapValues);
        const maxSnap = Math.max(...snapValues);

        if (newY < minSnap) newY = minSnap;
        if (newY > maxSnap) newY = maxSnap;

        translateY.setValue(newY);
      },
      onPanResponderRelease: (_, g) => {
        const finalY = lastSnap.current + g.dy;

        const closest = snapValues.reduce((prev, curr) =>
          Math.abs(curr - finalY) < Math.abs(prev - finalY) ? curr : prev
        );

        lastSnap.current = closest;
        Animated.spring(translateY, {
          toValue: closest,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], backgroundColor: backgroundColor },
        style,
      ]}
    >
      {/* Handle zone (only draggable area) */}
      <View {...panResponder.panHandlers} style={styles.dragArea}>
        <View style={styles.handle} />
      </View>

      {/* Scrollable content */}
      <Animated.View style={[styles.scrollContainer, { height: animatedHeight }]}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {children}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT + 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dragArea: {
    paddingVertical: 15,
    marginBottom: 8,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  handle: {
    width: 60,
    height: 3,
    backgroundColor: "#ccc",
    borderRadius: 3,
  },
  scrollContainer: {
    flex: 1,
  },
});
