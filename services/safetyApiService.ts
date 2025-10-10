import { BACKEND_URL } from '@/constants/Config';
import * as Location from 'expo-location';

interface EnableSafetyModeParams {
  emergencyType: string;
  message?: string;
}

interface EnableSafetyModeResponse {
  message: string;
  logID: string;
}

interface DisableSafetyModeResponse {
  message: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

interface UserData {
  accessToken: string;
  userID: string;
  fname: string;
  mname?: string;
  lname: string;
  username: string;
  type: string;
  email: string;
  contactNumber: string;
}

interface SessionUpdateCallback {
  (safetyState: { isInAnEmergency: boolean; emergencyType: string; logID?: string }): void;
}

// Helper function to get current location
const getCurrentLocation = async (): Promise<LocationData> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = location.coords;

    // Get address from coordinates
    const reverseGeocode = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    let locationName = 'Unknown location';
    if (reverseGeocode.length > 0) {
      const address = reverseGeocode[0];
      locationName = `${address.subregion || ''} ${address.city || ''}`.trim() || 'Unknown location';
    }

    return {
      latitude,
      longitude,
      locationName,
    };
  } catch (error) {
    throw new Error('Failed to get current location');
  }
};

export const enableSafetyMode = async (
  params: EnableSafetyModeParams,
  userData: UserData,
  updateSessionCallback: SessionUpdateCallback
): Promise<string> => {
  const { emergencyType, message } = params;
  
  try {
    // Get current location
    const locationData = await getCurrentLocation();
    
    const requestBody = {
      emergencyType,
      message: message || '',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      locationName: locationData.locationName,
      userID: userData.userID,
      fname: userData.fname,
      mname: userData.mname || '',
      lname: userData.lname,
      username: userData.username,
      type: userData.type,
      email: userData.email,
      contactNumber: userData.contactNumber
    };
    
    console.log('🔥 Sending request to:', `${BACKEND_URL}/safety/create-log`);
    console.log('🔥 Request body:', requestBody);
    
    const response = await fetch(`${BACKEND_URL}/safety/create-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userData.accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('🔥 Response status:', response.status);
    console.log('🔥 Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('🔥 Raw response:', responseText);
    
    if (!response.ok) {
      let errorMessage = 'Failed to enable safety mode';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        console.log('🔥 Failed to parse error response as JSON:', parseError);
        errorMessage = `Server error (${response.status}): ${responseText.substring(0, 200)}`;
      }
      throw new Error(errorMessage);
    }
    
    let data: EnableSafetyModeResponse;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.log('🔥 Failed to parse success response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }
    
    // Update session context with safety state
    updateSessionCallback({
      isInAnEmergency: true,
      emergencyType: emergencyType,
      logID: data.logID
    });
    
    return data.logID;
  } catch (error) {
    console.error('Error enabling safety mode:', error);
    throw error;
  }
};

export const disableSafetyMode = async (
  accessToken: string,
  logID: string,
  updateSessionCallback: SessionUpdateCallback
): Promise<void> => {
  try {
    const requestBody = {
      logID: logID
    };
    
    const response = await fetch(`${BACKEND_URL}/safety/end-log`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to disable safety mode');
    }
    
    // Update session context to clear safety state
    updateSessionCallback({
      isInAnEmergency: false,
      emergencyType: '',
      logID: undefined
    });
    
  } catch (error) {
    console.error('Error disabling safety mode:', error);
    throw error;
  }
};