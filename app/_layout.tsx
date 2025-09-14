import { SessionProvider, useSession } from '@/context/SessionContext';
import { useThemeColor } from '@/hooks/useThemeColor';
// import { socketService } from '@/services/socketService';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-get-random-values';
import { SafeAreaView } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

// 🔑 This component safely runs session-dependent effects
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

  // Themed background color
  const backgroundColor = useThemeColor({}, 'primary');

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
      <SessionProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor }} edges={['top', 'bottom']}>
          <SessionInitializer />

          <Stack screenOptions={{ headerShown: false }}>
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

            <Stack.Screen name="home/routes/routes" />
            <Stack.Screen name="home/routes/routes-create" />
            <Stack.Screen name="home/routes/routes-history" />
            <Stack.Screen name="home/itineraries/itineraries" />
            <Stack.Screen name="home/itineraries/itineraries-create" />
            <Stack.Screen name="home/itineraries/itineraries-update" />
            <Stack.Screen name="home/itineraries/itineraries-view" />
            <Stack.Screen name="home/itineraries/itineraries-history" />
            <Stack.Screen name="home/safety" />
            <Stack.Screen name="home/aiChat" />

            <Stack.Screen name="explore/tours-view" />
            <Stack.Screen name="explore/groups-view" />
            <Stack.Screen name="explore/groups-linkItinerary" />

            <Stack.Screen name="payment" />
            <Stack.Screen name="index" />
            <Stack.Screen name="+not-found" />
          </Stack>

          <StatusBar style="auto" />
        </SafeAreaView>
      </SessionProvider>
  );
}
