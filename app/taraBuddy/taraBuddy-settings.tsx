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
import RangeBar from '@/components/RangeBar';

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
        <ThemedText type='title'>Preference</ThemedText>
        
        
        {/* Options */}
        <View style={styles.options}>
          
          
          <ThemedText style={styles.warning}>
            We’ll always try to match you with people who fit your preferences first. But if no one nearby fits the bill, we might show you other users in the area—you never know where a great connection might pop up!
          </ThemedText>
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Your Profile
          </ThemedText>
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
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Gender
          </ThemedText>
          <ThemedText>
            Choose a gender preference for your buddy search.
          </ThemedText>
          <View style={styles.buttonOptionsContainer}>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-male' size={20} />
                <ThemedText>Male</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-female' size={20} />
                <ThemedText>Female</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-male-female-variant' size={20} />
                <ThemedText>Other</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='gender-male-female' size={20} />
                <ThemedText>Open to All</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </View>
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Distance
          </ThemedText>
          <ThemedText>
            Choose a distance preference for your buddy search.
          </ThemedText>
          <RangeBar 
            range={[1, 100]} 
            displayValue 
            label="km"
            description="Maximum distance"
            initialValue={25}
            step={1}
          />
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Age
          </ThemedText>
          <ThemedText>
            Choose an age preference for your buddy search.
          </ThemedText>
          <RangeBar 
            range={[18, 80]} 
            rangeBar 
            displayValue 
            label="years"
            description="Age range"
            initialValues={[22, 35]}
            step={1}
          />
          <ThemedText style={styles.optionsTitle} type='defaultSemiBold'>
            Zodiac Sign
          </ThemedText>
          <ThemedText>
            You can choose one or more zodiac sign(s) for your buddy search.
          </ThemedText>
          <View style={styles.buttonOptionsContainer}>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-aries' size={20} />
                <ThemedText>Aries</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-taurus' size={20} />
                <ThemedText>Taurus</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-gemini' size={20} />
                <ThemedText>Gemini</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-cancer' size={20} />
                <ThemedText>Cancer</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-leo' size={20} />
                <ThemedText>Leo</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-virgo' size={20} />
                <ThemedText>Virgo</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-libra' size={20} />
                <ThemedText>Libra</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-scorpio' size={20} />
                <ThemedText>Scorpio</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-sagittarius' size={20} />
                <ThemedText>Sagittarius</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-capricorn' size={20} />
                <ThemedText>Capricorn</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-aquarius' size={20} />
                <ThemedText>Aquarius</ThemedText>
              </ThemedView>
            </TouchableOpacity>
            <TouchableOpacity>
              <ThemedView color='primary' style={styles.buttonOption}>
                <ThemedIcons library='MaterialDesignIcons' name='zodiac-pisces' size={20} />
                <ThemedText>Pisces</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </View>
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
    padding: 20,
    borderRadius: 15,
  },
  container: {
    padding: 20,
    paddingTop: 60,
    zIndex: 1000,
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
    marginTop: 20,
    marginBottom: 5,
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
  warning: {
    opacity: .5,
    marginVertical: 10,
  },
  buttonOptionsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  buttonOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
