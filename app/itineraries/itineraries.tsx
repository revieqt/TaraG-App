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

export default function ItinerariesScreen() {
  const [selectedOption, setSelectedOption] = useState('ongoing');

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <ThemedView color='secondary'>
          <View style={styles.headerTop}>
            <BackButton color="#FFFFFF"/>
          </View>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedOption('ongoing')} style={[styles.headerButtons, selectedOption !== 'ongoing' && {opacity: .5}]}>
              <ThemedIcons library="MaterialDesignIcons" name="timer-pause-outline" size={28} color="#fff" />
              <ThemedText style={{color: '#fff'}}>Ongoing</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedOption('upcoming')} style={[styles.headerButtons, selectedOption !== 'upcoming' && {opacity: .5}]}>
              <ThemedIcons library="MaterialDesignIcons" name="timer-play-outline" size={28} color="#fff" />
              <ThemedText style={{color: '#fff'}}>Upcoming</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSelectedOption('history')} style={[styles.headerButtons, selectedOption !== 'history' && {opacity: .5}]}>
              <ThemedIcons library="MaterialDesignIcons" name="history" size={28} color="#fff" />
              <ThemedText style={{color: '#fff'}}>History</ThemedText>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(0, 255, 222, .5)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.headerOverlay}
            pointerEvents="none"
          >
            <ThemedView style={styles.headerBottom} />
          </LinearGradient>
        </ThemedView>
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
  header: {
    marginTop: 75,
    margin: 40,
    zIndex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  headerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  headerBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  headerButtons: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5
  },
});