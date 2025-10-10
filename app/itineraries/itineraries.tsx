import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedIcons } from '@/components/ThemedIcons';
import BackButton from '@/components/custom/BackButton';
import CubeButton from '@/components/RoundedButton';
import FadedHeader from '@/components/custom/FadedHeader';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function ItinerariesScreen() {
  const [selectedOption, setSelectedOption] = useState('ongoing');
  const accentColor = useThemeColor({}, 'accent'); 

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <FadedHeader title='Itineraries' subtitle='Your travel plans' iconName='event-note' iconLibrary='MaterialIcons'/>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.typeButtonsContainer}
          contentContainerStyle={{paddingHorizontal: 16, gap: 12}}
        >
          <TouchableOpacity 
            onPress={() => {
              setSelectedOption('ongoing');
            }}
          >
            <ThemedView 
              color='primary' 
              shadow 
              style={[
                styles.typeButton, 
                selectedOption === 'ongoing' && {backgroundColor: accentColor}
              ]}
            >
              <ThemedIcons 
                library='MaterialDesignIcons' 
                name='timer-pause-outline' 
                size={20}
                color={selectedOption === 'ongoing' ? 'white' : undefined}
              />
              <ThemedText style={selectedOption === 'ongoing' ? {color: 'white'} : undefined}>
                Ongoing
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              setSelectedOption('upcoming');
            }}
          >
            <ThemedView 
              color='primary' 
              shadow 
              style={[
                styles.typeButton, 
                selectedOption === 'upcoming' && {backgroundColor: accentColor}
              ]}
            >
              <ThemedIcons 
                library='MaterialDesignIcons' 
                name='timer-play-outline' 
                size={20}
                color={selectedOption === 'upcoming' ? 'white' : undefined}
              />
              <ThemedText style={selectedOption === 'upcoming' ? {color: 'white'} : undefined}>
                Upcoming
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => {
              setSelectedOption('history');
            }}
          >
            <ThemedView 
              color='primary' 
              shadow 
              style={[
                styles.typeButton, 
                selectedOption === 'history' && {backgroundColor: accentColor}
              ]}
            >
              <ThemedIcons 
                library='MaterialDesignIcons' 
                name='history' 
                size={20}
                color={selectedOption === 'history' ? 'white' : undefined}
              />
              <ThemedText style={selectedOption === 'history' ? {color: 'white'} : undefined}>
                History
              </ThemedText>
            </ThemedView>
          </TouchableOpacity>
        </ScrollView>
        
      </ScrollView>

      <CubeButton
        size={60}
        iconName="add"
        iconColor="#fff"
        onPress={() => router.push('/itineraries/itineraries-create')}
        style={{position: 'absolute', bottom: 20, right: 20}}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  typeButtonsContainer: {
    paddingVertical: 16,
  },
  typeButton: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  headerTop: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 4
  },
});