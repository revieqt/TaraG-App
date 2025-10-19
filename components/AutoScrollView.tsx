import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  ViewStyle,
} from "react-native";

interface AutoScrollViewProps {
  horizontal?: boolean;
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  speed: number; // ms per direction
}

export const AutoScrollView: React.FC<AutoScrollViewProps> = ({
  horizontal = false,
  vertical = true,
  style,
  children,
  speed,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const [maxScroll, setMaxScroll] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const [layoutSize, setLayoutSize] = useState(0);
  const [contentSize, setContentSize] = useState(0);

  // Detect content & layout sizes
  const onLayout = (e: any) => {
    const size = horizontal ? e.nativeEvent.layout.width : e.nativeEvent.layout.height;
    setLayoutSize(size);
  };

  const onContentSizeChange = (w: number, h: number) => {
    const size = horizontal ? w : h;
    setContentSize(size);
  };

  useEffect(() => {
    if (contentSize > layoutSize) {
      setMaxScroll(contentSize - layoutSize);
    } else {
      setMaxScroll(0);
    }
  }, [contentSize, layoutSize]);

  // Auto scroll animation
  useEffect(() => {
    if (!userInteracting && maxScroll > 0) {
      startAutoScroll();
    } else {
      animation.stopAnimation();
    }
    return () => animation.stopAnimation();
  }, [userInteracting, maxScroll, horizontal, vertical]);

  const startAutoScroll = () => {
    animation.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: speed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: speed,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    const listener = animation.addListener(({ value }) => {
      if (scrollRef.current && maxScroll > 0) {
        const pos = value * maxScroll;
        if (horizontal) {
          scrollRef.current.scrollTo({ x: pos, y: 0, animated: false });
        } else if (vertical) {
          scrollRef.current.scrollTo({ x: 0, y: pos, animated: false });
        }
      }
    });
    return () => animation.removeListener(listener);
  }, [horizontal, vertical, maxScroll]);

  const handleScrollBegin = (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setUserInteracting(true);
  };

  const handleScrollEnd = (_e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setUserInteracting(false);
  };

  return (
    <ScrollView
      ref={scrollRef}
      horizontal={horizontal}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      style={style}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      onScrollBeginDrag={handleScrollBegin}
      onScrollEndDrag={handleScrollEnd}
      contentContainerStyle={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {children}
    </ScrollView>
  );
};
