import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug utility to clear all stored session data
export const clearStoredSession = async () => {
  try {
    await AsyncStorage.removeItem('session');
    console.log('🗑️ Debug: Cleared stored session data');
    return true;
  } catch (error) {
    console.error('❌ Debug: Failed to clear session:', error);
    return false;
  }
};

// Debug utility to check what's stored in session
export const checkStoredSession = async () => {
  try {
    const stored = await AsyncStorage.getItem('session');
    console.log('🔍 Debug: Current stored session:', stored);
    return stored;
  } catch (error) {
    console.error('❌ Debug: Failed to check session:', error);
    return null;
  }
};
