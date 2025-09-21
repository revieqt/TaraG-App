import { useThemeColor } from '@/hooks/useThemeColor';
import { useTheme } from '@/context/ThemeContext';
import { type ViewProps, View } from 'react-native';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  color?: 'primary' | 'secondary' | 'accent';
  shadow?: boolean;
  opacity?: number;
  roundness?: number;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  color,
  shadow,
  opacity,
  roundness,
  ...otherProps
}: ThemedViewProps) {
  const { isLoading } = useTheme();
  
  let colorKey:
    | 'background'
    | 'primary'
    | 'secondary'
    | 'accent' = 'background';

  if (color === 'primary') colorKey = 'primary';
  else if (color === 'secondary') colorKey = 'secondary';
  else if (color === 'accent') colorKey = 'accent';

  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, colorKey);

  // Soft shadow style
  let shadowStyle = {};
  if (shadow) {
    shadowStyle = {
      shadowColor: 'rgba(120,120,120,0.6)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 10,
    };
  }
  const roundnessStyle = typeof roundness === 'number' ? { borderRadius: roundness } : {};

  const viewOpacity = typeof opacity === 'number' ? opacity : 1;

  return (
    <View
      style={[
        {
          backgroundColor,
          opacity: viewOpacity,
        },
        shadowStyle,
        roundnessStyle,
        style,
      ]}
      {...otherProps}
    />
  );
}