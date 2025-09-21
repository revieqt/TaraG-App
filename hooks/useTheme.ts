import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const THEME_TYPES = {
  DEVICE: 'device' as const,
  LIGHT: 'light' as const,
  DARK: 'dark' as const
} as const;

export type ThemeType = typeof THEME_TYPES[keyof typeof THEME_TYPES];

const THEME_STORAGE_KEY = 'selectedTheme';

// Simple in-memory cache to prevent flickering
let themeCache: ThemeType | null = null;
let isInitialized = false;

// Initialize theme cache early (can be called before any component renders)
export const initializeThemeCache = async (): Promise<void> => {
  if (isInitialized) return;
  
  try {
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    themeCache = (savedTheme as ThemeType) || THEME_TYPES.DEVICE;
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing theme cache:', error);
    themeCache = THEME_TYPES.DEVICE;
    isInitialized = true;
  }
};

// Clear theme cache (useful for debugging or manual cache clearing)
export const clearThemeCache = (): void => {
  themeCache = null;
  isInitialized = false;
};

// Try to load theme synchronously first
const getInitialTheme = (): ThemeType => {
  // Return cached theme if available
  if (themeCache) {
    return themeCache;
  }
  return THEME_TYPES.DEVICE; // Fallback to device theme for initial render
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>(getInitialTheme()); // Start with best guess
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  // Load theme from AsyncStorage
  const loadTheme = async (): Promise<ThemeType> => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const theme = (savedTheme as ThemeType) || THEME_TYPES.DEVICE;
      themeCache = theme; // Update cache
      return theme;
    } catch (error) {
      console.error('Error loading theme from AsyncStorage:', error);
      const fallback = THEME_TYPES.DEVICE;
      themeCache = fallback; // Update cache with fallback
      return fallback;
    }
  };

  // Save theme to AsyncStorage
  const saveTheme = async (newTheme: ThemeType): Promise<void> => {
    try {
      // Clear old cache first to ensure fresh state
      themeCache = null;
      
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      
      // Update cache with new theme
      themeCache = newTheme;
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
      // Clear cache immediately to prevent stale state
      themeCache = null;
      
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
  }, [isAnimating]);

  // Load initial theme on mount
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // If cache is already initialized, use it immediately
        if (isInitialized && themeCache) {
          setTheme(themeCache);
          setIsLoading(false);
          return;
        }
        
        // Otherwise load from storage
        const savedTheme = await loadTheme();
        setTheme(savedTheme);
      } catch (error) {
        console.error('Failed to initialize theme:', error);
        setTheme(THEME_TYPES.DEVICE); // Fallback to device theme
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeTheme();
  }, []);

  return {
    theme, // Theme is now always defined
    setTheme: saveTheme,
    setThemeAnimated,
    isLoading,
    isAnimating,
    THEME_TYPES
  };
};
