import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedIcons from '@/components/ThemedIcons';

interface RoundedButtonProps {
  size?: number;
  color?: string;
  iconLibrary?:  'MaterialIcons' | 'MaterialCommunityIcons' | 'MaterialDesignIcons';
  iconName: string;
  iconSize?: number;
  iconColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

const RoundedButton: React.FC<RoundedButtonProps> = ({
  size = 50,
  color,
  iconLibrary = 'MaterialIcons',
  iconName,
  iconSize = 30,
  iconColor,
  onPress,
  style,
}) => {
  const secondaryColor = useThemeColor({}, 'secondary');
  const buttonColor = color || secondaryColor;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: size,
          height: size,
          backgroundColor: buttonColor,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ThemedIcons
        library={iconLibrary}
        name={iconName}
        size={iconSize}
        color={iconColor}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.84,
    elevation: 5,
    marginBottom: 5,
  },
});

export default RoundedButton; 