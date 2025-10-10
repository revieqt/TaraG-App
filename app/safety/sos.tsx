import React, { useState, useRef } from "react";
import { View, StyleSheet, Dimensions, Text, Modal, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from "react-native";
import TextField from '@/components/TextField';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import Button from '@/components/Button';
import SOSButton from "@/components/custom/SOSButton";
import { LinearGradient } from "expo-linear-gradient";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSession } from "@/context/SessionContext";
import { enableSafetyMode, disableSafetyMode } from "@/services/safetyApiService";
import { openDocument } from "@/utils/documentUtils";
import OptionsPopup from "@/components/OptionsPopup";

const emergencyTypes = [
  { id: 'medical', label: 'Medical Emergency', icon: 'medical-bag'},
  { id: 'criminal', label: 'Criminal Activity', icon: 'shield-alert'},
  { id: 'fire', label: 'Fire Emergency', icon: 'fire'},
  { id: 'natural', label: 'Natural Disasters', icon: 'weather-hurricane'},
  { id: 'utility', label: 'Utility Emergency', icon: 'flash-off'},
  { id: 'road', label: 'Road Emergency', icon: 'car'},
  { id: 'domestic', label: 'Domestic and Personal Safety', icon: 'home-alert'},
  { id: 'animal', label: 'Animal-Related Emergency', icon: 'paw'},
  { id: 'other', label: 'Other', icon: 'help-circle' },
];

export default function SOSSection(){
  const gradientColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const { session, updateSession } = useSession();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  
  // Get SOS state from session
  const isSOSActive = session?.user?.safetyState?.isInAnEmergency || false;
  const backgroundColor = isSOSActive ? 'red' : 'rgb(0, 101, 248)';

  const handleLongPressStart = () => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      if (isSOSActive) {
        // Disable safety mode
        handleDisableSafetyMode();
      } else {
        // Show modal to enable safety mode
        setModalVisible(true);
      }
      setIsLongPressing(false);
    }, 3000); // 3 seconds
  };

  const handleLongPressEnd = () => {
    setIsLongPressing(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleEnableSafetyMode = async () => {
    if (!selectedEmergencyType || !session?.accessToken || !session?.user) {
      Alert.alert('Error', 'Please select an emergency type');
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        accessToken: session.accessToken,
        userID: session.user.id,
        fname: session.user.fname,
        mname: session.user.mname,
        lname: session.user.lname,
        username: session.user.username,
        type: session.user.type,
        email: session.user.email,
        contactNumber: session.user.contactNumber
      };

      const updateSessionCallback = (safetyState: { isInAnEmergency: boolean; emergencyType: string; logID?: string }) => {
        if (session?.user) {
          updateSession({
            ...session,
            user: {
              ...session.user,
              safetyState
            }
          });
        }
      };

      await enableSafetyMode(
        { emergencyType: selectedEmergencyType, message },
        userData,
        updateSessionCallback
      );

      setModalVisible(false);
      setSelectedEmergencyType('');
      setMessage('');
      Alert.alert('Safety Mode Activated', 'Emergency services have been notified of your situation.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to activate safety mode');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableSafetyMode = async () => {
    if (!session?.accessToken || !session?.user?.safetyState?.logID) {
      Alert.alert('Error', 'No active safety log found');
      return;
    }

    setIsLoading(true);
    try {
      const updateSessionCallback = (safetyState: { isInAnEmergency: boolean; emergencyType: string; logID?: string }) => {
        if (session?.user) {
          updateSession({
            ...session,
            user: {
              ...session.user,
              safetyState
            }
          });
        }
      };

      await disableSafetyMode(
        session.accessToken,
        session.user.safetyState.logID,
        updateSessionCallback
      );

      Alert.alert('Safety Mode Deactivated', 'You are now safe. Emergency services have been notified.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to deactivate safety mode');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* <OptionsPopup 
      style={styles.optionsPopup}
      options={[
        <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8}}>
          <ThemedIcons library="MaterialIcons" name="delete" size={20}/>
          <ThemedText>Clear History</ThemedText>
        </TouchableOpacity>
      ]}> 
        <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22} color="#FFFFFF"/>
      </OptionsPopup> */}

      <View style={[styles.container, {backgroundColor: backgroundColor}]}>
        
        <View style={[styles.circle, {width: Dimensions.get('window').width+50}]}>
          <View style={styles.titleContainer}>
            {isSOSActive ? (
              <>
                <ThemedText type='title' style={{color: '#fff', fontSize: 25}}>SOS in Progress!</ThemedText>
                <ThemedText type='defaultSemiBold' style={{color: '#fff'}}>Safety Mode: On</ThemedText>
              </>
            ) : (
              <>
                <ThemedText type='title' style={{color: '#fff', fontSize: 25}}>All Clear!</ThemedText>
                <ThemedText type='defaultSemiBold' style={{color: '#fff'}}>Safety Mode: Off</ThemedText>
              </>
            )}
          </View>
          <View style={styles.circle}>
            <View style={styles.circle}>
              <SOSButton 
                state={isSOSActive ? 'active' : 'notActive'}
                onPressIn={handleLongPressStart}
                onPressOut={handleLongPressEnd}
                disabled={isLoading}
              />
            </View>
          </View>
          <View style={styles.subtitleContainer}>
            <Text style={{fontSize: 20}}>☝️</Text>
            {isLongPressing ? (
              <ThemedText style={{color: '#fff'}}>Hold for {isSOSActive ? 'deactivation' : 'activation'}...</ThemedText>
            ) : isSOSActive ? (
              <ThemedText style={{color: '#fff'}}>Long-press to End SOS</ThemedText>
            ) : (
              <ThemedText style={{color: '#fff'}}>Long-press to Activate SOS</ThemedText>
            )}
          </View>
        </View>
        
        <LinearGradient
          colors={['transparent', gradientColor]}
          style={styles.bottomGradient}
        >
          <TouchableOpacity onPress={() => openDocument('manual-sos-mobileApp')} style={styles.manual}>
            <ThemedText style={{opacity: .7, textDecorationLine: 'underline'}}>How does the SOS Work?</ThemedText>
          </TouchableOpacity>
        </LinearGradient>

        {/* Emergency Type Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <TouchableOpacity 
                style={styles.modalContent} 
                onPress={(e) => e.stopPropagation()}
                activeOpacity={1}
              >
              <ThemedView color='primary' style={styles.modalContentInner}>
                <ThemedText type="subtitle">Select Emergency Type</ThemedText>
              <ScrollView style={styles.emergencyTypesList} showsVerticalScrollIndicator={false}>
                {emergencyTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.emergencyTypeButton,
                      selectedEmergencyType === type.id && { backgroundColor: accentColor }
                    ]}
                    onPress={() => setSelectedEmergencyType(type.id)}
                  >
                    <ThemedIcons 
                      library="MaterialCommunityIcons" 
                      name={type.icon} 
                      size={20} 
                      color={selectedEmergencyType === type.id ? 'white' : undefined}
                    />
                    <ThemedText 
                      style={[
                        selectedEmergencyType === type.id && { color: 'white' }
                      ]}
                    >
                      {type.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.messageSection}>
                <ThemedText type="defaultSemiBold">Additional Message (Optional)</ThemedText>
                <TextField
                  placeholder="Describe your emergency situation..."
                  value={message}
                  onChangeText={setMessage}
                  multiline={true}
                  numberOfLines={3}
                  style={styles.messageInput}
                />
              </View>
                <Button
                  title={isLoading ? 'Activating...' : 'Activate SOS'}
                  onPress={handleEnableSafetyMode}
                  disabled={!selectedEmergencyType || isLoading}
                  type="primary"
                  buttonStyle={{marginTop: 10}}
                />
              </ThemedView>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </Modal>
      </View>
    </>
    
  );
};

const styles = StyleSheet.create({
  container:{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsPopup:{
    position: 'absolute',
    top: 20,
    right: 15,
    padding: 5,
    zIndex: 1000,
  },
  circle:{
    width: '100%',
    aspectRatio: 1,
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
    backgroundColor: 'rgba(255,255,255,.3)'
  },
  titleContainer:{
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 3,
  },
  subtitleContainer:{
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    opacity: .8
  },
  bottomGradient:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
  },
  modalContentInner: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingTop: 20,
  },
  emergencyTypesList: {
    maxHeight: 300,
    marginVertical: 20,
  },
  emergencyTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc4',
    gap: 15
  },
  messageSection: {
    marginBottom: 20,
    gap: 10,
  },
  messageInput: {
    minHeight: 80,
  },
  manual:{
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    opacity: .8
  }
});
