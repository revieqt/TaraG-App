import { ThemedText } from '@/components/ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface OptionsProps {
  options?: React.ReactNode[];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

const Options: React.FC<OptionsProps> = ({ options = [], style, children }) => {
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const primaryColor = useThemeColor({}, 'primary');

  const handleOpen = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], // Slide up from 100px below
  });

  return (
    <View>
      <TouchableOpacity onPress={handleOpen} style={[styles.optionsButton, style]}>
        {children ? children : <Text style={styles.buttonText}>Options</Text>}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Animated.View style={[styles.menu, { backgroundColor: primaryColor, transform: [{ translateY }] }]}>
            {options.map((option, index) => (
              <View key={index} style={styles.menuItem}>
                {option}
              </View>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  optionsButton: {
    padding: 0,
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menu: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 15

  },
  icon: {
    marginRight: 12,
  },
});

export default Options;