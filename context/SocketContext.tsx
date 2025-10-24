import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '@/constants/Config';
import { useSession } from './SessionContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinGroup: (groupId: string) => void;
  leaveGroup: (groupId: string) => void;
  sendMessage: (groupId: string, message: any) => void;
  updateLocation: (groupId: string, locationData: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // If no user, disconnect any existing socket
    if (!session?.user?.id) {
      if (socketRef.current) {
        console.log('🔌 No user session, disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // If socket already exists for different user, disconnect it first
    if (socketRef.current) {
      console.log('🔌 User changed, disconnecting previous socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }

    console.log('🔌 Initializing Socket.IO connection for user:', session.user.id);
    
    // Socket.IO connects to base URL, not /api endpoint
    const socketUrl = BACKEND_URL.replace('/api', '');
    console.log('🔌 Socket URL:', socketUrl);
    
    // Create socket connection
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      forceNew: true, // Force new connection for user switch
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected for user:', session?.user?.id, 'Socket ID:', newSocket.id);
      setIsConnected(true);
      
      // Join user-specific room for notifications
      if (session?.user?.id) {
        newSocket.emit('join-user', session.user.id);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🔌 Socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount or user change
    return () => {
      console.log('🔌 Cleaning up socket connection for user:', session?.user?.id);
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [session?.user?.id]);

  const joinGroup = (groupId: string) => {
    if (socket && session?.user?.id) {
      console.log(`🏠 SocketContext: Emitting join-group for group: ${groupId}, user: ${session.user.id}`);
      console.log('🔌 Socket connected:', socket.connected, 'Socket ID:', socket.id);
      socket.emit('join-group', {
        groupId,
        userId: session.user.id
      });
    } else {
      console.log('❌ Cannot join group: socket or user missing', {
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        hasUser: !!session?.user?.id
      });
    }
  };

  const leaveGroup = (groupId: string) => {
    if (socket && session?.user?.id) {
    //   console.log(`🚪 Leaving group: ${groupId}`);
      socket.emit('leave-group', {
        groupId,
        userId: session.user.id
      });
    }
  };

  const sendMessage = (groupId: string, messageData: any) => {
    if (socket && session?.user?.id) {
      console.log(`💬 Sending message to group: ${groupId}`);
      socket.emit('send-message', {
        groupId,
        userId: session.user.id,
        userName: `${session.user.fname} ${session.user.lname}`,
        profileImage: session.user.profileImage,
        ...messageData,
        timestamp: Date.now()
      });
    }
  };

  const updateLocation = (groupId: string, locationData: any) => {
    if (socket && session?.user?.id) {
      const payload = {
        groupId,
        userId: session.user.id,
        userName: `${session.user.fname} ${session.user.lname}`,
        profileImage: session.user.profileImage,
        ...locationData,
        timestamp: Date.now()
      };
      console.log('📡 SocketContext: Emitting update-location event:', payload);
      console.log('🔌 Socket connected:', socket.connected, 'Socket ID:', socket.id);
      socket.emit('update-location', payload);
    } else {
      console.log('❌ Cannot emit location: socket or user missing', {
        hasSocket: !!socket,
        socketConnected: socket?.connected,
        hasUser: !!session?.user?.id
      });
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    joinGroup,
    leaveGroup,
    sendMessage,
    updateLocation,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
