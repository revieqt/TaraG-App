import { useThemeColor } from '@/hooks/useThemeColor';
import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface ContactNumberFieldProps {
  areaCode: string;
  onAreaCodeChange: (code: string) => void;
  areaCodes?: Array<string | { label: string; value: string }>;
  number: string;
  onNumberChange: (num: string) => void;
  placeholder?: string;
  style?: any;
  disabled?: boolean;
}

const DEFAULT_AREA_CODES = [
  { label: '+63', value: '63+' },
  { label: '+1', value: '1+' },
  { label: '+44', value: '44+' },
  { label: '+91', value: '91+' },
  // Add more as needed
];

const ContactNumberField: React.FC<ContactNumberFieldProps> = ({
  areaCode,
  onAreaCodeChange,
  areaCodes = DEFAULT_AREA_CODES,
  number,
  onNumberChange,
  placeholder = 'Contact Number',
  style,
  disabled = false,
}) => {
  const backgroundColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDropdownFocused, setIsDropdownFocused] = useState(false);
  const isFocused = isInputFocused || isDropdownFocused;

  // Only allow up to 10 digits
  const handleNumberChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    onNumberChange(digits);
  };

  // Convert areaCodes to uniform {label, value} objects
  const options = areaCodes.map((v) =>
    typeof v === 'string' ? { label: v, value: v } : v
  );

  return (
    <View
      style={[
        styles.inputWrapper,
        { backgroundColor },
        { borderColor: isFocused ? '#ccc' : '#ccc4', borderWidth: 1 },
        style,
      ]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={() => setIsDropdownFocused(true)}
      onResponderRelease={() => setIsDropdownFocused(false)}
    >
      <View style={styles.leftPart}>
        <Picker
          selectedValue={areaCode}
          onValueChange={onAreaCodeChange}
          enabled={!disabled}
          style={[styles.picker, { color: textColor }]}
          dropdownIconColor={textColor}
        >
          {options.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={number}
        onChangeText={handleNumberChange}
        placeholder={placeholder}
        placeholderTextColor={useThemeColor({ light: '#aaa', dark: '#888' }, 'icon')}
        keyboardType="number-pad"
        maxLength={10}
        editable={!disabled}
        onFocus={() => setIsInputFocused(true)}
        onBlur={() => setIsInputFocused(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 7,
    paddingRight: 16,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    position: 'relative',
    minHeight: 48,
    height: 48,
    backgroundColor: 'transparent',
  },
  leftPart: {
    minWidth: 80,
    maxWidth: 100,
    height: 70,
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  picker: {
    flex: 1,
    fontSize: 14,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    fontFamily: 'Poppins',
  },
  input: {
    flex: 1,
    fontSize: 14,
    backgroundColor: 'transparent',
    paddingLeft: 8,
    fontFamily: 'Poppins',
  },
});

export default ContactNumberField; 