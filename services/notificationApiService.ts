import axios from 'axios';
import {BACKEND_URL} from '@/constants/Config'

const API_BASE_URL = `${BACKEND_URL}/notifications`;

export type Notification = {
  id: string;
  note: string;
  notifiedOn?: { seconds: number };
  state?: string;
  action?: string;
};

export async function getNotifications(userId: string): Promise<Notification[]> {
  try {
    console.log('Fetching notifications from:', `${API_BASE_URL}/${userId}`);
    const response = await axios.get(`${API_BASE_URL}/${userId}`);
    console.log('Response:', response.data);
    return response.data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
}

export async function changeNotificationToRead(notificationId: string): Promise<void> {
  try {
    await axios.put(`${API_BASE_URL}/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function createNotification(notificationData: {
  userID: string;
  note: string;
  state?: string;
  action?: string;
}): Promise<string> {
  try {
    const response = await axios.post(`${API_BASE_URL}/`, notificationData);
    return response.data.notificationId;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
} 