import React, { useState, useRef, useEffect } from 'react';
import { 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  View, 
  TextInput, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  Image,
  SafeAreaView
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Group } from '@/services/groupsApiService';
import { useSession } from '@/context/SessionContext';

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
  visible: boolean;
  onClose: () => void;
  groupData: Group | null;
}

export default function GroupChat({ 
  visible, 
  onClose,
  groupData
}: GroupChatProps) {
  const { session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
    <ThemedView style={{flex: 1}}>
        {/* Header */}
        <ThemedView color='primary' style={styles.header}>
        <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ThemedIcons library="MaterialIcons" name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>
            <View>
            <ThemedText type="subtitle">
                {groupData.name}
            </ThemedText>
            <ThemedText style={styles.memberCount}>
                {groupData.members.filter(m => m.isApproved).length} members
            </ThemedText>
            </View>
        </View>
        </ThemedView>

        {/* Messages List */}
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

        {/* Message Input */}
        <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[styles.inputContainer, { backgroundColor: primaryColor}]}
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
            style={[
            styles.sendButton,
            { 
                backgroundColor: message.trim() ? accentColor : backgroundColor,
                opacity: message.trim() ? 1 : 0.7
            }
            ]}
            onPress={handleSend}
            disabled={!message.trim()}
        >
            <ThemedIcons 
            library="MaterialIcons" 
            name="send" 
            size={20} 
            color={message.trim() ? '#fff' : textColor} 
            />
        </TouchableOpacity>
        </KeyboardAvoidingView>
    </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 30,
    padding: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  memberCount: {
    opacity: 0.5,
  },
  messagesList: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
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
    fontSize: 16,
    marginRight: 12,
    textAlignVertical: 'top',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
