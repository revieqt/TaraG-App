import { useThemeColor } from '@/hooks/useThemeColor';
import { default as MaterialCommunityIcons, default as MaterialDesignIcons } from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';

type IconLibrary =
  | 'MaterialIcons'
  | 'MaterialCommunityIcons'
  | 'MaterialDesignIcons';

type ThemedIconsProps = {
  library: IconLibrary;
  name: any;
  color?: string;
  size: number;
};

const iconLibraries = {
  MaterialIcons,
  MaterialCommunityIcons,
  MaterialDesignIcons,
};

export const ThemedIcons: React.FC<ThemedIconsProps> = ({
  library,
  name,
  color,
  size,
}) => {
  const iconColor = useThemeColor(
    { light: undefined, dark: undefined },
    'icon'
  );

  const IconComponent = iconLibraries[library];

  return (
    <IconComponent
      name={name}
      size={size}
      color={color ?? iconColor}
    />
  );
};

export default ThemedIcons;