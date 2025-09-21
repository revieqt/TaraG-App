import { useColorScheme as _useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { useTheme } from '../context/ThemeContext';

export function useColorScheme() {
  return _useColorScheme();
}

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { theme: selectedTheme, isLoading } = useTheme();
  const deviceTheme = useColorScheme() ?? 'light';
  
  // Determine which theme to use
  let theme: 'light' | 'dark';
  if (selectedTheme === 'device') {
    theme = deviceTheme;
  } else {
    theme = selectedTheme as 'light' | 'dark';
  }
  
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}