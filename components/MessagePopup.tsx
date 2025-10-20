import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import ThemedIcons from './ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useMessages, Message } from '@/context/MessageContext';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MessagePopup() {
  const { lastMessage } = useMessages();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<Message | null>(null);
  const slideAnim = useState(new Animated.Value(-100))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');

  useEffect(() => {
    if (lastMessage && !isVisible) {
      setCurrentMessage(lastMessage);
      setIsVisible(true);
      
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        hidePopup();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [lastMessage]);

  const hidePopup = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      setCurrentMessage(null);
    });
  };

  const handlePress = () => {
    if (currentMessage) {
      hidePopup();
      // Navigate to group chat
      router.push({
        pathname: '/groups/groups-view',
        params: { groupID: currentMessage.groupId }
      });
    }
  };

  if (!isVisible || !currentMessage) return null;

  const truncatedMessage = currentMessage.text.length > 50 
    ? currentMessage.text.substring(0, 50) + '...' 
    : currentMessage.text;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        }
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <ThemedView 
          shadow 
          color="primary" 
          style={[styles.popup, { borderLeftColor: accentColor }]}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                {currentMessage.avatar ? (
                  <Image 
                    source={{ uri: currentMessage.avatar }} 
                    style={styles.avatar}
                  />
                ) : (
                  <ThemedIcons 
                    library="MaterialIcons" 
                    name="account-circle" 
                    size={32} 
                    color={textColor} 
                  />
                )}
              </View>
              <View style={styles.messageInfo}>
                <ThemedText style={styles.senderName} type="defaultSemiBold">
                  {currentMessage.sender}
                </ThemedText>
                <ThemedText style={styles.messageText}>
                  {truncatedMessage}
                </ThemedText>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity onPress={hidePopup} style={styles.closeButton}>
                <ThemedIcons 
                  library="MaterialIcons" 
                  name="close" 
                  size={20} 
                  color={textColor} 
                />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.footer}>
            <ThemedIcons 
              library="MaterialIcons" 
              name="chat" 
              size={14} 
              color={accentColor} 
            />
            <ThemedText style={[styles.tapToReply, { color: accentColor }]}>
              Tap to reply
            </ThemedText>
          </View>
        </ThemedView>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  touchable: {
    width: '100%',
  },
  popup: {
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  messageInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    opacity: 0.8,
    lineHeight: 18,
  },
  actions: {
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffffff20',
  },
  tapToReply: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
});
