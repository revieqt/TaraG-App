import { useThemeColor } from '@/hooks/useThemeColor';
import React from 'react';
import { ActivityIndicator, StyleSheet, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedText } from './ThemedText';

interface ButtonProps {
  title: string;
  onPress: () => void;
  buttonStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  type?: 'outline' | 'primary';
  disabled?: boolean;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  buttonStyle,
  textStyle,
  type = 'outline',
  disabled = false,
  loading = false,
}) => {
  const outlineBgColor = useThemeColor({}, 'primary');
  const primaryBgColor = useThemeColor({}, 'secondary');

  const isPrimary = type === 'primary';

  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      style={[
        styles.outlineButton,
        {
          backgroundColor: isPrimary ? primaryBgColor : outlineBgColor,
        },
        buttonStyle,
        disabled ? { opacity: 0.5 } : null,
      ]}
      disabled={disabled || loading}
    >
      {isPrimary ? (
        <ThemedText style={[styles.primaryText, textStyle]}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : title}
        </ThemedText>
      ) : (
        <ThemedText style={[styles.outlineText, textStyle]}>
          {loading ? <ActivityIndicator size="small" color="#000" /> : title}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  outlineButton: {
    paddingVertical: 10,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: '#ccc4',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
    overflow: 'hidden',
  },
  outlineText: {
    opacity: 0.8,
    fontSize: 14,
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
    fontFamily: 'PoppinsSemiBold',
    textAlign: 'center',
  },
});

export default Button;