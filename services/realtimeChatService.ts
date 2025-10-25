import { BACKEND_URL } from '@/constants/Config';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: number;
  isCurrentUser?: boolean;
}

export interface ChatRoom {
  chatID: string;
  groupId: string;
  createdAt: number;
  createdBy: string;
  lastMessage?: {
    text: string;
    timestamp: number;
    senderId: string;
  };
}

class RealtimeChatService {
  // Create a new chat room via backend API
  async createChatRoom(id: string, accessToken: string, type: 'group' | 'tour' = 'group'): Promise<{ chatID: string; message: string }> {
    try {
      const endpoint = type === 'tour' ? 'tours/create-chat-room' : 'groups/create-chat-room';
      const bodyKey = type === 'tour' ? 'tourID' : 'groupID';
      
      console.log('🔍 Making request to:', `${BACKEND_URL}/${endpoint}`);
      console.log('🔍 Request body:', { [bodyKey]: id });
      
      const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ [bodyKey]: id })
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', response.headers);
      
      // Get response as text first to see what we're actually receiving
      const responseText = await response.text();
      console.log('🔍 Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ JSON parse error. Raw response:', responseText);
        throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`);
      }

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create chat room');
      }

      return result.data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  }

  // Send a message to Firebase RTDB via backend API
  async sendMessage(
    chatID: string, 
    message: Omit<ChatMessage, 'id' | 'timestamp'>, 
    accessToken: string
  ): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/groups/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          chatID,
          message
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Get messages from Firebase RTDB via backend API
  async getMessages(chatID: string, accessToken: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/groups/get-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ chatID })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to get messages');
      }

      return result.data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }
}

export const realtimeChatService = new RealtimeChatService();
