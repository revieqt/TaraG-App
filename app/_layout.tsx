import { SessionProvider, useSession } from '@/context/SessionContext';
import { TrackingProvider } from '@/context/TrackingContext';
import { RouteTrackerProvider } from '@/context/RouteTrackerContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AlertsProvider } from '@/context/AlertsContext';
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

SplashScreen.preventAutoHideAsync();

function SessionInitializer() {
  const { session } = useSession();

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
        <TrackingProvider>
          <RouteTrackerProvider>
            <AlertsProvider>
              <GlobalAlarmProvider>
                <AppContent />
              </GlobalAlarmProvider>
            </AlertsProvider>
          </RouteTrackerProvider>
        </TrackingProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const backgroundColor = useThemeColor({}, 'primary');
  const { session, loading } = useSession();
  const initialRouteName = !loading && session?.user && session?.accessToken ? "(tabs)" : "index";

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
        <SessionInitializer />
        <StatusBar style="light" backgroundColor={backgroundColor} />
        <Stack 
          screenOptions={{ headerShown: false }}
          initialRouteName={initialRouteName}
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
          <Stack.Screen name="account/notifications" />
          <Stack.Screen name="account/info-view" />
          <Stack.Screen name="account/settings-updateInfo" />
          <Stack.Screen name="account/settings-visibility" />
          <Stack.Screen name="account/settings-mapType" />
          <Stack.Screen name="routes/routes" />
          <Stack.Screen name="routes/routes-create" />
          <Stack.Screen name="itineraries/itineraries" />
          <Stack.Screen name="itineraries/itineraries-create" />
          <Stack.Screen name="itineraries/itineraries-update" />
          <Stack.Screen name="itineraries/itineraries-view" />
          <Stack.Screen name="itineraries/itineraries-history" />
          <Stack.Screen name="home/safety" />
          <Stack.Screen name="home/aiChat" />
          <Stack.Screen name="taraBuddy/taraBuddy-settings" />
          <Stack.Screen name="tours/tours-view" />
          <Stack.Screen name="groups/groups-view" />
          <Stack.Screen name="groups/groups-linkItinerary" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </SafeAreaView>
    </View>
  );
}
