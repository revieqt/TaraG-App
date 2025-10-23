import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';
import { ThemedIcons } from '../ThemedIcons';
import TextField from '../TextField';
import ContactNumberField from '../ContactNumberField';
import Button from '../Button';

interface InputModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (value: string | { areaCode: string; number: string }) => void;
  label: string;
  description?: string;
  type: 'text' | 'contactNumber';
  initialValue?: string;
  placeholder?: string;
}

const InputModal: React.FC<InputModalProps> = ({
  visible,
  onClose,
  onSubmit,
  label,
  description,
  type,
  initialValue = '',
  placeholder = ''
}) => {
  const [textValue, setTextValue] = useState(initialValue);
  const [areaCode, setAreaCode] = useState('63+');
  const [contactNumber, setContactNumber] = useState('');

  const handleSubmit = () => {
    if (type === 'text') {
      if (!textValue.trim()) {
        Alert.alert('Error', 'Please enter a value');
        return;
      }
      onSubmit(textValue.trim());
    } else if (type === 'contactNumber') {
      if (!contactNumber.trim()) {
        Alert.alert('Error', 'Please enter a contact number');
        return;
      }
      onSubmit({ areaCode, number: contactNumber });
    }
    
    // Reset values
    setTextValue('');
    setContactNumber('');
    setAreaCode('63+');
    onClose();
  };

  const handleClose = () => {
    // Reset values
    setTextValue('');
    setContactNumber('');
    setAreaCode('63+');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <ThemedView shadow style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle" style={{flex: 1}}>
              {label}
            </ThemedText>
            <TouchableOpacity onPress={handleClose}>
              <ThemedIcons library="MaterialIcons" name="close" size={24} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          {description && (
            <ThemedText style={{opacity: .5, marginBottom: 20}}>
              {description}
            </ThemedText>
          )}

          {/* Input Field */}
          <View>
            {type === 'text' ? (
              <TextField
                placeholder={placeholder || `Enter ${label.toLowerCase()}`}
                value={textValue}
                onChangeText={setTextValue}
                autoCapitalize="words"
              />
            ) : (
              <ContactNumberField
                areaCode={areaCode}
                onAreaCodeChange={setAreaCode}
                number={contactNumber}
                onNumberChange={setContactNumber}
                placeholder={placeholder || "Contact Number"}
              />
            )}
          </View>
          <View>
            <Button
              title="Continue"
              onPress={handleSubmit}
              type="primary"
            />
          </View>
          
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    borderRadius: 15,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default InputModal;