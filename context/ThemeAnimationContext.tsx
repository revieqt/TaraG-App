import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { Animated } from 'react-native';

interface ThemeAnimationContextType {
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  animateThemeChange: (callback: () => void) => void;
}

const ThemeAnimationContext = createContext<ThemeAnimationContextType | undefined>(undefined);

export const ThemeAnimationProvider = ({ children }: { children: ReactNode }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateThemeChange = (callback: () => void) => {
    // First, fade out and scale down
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Execute the theme change callback
      callback();
      
      // Then fade back in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  return (
    <ThemeAnimationContext.Provider value={{ fadeAnim, scaleAnim, animateThemeChange }}>
      {children}
    </ThemeAnimationContext.Provider>
  );
};

export const useThemeAnimation = () => {
  const context = useContext(ThemeAnimationContext);
  if (context === undefined) {
    throw new Error('useThemeAnimation must be used within a ThemeAnimationProvider');
  }
  return context;
};
