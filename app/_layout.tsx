import { SessionProvider, useSession } from '@/context/SessionContext';
import { TrackingProvider } from '@/context/TrackingContext';
import { RouteTrackerProvider } from '@/context/RouteTrackerContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AlertsProvider } from '@/context/AlertsContext';
import { ItineraryProvider } from '@/context/ItineraryContext';
import { SocketProvider } from '@/context/SocketContext';
import { MessageProvider } from '@/context/MessageContext';
import { useAutoSync } from '@/services/itinerariesApiService';
import GlobalAlarmProvider from '@/components/providers/GlobalAlarmProvider';
import { useThemeColor } from '@/hooks/useThemeColor';
import { initializeThemeCache } from '@/hooks/useTheme';
// import { socketService } from '@/services/socketService';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useLocationUpdater } from '@/hooks/useLocationUpdater';
import MessagePopup from '@/components/MessagePopup';

SplashScreen.preventAutoHideAsync();

function SessionInitializer() {
  const { session } = useSession();
  
  // Auto-sync itineraries when app starts
  useAutoSync();

  // const { updateUserLocation, isLocationAvailable } = useLocationUpdater();
  
  //   // Update location when user opens the app (if logged in)
  //   useEffect(() => {
  //     if (session?.user && session?.accessToken && isLocationAvailable) {
  //       // Trigger location update when app opens
  //       updateUserLocation(true); // Force update on app open
  //     }
  //   }, [session?.user, session?.accessToken, isLocationAvailable, updateUserLocation]);

  // useEffect(() => {
  //   if (session?.user?.id) {
  //     socketService.connect(session.user.id);
  //   } else {
  //     socketService.disconnect();
  //   }

  //   return () => {
  //     socketService.disconnect();
  //   };
  // }, [session?.user?.id]);

  return null;
}

export default function RootLayout() {
  
  const [loaded] = useFonts({
    Poppins: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsSemiBold: require('../assets/fonts/Poppins-SemiBold.ttf'),
    PoppinsBold: require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    const initialize = async () => {
      await initializeThemeCache();
      if (loaded) {
        SplashScreen.hideAsync();
      }
    };
    
    initialize();
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  

  return (
    <ThemeProvider>
      <SessionProvider>
        <SocketProvider>
          <MessageProvider>
            <ItineraryProvider>
              <TrackingProvider>
                <RouteTrackerProvider>
                  <AlertsProvider>
                    <GlobalAlarmProvider>
                      <AppContent />
                    </GlobalAlarmProvider>
                  </AlertsProvider>
                </RouteTrackerProvider>
              </TrackingProvider>
            </ItineraryProvider>
          </MessageProvider>
        </SocketProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const backgroundColor = useThemeColor({}, 'primary');

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
        <SessionInitializer />
        <StatusBar style="light" backgroundColor={backgroundColor} />
        <MessagePopup />
        <Stack 
          screenOptions={{ headerShown: false }}
          initialRouteName={"index"}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/register" />
          <Stack.Screen name="auth/verifyEmail" />
          <Stack.Screen name="auth/warning" />
          <Stack.Screen name="auth/forgotPassword" />
          <Stack.Screen name="auth/changePassword" />
          <Stack.Screen name="auth/firstLogin" />
          <Stack.Screen name="account/viewProfile" />
          <Stack.Screen name="account/info-view" />
          <Stack.Screen name="account/paymentPortal" />
          <Stack.Screen name="account/settings-updateInfo" />
          <Stack.Screen name="account/settings-visibility" />
          <Stack.Screen name="routes/routes" />
          <Stack.Screen name="routes/routes-create" />
          <Stack.Screen name="itineraries/itineraries" />
          <Stack.Screen name="itineraries/itineraries-create" />
          <Stack.Screen name="itineraries/itineraries-update" />
          <Stack.Screen name="itineraries/itineraries-view" />
          <Stack.Screen name="itineraries/itineraries-history" />
          <Stack.Screen name="home/aiChat" />
          <Stack.Screen name="taraBuddy/taraBuddy-settings" />
          <Stack.Screen name="tours/tours-view" />
          <Stack.Screen name="groups/groups-view" />
          <Stack.Screen name="groups/groups-linkItinerary" />
          <Stack.Screen name="safety/safety" />
          <Stack.Screen name="safety/disasterMap-weather" />
          <Stack.Screen name="locationPermission" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaView>
    </View>
  );
}
