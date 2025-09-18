import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_TYPES = {
  DEVICE: 'device' as const,
  LIGHT: 'light' as const,
  DARK: 'dark' as const
} as const;

export type ThemeType = typeof THEME_TYPES[keyof typeof THEME_TYPES];

const THEME_STORAGE_KEY = 'selectedTheme';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(THEME_TYPES.DEVICE);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load theme from AsyncStorage
  const loadTheme = async (): Promise<ThemeType> => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      return (savedTheme as ThemeType) || THEME_TYPES.DEVICE;
    } catch (error) {
      console.error('Error loading theme from AsyncStorage:', error);
      return THEME_TYPES.DEVICE;
    }
  };

  // Save theme to AsyncStorage
  const saveTheme = async (newTheme: ThemeType): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme to AsyncStorage:', error);
      throw error;
    }
  };

  // Animated theme change
  const setThemeAnimated = useCallback(async (newTheme: ThemeType, animationCallback?: () => void): Promise<void> => {
    if (isAnimating) return; // Prevent multiple simultaneous animations
    
    setIsAnimating(true);
    
    try {
      // Execute animation callback if provided
      if (animationCallback) {
        animationCallback();
      }
      
      // Small delay to allow animation to start
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Save the theme
      await saveTheme(newTheme);
      
      // Reset animation state after a delay
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    } catch (error) {
      setIsAnimating(false);
      throw error;
    }
  }, [isAnimating, saveTheme]);

  // Load initial theme on mount
  useEffect(() => {
    const initializeTheme = async () => {
      setIsLoading(true);
      const savedTheme = await loadTheme();
      setTheme(savedTheme);
      setIsLoading(false);
    };
    
    initializeTheme();
  }, []);

  // Listen for storage changes (for real-time updates across components)
  useEffect(() => {
    const checkForUpdates = async () => {
      const currentTheme = await loadTheme();
      setTheme(prevTheme => {
        if (prevTheme !== currentTheme) {
          return currentTheme;
        }
        return prevTheme;
      });
    };

    const interval = setInterval(checkForUpdates, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    theme,
    setTheme: saveTheme,
    setThemeAnimated,
    isLoading,
    isAnimating,
    THEME_TYPES
  };
};
