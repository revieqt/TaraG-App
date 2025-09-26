import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, StyleSheet, View } from 'react-native';

interface LoadingModalProps {
  visible: boolean;
  success: boolean;
  successMessage?: string;
  errorMessage?: string;
  redirectTo?: any;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ visible, success, successMessage, errorMessage, redirectTo }) => {
  useEffect(() => {
    if (visible && success && redirectTo) {
      const timer = setTimeout(() => {
        router.push('/itineraries/itineraries');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, success, redirectTo]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <ThemedView style={styles.modalBox}>
          {!success && !errorMessage && (
            <>
              <ActivityIndicator size="large" color="#00CAFF" />
              <ThemedText style={styles.message}>Loading...</ThemedText>
            </>
          )}
          {success && (
            <>
              <ThemedText style={[styles.message, { color: '#008000' }]}>{successMessage || 'Success!'}</ThemedText>
            </>
          )}
          {errorMessage && !success && (
            <ThemedText style={[styles.message, { color: 'red' }]}>{errorMessage}</ThemedText>
          )}
        </ThemedView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 220,
    minHeight: 120,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  message: {
    marginTop: 18,
    fontSize: 17,
    textAlign: 'center',
  },
});

export default LoadingModal; 