import React, { useState } from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import Button from './Button';

interface ToggleButtonProps {
  value: string;
  label: string;
  onToggle?: (value: string, isSelected: boolean) => void;
  buttonStyle?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
  disabled?: boolean;
  gradientColors?: readonly [string, string, ...string[]];
  initialSelected?: boolean;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({
  value,
  label,
  onToggle,
  buttonStyle,
  textStyle,
  disabled = false,
  gradientColors = ['#00CAFF', '#00FFDE'],
  initialSelected = false,
}) => {
  const [isSelected, setIsSelected] = useState(initialSelected);

  const handlePress = () => {
    if (disabled) return;
    
    const newSelectedState = !isSelected;
    setIsSelected(newSelectedState);
    onToggle?.(value, newSelectedState);
  };

  return (
    <Button
      title={label}
      onPress={handlePress}
      type={isSelected ? 'primary' : 'outline'}
      disabled={disabled}
      buttonStyle={buttonStyle}
      textStyle={textStyle}
    />
  );
};

export default ToggleButton; 