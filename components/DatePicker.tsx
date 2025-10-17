import { useThemeColor } from '@/hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface DatePickerProps {
  placeholder: string;
  value: Date | null;
  onChange: (date: Date) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: any; // <-- add this
}

const DatePicker: React.FC<DatePickerProps> = ({
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  isFocused: isFocusedProp,
  minimumDate,
  maximumDate,
  style, // <-- add this
}) => {
  const backgroundColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');

  const [showPicker, setShowPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const focused = isFocusedProp !== undefined ? isFocusedProp : isFocused;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
    setShowPicker(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    handleBlur();
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.inputWrapper,
        { backgroundColor },
        { borderColor: focused ? '#ccc' : '#ccc4', borderWidth: 1 },
        style, // <-- apply custom style
      ]}
      onPress={handleFocus}
      activeOpacity={0.7}
    >
      <TextInput
        value={value ? value.toISOString().slice(0, 10) : ''}
        style={[
          styles.input,
          { color: textColor, textAlignVertical: 'center', paddingTop: 0, paddingBottom: 0 },
        ]}
        placeholder={placeholder}
        placeholderTextColor={useThemeColor({ light: '#aaa', dark: '#888' }, 'icon')}
        editable={false}
        onFocus={handleFocus}
        onBlur={handleBlur}
        pointerEvents="none"
      />
      <View
        style={styles.iconButton}
      >
        <Ionicons name="calendar" size={20} color={useThemeColor({ light: '#888', dark: '#aaa' }, 'icon')} />
      </View>
      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingTop: 4,
    paddingRight: 16,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    position: 'relative',
    minHeight: 48,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: 48,
    backgroundColor: 'transparent',
    fontFamily: 'Poppins',
  },
  iconButton: {
    marginLeft: 10,
  },
});

export default DatePicker;