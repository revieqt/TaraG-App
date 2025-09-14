// components/Switch.tsx
import React from "react";
import { View, Switch as RNSwitch, StyleSheet } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemedText } from "./ThemedText";

type SwitchProps = {
  label?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const Switch: React.FC<SwitchProps> = ({ label, value, onValueChange }) => {
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const accentColor = useThemeColor({}, 'accent');
  return (
    <View style={styles.container}>
      {label && <ThemedText>{label}</ThemedText>}
      <RNSwitch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? secondaryColor : secondaryColor}
        trackColor={{ false: '#ccc', true: accentColor }}
      />
    </View>
  );
};

export default Switch;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: '100%',
  },
});
