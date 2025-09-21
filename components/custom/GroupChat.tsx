import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSession } from '@/context/SessionContext';

interface Message {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  profileImage?: string;
}

interface GroupChatProps {
  groupId: string;
}

export default function GroupChat({ groupId }: GroupChatProps) {
  const { session } = useSession();
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    // Mock messages for UI demonstration
    {
      id: '1',
      userId: 'user1',
      userName: 'John Doe',
      message: 'Hey everyone! Looking forward to our trip!',
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Jane Smith',
      message: 'Same here! The itinerary looks amazing 🎉',
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    },
    {
      id: '3',
      userId: session?.user?.id || 'currentUser',
      userName: session?.user?.fname + ' ' + session?.user?.lname || 'You',
      message: 'Can\'t wait! Should we meet at the airport?',
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim() && session?.user) {
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: session.user.id,
        userName: session.user.fname + ' ' + session.user.lname,
        message: message.trim(),
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessage('');
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isCurrentUser = (userId: string) => {
    return userId === session?.user?.id;
  };

  const renderMessage = (msg: Message) => {
    const isOwn = isCurrentUser(msg.userId);
    
    return (
      <View key={msg.id} style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
        <View style={[styles.messageBubble, { backgroundColor: isOwn ? accentColor : primaryColor }]}>
          {!isOwn && (
            <ThemedText style={[styles.userName, { color: textColor, opacity: 0.7 }]}>
              {msg.userName}
            </ThemedText>
          )}
          <ThemedText style={[styles.messageText, { color: isOwn ? '#fff' : textColor }]}>
            {msg.message}
          </ThemedText>
          <ThemedText style={[styles.timestamp, { color: isOwn ? '#fff' : textColor, opacity: 0.6 }]}>
            {formatTime(msg.timestamp)}
          </ThemedText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Messages List */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={{ opacity: 0.3 }}>
              <ThemedIcons library="MaterialIcons" name="chat-bubble-outline" size={48} color={textColor} />
            </View>
            <ThemedText style={[styles.emptyText, { color: textColor, opacity: 0.5 }]}>
              No messages yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: textColor, opacity: 0.3 }]}>
              Start the conversation!
            </ThemedText>
          </View>
        ) : (
          messages.map(renderMessage)
        )}
      </ScrollView>

      {/* Message Input */}
      <ThemedView style={[styles.inputContainer, { borderTopColor: primaryColor }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.textInput, { backgroundColor: primaryColor, color: textColor }]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={textColor + '80'}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, { backgroundColor: accentColor }]}
            onPress={handleSendMessage}
            disabled={!message.trim()}
          >
            <ThemedIcons 
              library="MaterialIcons" 
              name="send" 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
  },
  messageContainer: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
    minWidth: 60,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});