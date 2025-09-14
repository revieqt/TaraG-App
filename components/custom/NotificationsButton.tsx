import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedView } from '@/components/ThemedView';
// import { hasUnreadNotifications } from '@/services/authApiService';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

interface NotificationsButtonProps {
  userId?: string;
  style?: ViewStyle | ViewStyle[];
}

const NotificationsButton: React.FC<NotificationsButtonProps> = ({ userId, style }) => {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // if (!userId) return setHasUnread(false);
    // hasUnreadNotifications(userId).then(setHasUnread);
  }, [userId]);

  return (
    <TouchableOpacity
      onPress={() => router.push('/account/notifications')}
      activeOpacity={0.8}
    >
      <ThemedView roundness={16} style={[styles.button, style]}>
        <ThemedIcons library="MaterialIcons" name="notifications" size={24} />
      {hasUnread && <View style={styles.redPatch} pointerEvents="none" />}
      </ThemedView>
      
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    elevation: 2,
  },
  redPatch: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 99,
  },
});

export default NotificationsButton;
