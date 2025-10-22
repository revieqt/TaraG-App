import { router } from 'expo-router';
import React from 'react';
import { StyleProp, TouchableOpacity, ViewStyle } from 'react-native';
import { ThemedIcons } from '../ThemedIcons';

interface BackButtonProps {
  style?: StyleProp<ViewStyle>;
  type?: 'default' | 'floating' | 'close' | 'close-floating';
  color?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ style, type = 'default', color }) => {
  const handlePress = () => {
    try {
      router.back();
    } catch {
      router.replace('/(tabs)/home');
    }
  };

  if (type === 'floating') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[{ position: 'absolute', top: 16, left: 13, zIndex: 1000, padding: 8}, style]}
        activeOpacity={0.7}
      >
        <ThemedIcons library="MaterialIcons" name="arrow-back" size={20} color={color}/>
      </TouchableOpacity>
    );
  }

  if (type === 'close') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[{ padding: 8}, style]}
        activeOpacity={0.7}
      >
        <ThemedIcons library="MaterialIcons" name="close" size={20} color={color}/>
      </TouchableOpacity>
    );
  }

  if (type === 'close-floating') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[{ position: 'absolute', top: 16, right: 13, zIndex: 1000, padding: 8}, style]}
        activeOpacity={0.7}
      >
        <ThemedIcons library="MaterialIcons" name="close" size={20} color={color}/>
      </TouchableOpacity>
    );
  }

  // default
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{ padding: 8, backgroundColor: 'transparent' }, style]}
      activeOpacity={0.7}
    >
      <ThemedIcons library="MaterialIcons" name="arrow-back" size={20} color={color} />
    </TouchableOpacity>
  );
};

export default BackButton;
