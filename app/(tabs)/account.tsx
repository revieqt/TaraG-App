import Button from '@/components/Button';
import ProBadge from '@/components/custom/ProBadge';
import GradientHeader from '@/components/GradientHeader';
import { renderSystemTheme } from '@/app/account/settings-systemTheme';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import WebViewModal from '@/components/WebView';
import { BACKEND_URL, SUPPORT_FORM_URL, TRAVELLER_PRO_PRICE } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';
import { useAlerts } from '@/context/AlertsContext';
import { useLocation } from '@/hooks/useLocation';
import { openDocument } from '@/utils/documentUtils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { renderProUpgrade } from '@/app/account/proUpgrade';
import { renderMapTypeSettings } from '@/app/account/settings-mapType';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountScreen() {
  const { session, clearSession } = useSession();
  const user = session?.user;
  const { refreshGlobalAlerts, loading: alertsLoading } = useAlerts();
  const location = useLocation();
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [isFetchingAlerts, setIsFetchingAlerts] = useState(false);

  const fullName = [user?.fname, user?.mname, user?.lname].filter(Boolean).join(' ');

  const handleLogout = async () => {
    try {
      await clearSession();
      router.replace('/auth/login');
    } catch (err) {
      Alert.alert('Logout Failed', 'An error occurred while logging out.');
    }
  };

  const handleManualFetchAlerts = async () => {
    if (!location.latitude || !location.longitude) {
      Alert.alert('Location Required', 'Location data is required to fetch alerts. Please ensure location services are enabled.');
      return;
    }

    // Show fetching alert
    Alert.alert('Fetching Alerts', 'Please wait while we fetch the latest global alerts...');
    
    setIsFetchingAlerts(true);
    try {
      await refreshGlobalAlerts({ force: true });
      Alert.alert('Success', 'Global alerts have been manually fetched and updated.');
    } catch (error) {
      console.error('Manual fetch error:', error);
      Alert.alert('Fetch Failed', 'Failed to fetch global alerts. Please try again.');
    } finally {
      setIsFetchingAlerts(false);
    }
  };

  const handleClearCache = async () => {
    Alert.alert(
      "Clear Cache",
      "By clearing cache, you will lose all your saved data and will log you out. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert("Success", "All cache has been cleared.");
              await clearSession();
              router.replace('/auth/login');
            } catch (error) {
              console.error("Error clearing AsyncStorage:", error);
              Alert.alert("Error", "Failed to clear cache.");
            }
          },
        },
      ]
    );
  };
  
  return (
    <ThemedView style={{ flex: 1 }}>
      <GradientHeader/>
      <ScrollView
        style={{ width: '100%', zIndex: 1000}}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
      >
        <ThemedView shadow color='primary' style={styles.header}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() =>
              router.push({
                pathname: '/account/viewProfile',
                params: { userId: user?.id },
              })
            }
          >
            <Image
              source={{ uri: session?.user?.profileImage || 'https://ui-avatars.com/api/?name=User' }}
              style={styles.profileImage}
            />
            <View style={{ justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ThemedText type='defaultSemiBold'>{fullName}</ThemedText>
                <ProBadge/>
              </View>
              <ThemedText style={{opacity: .5}}>@{user?.username}</ThemedText>
            </View>
            <View style={{ position: 'absolute', right: 0 }}>
              <ThemedIcons library='MaterialIcons' name='arrow-forward-ios' size={20} />
            </View>
          </TouchableOpacity>
        </ThemedView>

        {renderProUpgrade()}
        
        {/* Options */}
        <View style={styles.options}>
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Customization
          </ThemedText>
          {renderMapTypeSettings()}
          {renderSystemTheme()}
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Privacy and Security
          </ThemedText>
          <TouchableOpacity
            onPress={() => router.push('/auth/changePassword')}
            style={styles.optionsChild}
          >
            <ThemedIcons library='MaterialIcons' name='vpn-key' size={15} />
            <ThemedText>Change Password</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/account/settings-updateInfo')}
            style={styles.optionsChild}
          >
            <ThemedIcons library='MaterialIcons' name='info' size={15} />
            <ThemedText>Update Information</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/account/settings-visibility')} style={styles.optionsChild}>
            <ThemedIcons library='MaterialIcons' name='supervised-user-circle' size={15} />
            <ThemedText>Profile Visibility</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openDocument('privacyPolicy-mobileApp')} style={styles.optionsChild}>
            <ThemedIcons library='MaterialDesignIcons' name='file-eye' size={15} />
            <ThemedText>Privacy Policy</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openDocument('terms-mobileApp')} style={styles.optionsChild}>
            <ThemedIcons library='MaterialDesignIcons' name='file-alert' size={15} />
            <ThemedText>Terms and Conditions</ThemedText>
          </TouchableOpacity>

          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Help and Support
          </ThemedText>
          <TouchableOpacity onPress={() => openDocument('manual-mobileApp')} style={styles.optionsChild}>
            <ThemedIcons library='MaterialDesignIcons' name='file-find' size={15} />
            <ThemedText>App Manual</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSupport(true)} style={styles.optionsChild}>
            <ThemedIcons library='MaterialDesignIcons' name='headset' size={15} />
            <ThemedText>Contact Support</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openDocument('about')} style={styles.optionsChild}>
            <ThemedIcons library='MaterialDesignIcons' name='file-find' size={15} />
            <ThemedText>About TaraG</ThemedText>
          </TouchableOpacity>
          <Pressable 
            onLongPress={() => {
              const timer = setTimeout(() => {
                setDevMode(!devMode);
                Alert.alert(
                  'Developer Mode', 
                  devMode ? 'Developer mode disabled' : 'Developer mode enabled!'
                );
              }, 3000);
              
              // Clear the timer if the press is released before 3 seconds
              return () => clearTimeout(timer);
            }}
            style={({ pressed }) => [
              styles.optionsChild,
              pressed && { opacity: 0.6 }
            ]}
            delayLongPress={100} // Slight delay before long press is recognized
          >
            <ThemedIcons library='MaterialDesignIcons' name='diversify' size={15} />
            <ThemedText>TaraG Version 1.0 {devMode ? ' (Dev Mode)' : ''}</ThemedText>
          </Pressable>

          {devMode && (
            <>
              <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
                Developer Tools
              </ThemedText>
              <TouchableOpacity 
                onPress={handleManualFetchAlerts} 
                style={styles.optionsChild}
              >
                <ThemedIcons 
                  library='MaterialDesignIcons' 
                  name='download' 
                  size={15} 
                />
                <ThemedText>Manually Fetch Global Alerts</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleClearCache} 
                style={styles.optionsChild}
              >
                <ThemedIcons 
                  library='MaterialIcons' 
                  name='layers-clear' 
                  size={15} 
                />
                <ThemedText>Clear Cache</ThemedText>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Logout Button */}
        <Button
          title='Logout'
          onPress={handleLogout}
          type='primary'
          buttonStyle={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </ScrollView>

      {/* Support Modal */}
      <WebViewModal
        visible={showSupport}
        onClose={() => setShowSupport(false)}
        uri={SUPPORT_FORM_URL}
      />

      <WebViewModal
        visible={showPayment}
        onClose={() => setShowPayment(false)}
        uri={paymentUrl || ""}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
    marginTop: 30,
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  container: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    aspectRatio: 1,
    borderRadius: 50,
    marginRight: 16,
  },
  options: {
    gap: 10,
    width: '100%',
  },
  optionsTitle: {
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
  },
  optionsChild: {
    padding: 10,
    fontSize: 15,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  logoutButton: {
    width: '100%',
    marginVertical: 30,
  },
  logoutText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  closeButton: {
    backgroundColor: '#ff4444',
    padding: 12,
    alignItems: 'center',
  },
});
