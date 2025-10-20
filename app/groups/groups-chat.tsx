import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput, 
  FlatList, 
  Platform,
  Image,
  SafeAreaView,
  Keyboard,
  Dimensions
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Group } from '@/services/groupsApiService';
import { useSession } from '@/context/SessionContext';
import { useSocket } from '@/context/SocketContext';
import { useMessages, Message } from '@/context/MessageContext';
import { LinearGradient } from 'expo-linear-gradient';


interface GroupChatProps {
  groupData: Group | null;
}

export default function GroupChat({
  groupData
}: GroupChatProps) {
  const { session } = useSession();
  const { socket, joinGroup, leaveGroup } = useSocket();
  const { getGroupMessages, addMessage, setCurrentGroup } = useMessages();
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  // Get messages for this group from global state
  const messages = groupData?.id ? getGroupMessages(groupData.id) : [];
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 GroupChat Debug:', {
      groupId: groupData?.id,
      messagesCount: messages.length,
      messages: messages,
      socketConnected: !!socket,
      userId: session?.user?.id
    });
  }, [messages, groupData?.id, socket, session?.user?.id]);

  // Add a test message when component mounts (for debugging)
  useEffect(() => {
    if (groupData?.id && messages.length === 0) {
      console.log('🧪 Adding test message for debugging...');
      setTimeout(() => {
        if (groupData?.id) {
          addMessage(groupData.id, {
            text: 'Test message - if you see this, the message system is working!',
            sender: 'System',
            senderId: 'system-test',
            avatar: undefined,
          });
        }
      }, 1000);
    }
  }, [groupData?.id, messages.length, addMessage]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Join/leave group when component mounts/unmounts
  useEffect(() => {
    if (!groupData?.id) return;

    // Join the group room
    joinGroup(groupData.id);
    
    // Set current group for read status
    setCurrentGroup(groupData.id);

    // Leave group when component unmounts
    return () => {
      if (groupData?.id) {
        leaveGroup(groupData.id);
      }
      setCurrentGroup(null);
    };
  }, [groupData?.id, joinGroup, leaveGroup, setCurrentGroup]);

  const handleSend = () => {
    if (message.trim() === '' || !groupData?.id) return;
    
    console.log('📤 Sending message:', {
      groupId: groupData.id,
      text: message,
      sender: `${session?.user?.fname} ${session?.user?.lname}` || 'You',
      senderId: session?.user?.id || '1',
      socketConnected: !!socket
    });
    
    // Add message using global context
    addMessage(groupData.id, {
      text: message,
      sender: `${session?.user?.fname} ${session?.user?.lname}` || 'You',
      senderId: session?.user?.id || '1',
      avatar: session?.user?.profileImage,
    });
    
    setMessage('');
    
    // Auto-scroll to bottom after new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.isCurrentUser;
    const member = groupData?.members.find(m => m.userID === item.senderId);
    const displayName = isCurrentUser ? 'You' : (member?.name || item.sender);
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
      ]}>
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image 
                source={{ uri: item.avatar }} 
                style={styles.avatarImage}
              />
            ) : (
              <ThemedIcons 
                library="MaterialIcons" 
                name="account-circle" 
                size={36} 
                color={secondaryColor} 
              />
            )}
          </View>
        )}
        
        <View>
            {!isCurrentUser && (
            <ThemedText style={styles.senderName} type="defaultSemiBold">
                {displayName}
            </ThemedText>
            )}
            <ThemedView shadow color='primary' style={[
            styles.messageBubble,
            isCurrentUser 
                ? { backgroundColor: accentColor, borderBottomRightRadius: 4 }
                : {  borderBottomLeftRadius: 4 }
            ]}>
            
            <ThemedText>
                {item.text}
            </ThemedText>
            
            </ThemedView>
            <ThemedText style={[
                styles.timestamp,
                { textAlign: isCurrentUser ? 'right' : 'left' }
            ]}>
                {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
        </View>
      </View>
    );
  };

  if (!groupData) return null;

  // Check approved members (same logic as groups-view.tsx)
  const approvedMembers = groupData.members.filter(m => m.isApproved);
  const isOnlyMember = approvedMembers.length === 1;

  return (
    <ThemedView style={[styles.container, { paddingBottom: keyboardHeight }]}>
          {/* Messages List */}
          {isOnlyMember ? (
            <View style={styles.emptyStateContainer}>
              <View style={{opacity: 0.5}}>
                <ThemedIcons library="MaterialIcons" name="person" size={48} color={textColor} />
              </View>
              <ThemedText style={[styles.emptyStateText, {color: textColor}]}>
                You are the only one in the group
              </ThemedText>
              <ThemedText style={[styles.emptyStateSubtext, {color: textColor}]}>
                Invite others to start chatting!
              </ThemedText>
            </View>
          ) : (
            <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            style={styles.messagesList}
            showsVerticalScrollIndicator={false}
            />
          )}

          {/* Message Input */}
          <LinearGradient
            colors={['transparent',primaryColor,primaryColor]}
            style={[styles.inputContainer, { bottom: keyboardHeight }]}
          >
            <TextInput
              style={[
              styles.input,
              { 
                  backgroundColor: backgroundColor,
                  color: textColor,
              }
              ]}
              placeholder="Type a message..."
              placeholderTextColor={textColor}
              
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <ThemedIcons 
              library="MaterialIcons" 
              name="send" 
              size={30} 
              color={message.trim() ? accentColor : '#ccc9'} 
              />
          </TouchableOpacity>
        </LinearGradient>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    marginBottom: 40
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  currentUserMessage: {
    justifyContent: 'flex-end',
  },
  otherUserMessage: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  senderName: {
    fontSize: 11,
    opacity: 0.5,
    marginBottom: 3,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 8,
    textAlign: 'right',
    opacity: 0.5,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    marginRight: 14,
    textAlignVertical: 'top',
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#ccc4'
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});
