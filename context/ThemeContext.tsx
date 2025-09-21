import React, { createContext, useContext, ReactNode } from 'react';
import { useTheme as useThemeHook, ThemeType, THEME_TYPES } from '../hooks/useTheme';

type ThemeContextType = {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => Promise<void>;
  setThemeAnimated: (theme: ThemeType, animationCallback?: () => void) => Promise<void>;
  isLoading: boolean;
  isAnimating: boolean;
  THEME_TYPES: typeof THEME_TYPES;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const themeData = useThemeHook();

  return (
    <ThemeContext.Provider value={themeData}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
