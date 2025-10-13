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
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  isCurrentUser: boolean;
  avatar?: string;
}

interface GroupChatProps {
  groupData: Group | null;
}

export default function GroupChat({
  groupData
}: GroupChatProps) {
  const { session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

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

  // Mock data for demonstration
  useEffect(() => {
    if (!groupData) return;
    
    const mockMessages: Message[] = [
      {
        id: '1',
        text: `Welcome to the ${groupData.name} chat!`,
        sender: 'System',
        senderId: 'system',
        timestamp: new Date(Date.now() - 3600000),
        isCurrentUser: false,
      },
      {
        id: '2',
        text: 'Thanks! Excited to be here!',
        sender: 'John Doe',
        senderId: '2',
        timestamp: new Date(Date.now() - 1800000),
        isCurrentUser: false,
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      },
      {
        id: '3',
        text: 'Hey everyone! 👋',
        sender: 'You',
        senderId: session?.user?.id || '1',
        timestamp: new Date(),
        isCurrentUser: true,
        avatar: session?.user?.profileImage,
      },
    ];
    setMessages(mockMessages);
  }, [groupData, session]);

  const handleSend = () => {
    if (message.trim() === '' || !groupData) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: session?.user?.fname + ' ' + session?.user?.lname || 'You',
      senderId: session?.user?.id || '1',
      timestamp: new Date(),
      isCurrentUser: true,
      avatar: session?.user?.profileImage,
    };
    
    setMessages(prev => [...prev, newMessage]);
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
