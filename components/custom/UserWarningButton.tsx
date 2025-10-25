import React, { useEffect, useRef, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { ThemedText } from '../ThemedText';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
  Modal,
} from 'react-native';
import ThemedIcons from '../ThemedIcons';
import { getModerationLog, ModerationLog } from '@/services/moderationApiService';
import { ModerationCard } from './ModerationCard';
import { ThemedView } from '../ThemedView';

const UserWarningButton: React.FC = () => {
  const { session } = useSession();
  const borderAnim = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [moderationLog, setModerationLog] = useState<ModerationLog | null>(null);
  const [loading, setLoading] = useState(false);

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

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fff', '#FF8800'],
  });

  const handlePress = async () => {
    if (!session?.user?.moderationLogID || !session?.accessToken) {
      console.error('No moderation log ID or access token');
      return;
    }

    setLoading(true);
    setModalVisible(true);

    try {
      const log = await getModerationLog(session.user.moderationLogID, session.accessToken);
      setModerationLog(log);
    } catch (error) {
      console.error('Error fetching moderation log:', error);
      setModalVisible(false);
    } finally {
      setLoading(false);
    }
  };

  // Only show if user is warned
  if (session?.user?.status !== 'warned') {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.wrapper} onPress={handlePress}>
          <Animated.View
            style={[
              styles.button,
              {
                borderColor: animatedBorderColor,
                backgroundColor: 'rgba(255, 136, 0, .8)',
              },
            ]}
          >
            <ThemedIcons 
              library='MaterialIcons' 
              name='warning' 
              size={18} 
              color="white" 
            />
            <ThemedText style={{ color: '#fff', fontSize: 9 }}>
              Warning
            </ThemedText>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <ThemedView style={{ flex: 1 }}>
          {loading ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ThemedText>Loading...</ThemedText>
            </View>
          ) : moderationLog ? (
            <ModerationCard moderationLog={moderationLog} />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ThemedText>Failed to load warning details</ThemedText>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}
          >
            <ThemedText style={{ color: '#fff', fontWeight: 'bold' }}>Close</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </Modal>
    </>
  );
};

export default UserWarningButton;

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
  closeButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FF8800',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 1000,
  },
});
