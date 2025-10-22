import { refreshAccessToken } from '@/services/authApiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 Helper function to decode JWT
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 60; // 1 minute buffer before expiration
  
  return decoded.exp < (currentTime + bufferTime);
};

// 🔄 API interceptor that handles token refresh automatically
export const apiInterceptor = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // Get current session
    const sessionData = await AsyncStorage.getItem('session');
    if (!sessionData) {
      throw new Error('No session found');
    }

    const session = JSON.parse(sessionData);
    let { accessToken, refreshToken } = session;

    // Check if access token is expired
    if (!accessToken || isTokenExpired(accessToken)) {
      console.log('🔄 Access token expired, refreshing...');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      try {
        // Refresh the token
        const refreshResult = await refreshAccessToken(refreshToken);
        accessToken = refreshResult.accessToken;
        
        // Update session in AsyncStorage
        const updatedSession = {
          ...session,
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
        };
        
        await AsyncStorage.setItem('session', JSON.stringify(updatedSession));
        console.log('✅ Token refreshed successfully in API interceptor');
        
      } catch (refreshError) {
        console.error('❌ Token refresh failed in API interceptor:', refreshError);
        // Clear session if refresh fails
        await AsyncStorage.removeItem('session');
        throw new Error('Authentication failed - please login again');
      }
    }

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    };

    // Make the API call with fresh token
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get a 401, try to refresh token once more
    if (response.status === 401) {
      console.log('🔄 Got 401, attempting token refresh...');
      
      try {
        const refreshResult = await refreshAccessToken(refreshToken);
        
        // Update session
        const updatedSession = {
          ...session,
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
        };
        
        await AsyncStorage.setItem('session', JSON.stringify(updatedSession));
        
        // Retry the original request with new token
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${refreshResult.accessToken}`,
        };
        
        const retryResponse = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        
        return retryResponse;
        
      } catch (retryError) {
        console.error('❌ Retry token refresh failed:', retryError);
        await AsyncStorage.removeItem('session');
        throw new Error('Authentication failed - please login again');
      }
    }

    return response;
    
  } catch (error) {
    console.error('❌ API interceptor error:', error);
    throw error;
  }
};

// 🚀 Convenience wrapper for authenticated API calls
export const authenticatedFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  return apiInterceptor(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};

// 🔍 Get current valid access token (refreshes if needed)
export const getCurrentAccessToken = async (): Promise<string | null> => {
  try {
    const sessionData = await AsyncStorage.getItem('session');
    if (!sessionData) return null;

    const session = JSON.parse(sessionData);
    let { accessToken, refreshToken } = session;

    if (!accessToken) return null;

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      if (!refreshToken) return null;

      try {
        const refreshResult = await refreshAccessToken(refreshToken);
        
        // Update session
        const updatedSession = {
          ...session,
          accessToken: refreshResult.accessToken,
          refreshToken: refreshResult.refreshToken,
        };
        
        await AsyncStorage.setItem('session', JSON.stringify(updatedSession));
        return refreshResult.accessToken;
        
      } catch (error) {
        console.error('Token refresh failed:', error);
        await AsyncStorage.removeItem('session');
        return null;
      }
    }

    return accessToken;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};
