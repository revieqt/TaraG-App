import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputContentSizeChangeEventData, TextInputProps, View } from 'react-native';

interface TextFieldProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isFocused?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: any;
  onSubmitEditing?: TextInputProps['onSubmitEditing']; // <-- add this
  multiline?: boolean; // <-- add this
  numberOfLines?: number; // <-- add this
  onContentSizeChange?: (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => void;
}

const TextField: React.FC<TextFieldProps> = ({
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isFocused: isFocusedProp,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  onSubmitEditing, // <-- add this
  multiline, // <-- add this
  numberOfLines, // <-- add this
  onContentSizeChange,
}) => {
  // Use themed colors
  const backgroundColor = useThemeColor({}, 'primary');
  const textColor = useThemeColor({}, 'text');

  // Local focus state for border color
  const [isFocused, setIsFocused] = useState(false);
  const focused = isFocusedProp !== undefined ? isFocusedProp : isFocused;

  const handleFocus = () => {
    setIsFocused(true);
    onFocus && onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur && onBlur();
  };

  return (
    <View
      style={[
        styles.inputWrapper,
        { backgroundColor },
        { borderColor: focused ? '#ccc' : '#ccc4', borderWidth: 1 },
        style
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[
          styles.input,
          { color: textColor, textAlignVertical: 'center', paddingTop: 0, paddingBottom: 0 },
          style // <-- now applies custom styles from props
        ]}
        placeholder={placeholder}
        placeholderTextColor={useThemeColor({ light: '#aaa', dark: '#888' }, 'icon')}
        onFocus={handleFocus}
        onBlur={handleBlur}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        underlineColorAndroid="transparent"
        onSubmitEditing={onSubmitEditing} // <-- add this
        multiline={multiline} // <-- add this
        numberOfLines={numberOfLines} // <-- add this
        onContentSizeChange={onContentSizeChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 15,
    paddingTop: 4,
    marginBottom: 15,
    borderWidth: 1,
    position: 'relative',
    minHeight: 48,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    backgroundColor: 'transparent',
    fontFamily: 'Poppins',
  },
});

export default TextField;