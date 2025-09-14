import { ThemedIcons } from '@/components/ThemedIcons';
import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';

interface WebViewModalProps {
  visible: boolean;
  onClose: () => void;
  uri: string;
}

const WebViewModal: React.FC<WebViewModalProps> = ({ visible, onClose, uri }) => (
  <Modal visible={visible} animationType="slide">
    <View style={{ flex: 1 }}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <ThemedIcons library='MaterialIcons' name='close' size={25} color='#fff'/>
      </TouchableOpacity>
      <RNWebView source={{ uri }} style={{ flex: 1 }} />
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 100,
    backgroundColor: '#0005',
    borderRadius: 50,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 5,
  },
});

export default WebViewModal;