import { BACKEND_URL } from "@/constants/Config";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Batch update user information
export async function batchUpdateUserInfo(
  userID: string,
  updates: Record<string, string>,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/user/batch-update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      userID,
      updates,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to update user information';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch (parseError) {
      // If response is not JSON (likely HTML error page), use status text
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Save the last update date to AsyncStorage
  const currentDate = new Date().toISOString();
  await AsyncStorage.setItem(`lastUpdateInfo_${userID}`, currentDate);
}

// Check if user can update information (14-day cooldown)
export async function canUpdateUserInfo(userID: string): Promise<{
  canUpdate: boolean;
  nextUpdateDate?: Date;
  daysRemaining?: number;
}> {
  try {
    const lastUpdateStr = await AsyncStorage.getItem(`lastUpdateInfo_${userID}`);
    
    if (!lastUpdateStr) {
      return { canUpdate: true };
    }

    const lastUpdateDate = new Date(lastUpdateStr);
    const currentDate = new Date();
    const daysSinceUpdate = Math.floor((currentDate.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpdate >= 14) {
      return { canUpdate: true };
    }

    const nextUpdateDate = new Date(lastUpdateDate);
    nextUpdateDate.setDate(nextUpdateDate.getDate() + 14);
    const daysRemaining = 14 - daysSinceUpdate;

    return {
      canUpdate: false,
      nextUpdateDate,
      daysRemaining
    };
  } catch (error) {
    // If there's an error reading from AsyncStorage, allow update
    return { canUpdate: true };
  }
}

// Update user string field via backend API
export async function updateUserStringField(
  userID: string, 
  fieldName: string, 
  fieldValue: string, 
  accessToken: string
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/user/update-string-field`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      userID,
      fieldName,
      fieldValue,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update user field');
  }
}

// Update user boolean field via backend API
export async function updateUserBooleanField(
  userID: string, 
  fieldName: string, 
  fieldValue: boolean, 
  accessToken: string
): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/user/update-boolean-field`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      userID,
      fieldName,
      fieldValue,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to update user field');
  }
}