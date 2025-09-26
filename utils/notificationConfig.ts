import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;
  let finalStatus = 'denied'; // Initialize at function level

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification!');
      return false;
    }
    
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.warn('Project ID not found');
      }
      
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
      
      console.log('Push notification token:', token);
    } catch (e) {
      console.warn('Error getting push token:', e);
    }
  } else {
    console.warn('Must use physical device for Push Notifications');
  }

  return finalStatus === 'granted';
}

export async function sendStopAlarmNotification(
  stopName: string, 
  distance: number, 
  routeMode: string
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🚨 Approaching Stop',
        body: `${stopName} is ${Math.round(distance)}m away on your ${routeMode} route`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 500, 300, 500, 300, 500, 300, 500, 300, 500], // Continuous vibration pattern
        data: {
          stopName,
          distance,
          routeMode,
          type: 'stop_alarm',
          screen: '/(tabs)/maps'
        },
      },
      trigger: null, // Send immediately
    });
    
    console.log(`📱 Push notification sent for ${stopName}`);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}
