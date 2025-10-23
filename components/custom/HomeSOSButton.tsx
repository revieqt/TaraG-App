import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTracking } from '@/context/TrackingContext';
import { ThemedText } from '../ThemedText';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ThemedIcons from '../ThemedIcons';
import { useSession } from '@/context/SessionContext';
import { enableSafetyMode, disableSafetyMode } from "@/services/safetyApiService";
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';

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

const HomeSOSButton: React.FC = () => {
  const { isTracking } = useTracking();
  const borderAnim = useRef(new Animated.Value(0)).current;
  const { session, updateSession } = useSession();
  const accentColor = useThemeColor({}, 'accent');

  const [isLoading, setIsLoading] = useState(false);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string>('');
  const [message, setMessage] = useState('');
  
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSOSActive = session?.user?.safetyState?.isInAnEmergency || false;

  useEffect(() => {
    const loopAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }),
      ])
    );
    loopAnimation.start();
    return () => loopAnimation.stop();
  }, [borderAnim]);

  const handleLongPressStart = () => {
    setIsLongPressing(true);
    longPressTimer.current = setTimeout(() => {
      if (isSOSActive) {
        handleDisableSafetyMode();
      } else {
        setModalVisible(true);
      }
      setIsLongPressing(false);
    }, 2000);
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

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#660B05', '#E43636'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.wrapper}
        onPress={() => router.push('/safety/safety')}
        onLongPress={() => {}}
        onPressIn={handleLongPressStart}
        onPressOut={handleLongPressEnd}
        disabled={isLoading}
      >
        <Animated.View
          style={[
            styles.button,
            {
              borderColor: isSOSActive ? animatedBorderColor : '#fff',
              backgroundColor: isSOSActive ? 'rgba(210, 93, 93, .8)' : 'rgba(255, 255, 255, .9)',
            },
          ]}
        >
          <ThemedIcons 
            library='MaterialDesignIcons' 
            name='alert-circle'
            size={18} 
            color={isSOSActive ? "white" : "#666"} 
          />
          <ThemedText style={{
            color: isSOSActive ? '#fff' : '#666', 
            fontSize: 9
          }}>
            {isLongPressing ? (
              isSOSActive ? 'Hold to End...' : 'Hold to Start...'
            ) : (
              session?.user?.safetyState?.emergencyType 
                ? session.user.safetyState.emergencyType.charAt(0).toUpperCase() + session.user.safetyState.emergencyType.slice(1)
                : isSOSActive ? 'SOS Active' : 'SOS'
            )}
          </ThemedText>
        </Animated.View>
      </TouchableOpacity>

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
  );
};

export default HomeSOSButton;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 4,
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
});
