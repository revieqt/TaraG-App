import Button from '@/components/Button';
import GradientHeader from '@/components/GradientHeader';
import HorizontalSections from '@/components/HorizontalSections';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ToggleButton from '@/components/ToggleButton';
import { updateFirstLoginViaBackend } from '@/services/authApiService';
import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

const interests = [
  "Nature", "Outdoors", "City Life", "Culture", "History", "Arts", 
  "Water Activities", "Adventure", "Camping", "Relaxation", "Wellness", 
  "Social", "Aesthetics", "Events", "Entertainment"
];

export default function FirstLoginScreen() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const { session } = useSession();

  const handleInterestToggle = (value: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedInterests(prev => [...prev, value]);
    } else {
      setSelectedInterests(prev => prev.filter(interest => interest !== value));
    }
  };

  const handleFinish = async () => {
    if (selectedInterests.length < 3) return;
    if (!session?.user?.email) {
      console.error('No user email available');
      return;
    }
    
    try {
      console.log('🔍 FirstLogin: Attempting to update with:', { 
        email: session.user.email, 
        interests: selectedInterests,
        hasToken: !!session.accessToken 
      });
      
      await updateFirstLoginViaBackend(session.user.email, selectedInterests, session.accessToken);
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  };

  const labels = [
    'Welcome',
    'Smart Planning',
    'Community Connect',
    'Safety First',
    'Get to Know You',
  ];

  const sections = [
    <View style={styles.introScreen} key="welcome">
      <Image 
        source={require('@/assets/images/slide1-img.png')}
        style={styles.screenImage}
      />
      <ThemedText type="title" style={styles.screenTitle}>
        Welcome to TaraG!
      </ThemedText>
      <ThemedText style={styles.screenSubtitle}>
        TaraG is your ultimate travel companion app, designed to make every journey smarter, safer, and more enjoyable.
      </ThemedText>
    </View>,
    <View style={styles.introScreen} key="smart-planning">
      <Image 
        source={require('@/assets/images/slide2-img.png')}
        style={styles.screenImage}
      />
      <ThemedText type="title" style={styles.screenTitle}>
        Smart Planning
      </ThemedText>
      <ThemedText style={styles.screenSubtitle}>
        Get personalized travel recommendations based on your preferences, weather conditions, and local insights.
      </ThemedText>
    </View>,
    <View style={styles.introScreen} key="community-connect">
      <Image 
        source={require('@/assets/images/slide3-img.png')}
        style={styles.screenImage}
      />
      <ThemedText type="title" style={styles.screenTitle}>
        Community Connect
      </ThemedText>
      <ThemedText style={styles.screenSubtitle}>
        Join tours, share tips, ask questions, and connect with fellow adventurers for a more social and enriching travel experience.
      </ThemedText>
    </View>,
    <View style={styles.introScreen} key="safety-first">
      <Image 
        source={require('@/assets/images/slide4-img.png')}
        style={styles.screenImage}
      />
      <ThemedText type="title" style={styles.screenTitle}>
        Safety First
      </ThemedText>
      <ThemedText style={styles.screenSubtitle}>
        Stay informed with weather updates, route safety assessments, and quick access to emergency contacts.
      </ThemedText>
    </View>,
    <View style={styles.getToKnowYouScreen} key="get-to-know-you">
      <ThemedText type="title" style={{marginBottom: 10}}>
        Get to Know You
      </ThemedText>
      <ThemedText style={{  marginBottom: 20, opacity: 0.9 }}>
        Select at least 3 interests to personalize your experience
      </ThemedText>
      <ScrollView style={{ flex: 1}} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1,flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingVertical: 20 }}>
          {interests.map((interest) => (
            <ToggleButton
              key={interest}
              value={interest}
              label={interest}
              onToggle={handleInterestToggle}
              textStyle={{ fontSize: 12 }}
            />
          ))}
        </View>
      </ScrollView>
      <Button
        title="Get Started"
        onPress={handleFinish}
        type="primary"
        disabled={selectedInterests.length < 3}
        buttonStyle={styles.getStartedButton}
      />
    </View>
  ];

  return (
    <ThemedView style={{flex: 1}}>
      <GradientHeader/>
      <HorizontalSections
        labels={labels}
        sections={sections}
        type="dotIdentifier"
        containerStyle={{ flex: 1 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  introScreen:{
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: 16
  },
  getToKnowYouScreen: {
    flex: 1, 
    paddingTop: 60,
    paddingHorizontal: 16,
    zIndex: 1000
  },
  screenTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  screenSubtitle: {
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.9,
  },
  screenImage: {
    width: 200, 
    height: 200,
    marginBottom: 60, 
    resizeMode: 'contain'
  },
  getStartedButton: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
  },
});