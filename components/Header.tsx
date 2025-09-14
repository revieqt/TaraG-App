import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import BackButton from './custom/BackButton';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

interface HeaderProps {
  label?: string;
  style?: StyleProp<ViewStyle>;
  rightButton?: React.ReactNode;
  leftButton?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({ label, style, rightButton, leftButton }) => {
  if (leftButton) {
    return (
      <ThemedView color='primary' style={[styles.container, style]}>
        {leftButton}
        <View style={{ flex: 1 }} />
        {rightButton}
      </ThemedView>
    );
  } else {
    return (
      <ThemedView color='primary' style={[styles.container, style]}>
        <BackButton />
        {label && <ThemedText type='subtitle' style={[styles.label, { flex: 1 }]}>{label}</ThemedText>}
        {rightButton}
      </ThemedView>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // ensure rightButton is at the end
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  label: {
    marginLeft: 12,
  },
});

export default Header;