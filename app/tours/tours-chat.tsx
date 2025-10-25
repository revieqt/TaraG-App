import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput, 
  FlatList, 
  Platform,
  Image,
  Keyboard
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionContext';
import { LinearGradient } from 'expo-linear-gradient';
import { realtimeChatService, ChatMessage } from '@/services/realtimeChatService';
import Button from '@/components/Button';

interface TourChatProps {
  tourData: any;
}

interface ExtendedChatMessage extends ChatMessage {
  isCurrentUser?: boolean;
}

export default function TourChat({ tourData }: TourChatProps) {
  const { session } = useSession();
  const [message, setMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
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

  // Function to create chat room
  const handleCreateChat = async () => {
    if (!tourData?.tourID || !session?.accessToken) return;

    setIsCreatingChat(true);
    try {
      const result = await realtimeChatService.createChatRoom(tourData.tourID, session.accessToken, 'tour');
      console.log('✅ Chat room created:', result);
      
      // Update the tour data with the new chatID
      if (tourData) {
        tourData.chatID = result.chatID;
      }
    } catch (error) {
      console.error('❌ Error creating chat room:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Load messages when chat room exists
  const loadMessages = async () => {
    if (!tourData?.chatID || !session?.accessToken) return;

    setIsLoadingMessages(true);
    try {
      const fetchedMessages = await realtimeChatService.getMessages(tourData.chatID, session.accessToken);
      setMessages(fetchedMessages.map(msg => ({
        ...msg,
        isCurrentUser: msg.senderId === session.user?.id
      })));
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load messages when component mounts and when chatID changes
  useEffect(() => {
    if (tourData?.chatID) {
      loadMessages();
    }
  }, [tourData?.chatID, session?.accessToken]);

  // Set up real-time message polling
  useEffect(() => {
    if (!tourData?.chatID || !session?.accessToken) return;

    const interval = setInterval(() => {
      loadMessages();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [tourData?.chatID, session?.accessToken]);

  const handleSend = async () => {
    if (message.trim() === '' || !tourData?.chatID || !session?.accessToken || !session?.user?.id) return;
    
    const messageToSend = {
      text: message.trim(),
      senderId: session.user.id,
      senderName: `${session.user.fname} ${session.user.lname}` || 'Unknown',
      senderAvatar: session.user.profileImage
    };

    try {
      console.log('📤 Sending message to Firebase RTDB:', messageToSend);
      
      await realtimeChatService.sendMessage(tourData.chatID, messageToSend, session.accessToken);
      
      setMessage('');
      
      // Immediately reload messages to show the new message
      await loadMessages();
      
      // Auto-scroll to bottom after new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };


  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isCurrentUser = item.isCurrentUser;
    const displayName = isCurrentUser ? 'You' : item.senderName;
    
    // Check if previous and next messages are from the same sender
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
    
    const isFirstInGroup = !prevMessage || prevMessage.senderId !== item.senderId;
    const isLastInGroup = !nextMessage || nextMessage.senderId !== item.senderId;
    const isMiddleInGroup = !isFirstInGroup && !isLastInGroup;
    
    // Show timestamp only if this message is selected
    const showTimestamp = selectedMessageId === item.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
        !isLastInGroup && styles.groupedMessage
      ]}>
        {!isCurrentUser && (
          <View style={styles.avatarContainer}>
            {isLastInGroup ? (
              item.senderAvatar ? (
                <Image 
                  source={{ uri: item.senderAvatar }} 
                  style={styles.avatarImage}
                />
              ) : (
                <ThemedIcons 
                  library="MaterialIcons" 
                  name="account-circle" 
                  size={36} 
                  color={secondaryColor} 
                />
              )
            ) : (
              <View style={{ width: 36 }} />
            )}
          </View>
        )}
        
        <View style={styles.messageContent}>
          {!isCurrentUser && isFirstInGroup && (
            <ThemedText style={styles.senderName} type="defaultSemiBold">
              {displayName}
            </ThemedText>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedMessageId(selectedMessageId === item.id ? null : item.id)}
          >
            <View style={[
              styles.messageBubble,
              isCurrentUser 
                ? [styles.currentUserBubble, { backgroundColor: accentColor }]
                : [styles.otherUserBubble, { backgroundColor: primaryColor }],
              isCurrentUser ? (
                isFirstInGroup && !isLastInGroup ? styles.currentUserBubbleFirst :
                isMiddleInGroup ? styles.currentUserBubbleMiddle :
                !isFirstInGroup && isLastInGroup ? styles.currentUserBubbleLast : {}
              ) : (
                isFirstInGroup && !isLastInGroup ? styles.otherUserBubbleFirst :
                isMiddleInGroup ? styles.otherUserBubbleMiddle :
                !isFirstInGroup && isLastInGroup ? styles.otherUserBubbleLast : {}
              )
            ]}>
              <ThemedText style={{ color: isCurrentUser ? '#FFFFFF' : textColor }}>
                {item.text}
              </ThemedText>
            </View>
          </TouchableOpacity>
          {showTimestamp && (
            <ThemedText style={[
              styles.timestamp,
              { textAlign: isCurrentUser ? 'right' : 'left' }
            ]}>
              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </ThemedText>
          )}
        </View>
      </View>
    );
  };

  if (!tourData) return null;

  // Check if there's a chat room
  const hasChatID = tourData.chatID && tourData.chatID.trim() !== '';

  return (
    <ThemedView style={[styles.container, { paddingBottom: keyboardHeight }]}>
    {/* Messages List */}
    {!hasChatID ? (
      <View style={styles.emptyStateContainer}>
        <View style={{opacity: 0.5}}>
          <ThemedIcons library="MaterialIcons" name="chat" size={48} color={textColor} />
        </View>
        <ThemedText style={[styles.emptyStateText, {color: textColor}]}>
          No chat room yet
        </ThemedText>
        <ThemedText style={[styles.emptyStateSubtext, {color: textColor}]}>
          Start a conversation with tour participants
        </ThemedText>
        <Button
          title={isCreatingChat ? "Creating..." : "Start Chat"}
          onPress={handleCreateChat}
          disabled={isCreatingChat}
          buttonStyle={{ marginTop: 20 }}
        />
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
      colors={['transparent', primaryColor, primaryColor]}
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
    paddingBottom: 40
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
    paddingHorizontal: 4,
  },
  groupedMessage: {
    marginBottom: 2,
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
  messageContent: {
    flex: 1,
    maxWidth: '85%',
  },
  messageBubble: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentUserBubble: {
    borderBottomRightRadius: 5,
    borderTopRightRadius: 5,
    alignSelf: 'flex-end',
  },
  otherUserBubble: {
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
    alignSelf: 'flex-start',
  },
  currentUserBubbleFirst: {
    borderBottomRightRadius: 5,
    borderTopRightRadius: 5,
  },
  currentUserBubbleMiddle: {
    borderBottomRightRadius: 5,
    borderTopRightRadius: 5,
  },
  currentUserBubbleLast: {
    borderBottomRightRadius: 5,
    borderTopRightRadius: 5,
  },
  otherUserBubbleFirst: {
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  otherUserBubbleMiddle: {
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  otherUserBubbleLast: {
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  senderName: {
    fontSize: 10,
    opacity: 0.5,
    marginLeft: 4,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 5,
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
