import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { useItinerary, Itinerary } from '@/context/ItineraryContext';
import { ThemedIcons } from '@/components/ThemedIcons';
import CubeButton from '@/components/RoundedButton';
import FadedHeader from '@/components/custom/FadedHeader';
import { useThemeColor } from '@/hooks/useThemeColor';
import EmptyMessage from '@/components/EmptyMessage';
import MonthlyCalendar from '@/components/MonthlyCalendar';

interface ItineraryCardProps {
  itinerary: Itinerary;
}

const ItineraryCard: React.FC<ItineraryCardProps> = ({ itinerary }) => {
  const accentColor = useThemeColor({}, 'accent');
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <TouchableOpacity 
      onPress={() => router.push(`/itineraries/itineraries-view?id=${itinerary.id}`)}
      activeOpacity={0.7}
    >
      <ThemedView color='primary' shadow style={styles.itineraryCard}>
        <ThemedText type='defaultSemiBold' numberOfLines={2}>
          {itinerary.title}
        </ThemedText>

        <View style={styles.cardDates}>
          <ThemedIcons library='MaterialIcons' name='event' size={16} />
          <ThemedText style={{ marginLeft: 6 , opacity: 0.7}}>
            {formatDate(new Date(itinerary.startDate))} - {formatDate(new Date(itinerary.endDate))}
          </ThemedText>
        </View>
        <View style={styles.cardDates}>
          <ThemedIcons library='MaterialIcons' name='person' size={16} />
          <ThemedText style={{ marginLeft: 6 , opacity: 0.5}}>
            {itinerary.username}
          </ThemedText>
        </View>

        {itinerary.description && (
          <ThemedText style={{ opacity: 0.5, paddingRight: 50, fontSize: 12, marginTop: 8}} numberOfLines={2}>
            {itinerary.description}
          </ThemedText>
        )}
          
        <View style={[styles.statusBadge, { borderColor: accentColor }]}>
          <ThemedText style={{ color: accentColor }}>
            {itinerary.status.toUpperCase()}
          </ThemedText>
        </View>
          
      </ThemedView>
    </TouchableOpacity>
  );
};

export default function ItinerariesScreen() {
  const [selectedOption, setSelectedOption] = useState('ongoing');
  const accentColor = useThemeColor({}, 'accent');
  const { itineraries } = useItinerary();
  const { session } = useSession();

  const userItineraries = itineraries.filter(itinerary => 
    session?.user?.id && itinerary.userID === session.user.id
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getOngoingItineraries = (): Itinerary[] => {
    return userItineraries.filter(itinerary => {
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      const isOngoing = today >= startDate && itinerary.status === 'pending';
      return isOngoing;
    });
  };

  const getUpcomingItineraries = (): Itinerary[] => {
    return userItineraries.filter(itinerary => {
      const startDate = new Date(itinerary.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      return (
        today < startDate && 
        itinerary.status === 'pending'
      );
    });
  };

  const getHistoryItineraries = (): Itinerary[] => {
    return userItineraries.filter(itinerary => {
      const endDate = new Date(itinerary.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      return (
        itinerary.status === 'completed' || 
        itinerary.status === 'cancelled'
      );
    });
  };

  // Get filtered itineraries based on selected option
  const getFilteredItineraries = (): Itinerary[] => {
    switch (selectedOption) {
      case 'ongoing':
        return getOngoingItineraries();
      case 'upcoming':
        return getUpcomingItineraries();
      case 'history':
        return getHistoryItineraries();
      default:
        return [];
    }
  };

  const filteredItineraries = getFilteredItineraries();

  // Handle date selection from calendar
  const handleDateSelect = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    // If selected date is in the future, switch to upcoming tab
    if (selectedDate > today) {
      setSelectedOption('upcoming');
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <FadedHeader title='Itineraries' subtitle='Your travel plans' iconName='event-note' iconLibrary='MaterialIcons'/>
        <ThemedView color='primary' shadow style={styles.calendarContainer}>
          <MonthlyCalendar hideDetails onDateSelect={handleDateSelect}/>
        </ThemedView>
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
        
        {/* Itineraries List */}
        <View style={styles.itinerariesContainer}>
          {filteredItineraries.length === 0 ? (
            <EmptyMessage
              iconName='event-note'
              title='No itineraries found'
              description={
                selectedOption === 'upcoming' ? 'Create your first itinerary to get started!' : 
                selectedOption === 'ongoing' ? 'No active trips at the moment.' : 
                selectedOption === 'history' ? 'Your completed trips will appear here.' : ''
              }
            />
          ) : (
            filteredItineraries.map((itinerary) => (
              <ItineraryCard key={itinerary.id} itinerary={itinerary} />
            ))
          )}
        </View>
        
      </ScrollView>

      <CubeButton
        size={60}
        iconName="add"
        iconColor="#fff"
        onPress={() => router.push('/itineraries/itineraries-create')}
        style={{position: 'absolute', bottom: 10, right: 10}}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    margin: 16,
    borderRadius: 14
  },
  typeButtonsContainer: {
    paddingTop: 5,
    paddingBottom: 16,
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
  itinerariesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  itineraryCard: {
    marginBottom: 14,
    borderRadius: 10,
    padding: 16,
    overflow: 'hidden',
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
});