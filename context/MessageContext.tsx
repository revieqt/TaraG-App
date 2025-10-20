import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSocket } from './SocketContext';
import { useSession } from './SessionContext';

export interface Message {
  id: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: Date;
  isCurrentUser: boolean;
  avatar?: string;
  groupId: string;
}

interface GroupMessages {
  [groupId: string]: Message[];
}

interface MessageContextType {
  messages: GroupMessages;
  unreadCounts: { [groupId: string]: number };
  addMessage: (groupId: string, message: Omit<Message, 'id' | 'timestamp' | 'isCurrentUser' | 'groupId'>) => void;
  markGroupAsRead: (groupId: string) => void;
  getGroupMessages: (groupId: string) => Message[];
  getUnreadCount: (groupId: string) => number;
  clearGroupMessages: (groupId: string) => void;
  lastMessage: Message | null;
  setCurrentGroup: (groupId: string | null) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: React.ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { socket } = useSocket();
  const { session } = useSession();
  const [messages, setMessages] = useState<GroupMessages>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [groupId: string]: number }>({});
  const [lastMessage, setLastMessage] = useState<Message | null>(null);
  const currentGroupRef = useRef<string | null>(null);
  const previousUserIdRef = useRef<string | null>(null);

  // Set current group for read status tracking
  const setCurrentGroup = (groupId: string | null) => {
    currentGroupRef.current = groupId;
    if (groupId) {
      markGroupAsRead(groupId);
    }
  };

  // Clear message state when user changes
  useEffect(() => {
    const currentUserId = session?.user?.id;
    
    // If user changed (and it's not just initial load)
    if (previousUserIdRef.current && previousUserIdRef.current !== currentUserId) {
      console.log('👤 User changed from', previousUserIdRef.current, 'to', currentUserId, '- clearing message state');
      setMessages({});
      setUnreadCounts({});
      setLastMessage(null);
      setCurrentGroup(null);
    }
    
    // Update the previous user ID
    previousUserIdRef.current = currentUserId || null;
  }, [session?.user?.id]);

  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    // Listen for incoming messages
    const handleNewMessage = (messageData: any) => {
      console.log('📨 New message received from socket:', messageData);
      
      const newMessage: Message = {
        id: `${messageData.timestamp}-${messageData.userId}`,
        text: messageData.text,
        sender: messageData.userName,
        senderId: messageData.userId,
        timestamp: new Date(messageData.timestamp),
        isCurrentUser: messageData.userId === session?.user?.id,
        avatar: messageData.profileImage,
        groupId: messageData.groupId
      };

      // Add message to state
      setMessages(prev => ({
        ...prev,
        [messageData.groupId]: [...(prev[messageData.groupId] || []), newMessage]
      }));

      // Update unread count if not in current group and not from current user
      if (messageData.groupId !== currentGroupRef.current && messageData.userId !== session?.user?.id) {
        setUnreadCounts(prev => ({
          ...prev,
          [messageData.groupId]: (prev[messageData.groupId] || 0) + 1
        }));
      }

      // Set as last message for popup
      if (messageData.userId !== session?.user?.id) {
        setLastMessage(newMessage);
        
        // Clear last message after 5 seconds
        setTimeout(() => {
          setLastMessage(null);
        }, 5000);
      }
    };

    // Listen for location updates (existing functionality)
    const handleLocationUpdate = (locationData: any) => {
      console.log('📍 Location update received:', locationData);
      // This will be handled by GroupMap components
    };

    socket.on('new-message', handleNewMessage);
    socket.on('member-location-update', handleLocationUpdate);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('member-location-update', handleLocationUpdate);
    };
  }, [socket, session?.user?.id]);

  const addMessage = (groupId: string, messageData: Omit<Message, 'id' | 'timestamp' | 'isCurrentUser' | 'groupId'>) => {
    console.log('💬 MessageContext addMessage called:', { groupId, messageData, socketConnected: !!socket });
    
    const newMessage: Message = {
      id: `${Date.now()}-${session?.user?.id}`,
      timestamp: new Date(),
      isCurrentUser: true,
      groupId,
      ...messageData
    };

    console.log('💬 Created new message:', newMessage);

    // Add to local state immediately
    setMessages(prev => {
      const updated = {
        ...prev,
        [groupId]: [...(prev[groupId] || []), newMessage]
      };
      console.log('💬 Updated messages state:', updated);
      return updated;
    });

    // Send via socket
    if (socket) {
      const socketData = {
        groupId,
        text: messageData.text,
        userId: session?.user?.id,
        userName: messageData.sender,
        profileImage: messageData.avatar,
        timestamp: Date.now()
      };
      console.log('📡 Emitting socket message:', socketData);
      socket.emit('send-message', socketData);
    } else {
      console.log('❌ No socket connection available');
    }
  };

  const markGroupAsRead = (groupId: string) => {
    setUnreadCounts(prev => ({
      ...prev,
      [groupId]: 0
    }));
  };

  const getGroupMessages = (groupId: string): Message[] => {
    const groupMessages = messages[groupId] || [];
    
    // Re-evaluate isCurrentUser for all messages to handle user switches
    return groupMessages.map(message => ({
      ...message,
      isCurrentUser: message.senderId === session?.user?.id
    }));
  };

  const getUnreadCount = (groupId: string): number => {
    return unreadCounts[groupId] || 0;
  };

  const clearGroupMessages = (groupId: string) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[groupId];
      return newMessages;
    });
    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[groupId];
      return newCounts;
    });
  };

  // Expose setCurrentGroup for components to use
  const value: MessageContextType = {
    messages,
    unreadCounts,
    addMessage,
    markGroupAsRead,
    getGroupMessages,
    getUnreadCount,
    clearGroupMessages,
    lastMessage,
    setCurrentGroup
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
