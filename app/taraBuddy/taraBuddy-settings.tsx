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
import { openDocument } from '@/utils/documentUtils';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { renderProUpgrade } from '@/app/account/proUpgrade';
import { renderMapTypeSettings } from '@/app/account/settings-mapType';

export default function TaraBuddySettingsScreen() {
  const { session} = useSession();
  const user = session?.user;

  const fullName = [user?.fname, user?.mname, user?.lname].filter(Boolean).join(' ');
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
        
        {/* Options */}
        <View style={styles.options}>
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Preference
          </ThemedText>
          
        </View>
      </ScrollView>
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
});
