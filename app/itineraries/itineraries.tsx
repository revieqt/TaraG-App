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

// ItineraryCard Component
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

  const getDaysDifference = (startDate: Date, endDate: Date) => {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? 1 : diffDays + 1; // Include both start and end days
  };

  const days = getDaysDifference(new Date(itinerary.startDate), new Date(itinerary.endDate));

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
          <ThemedText style={{ marginLeft: 6 , opacity: 0.7}}>
            ( {days} {days === 1 ? 'day' : 'days'} )
          </ThemedText>
        </View>

        {itinerary.description && (
          <ThemedText style={{ opacity: 0.5, paddingRight: 50}} numberOfLines={2}>
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

  // Filter itineraries by current user
  const userItineraries = itineraries.filter(itinerary => 
    session?.user?.id && itinerary.userID === session.user.id
  );

  // Get current date for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

  // Filter functions for each category
  const getOngoingItineraries = (): Itinerary[] => {
    return userItineraries.filter(itinerary => {
      const startDate = new Date(itinerary.startDate);
      const endDate = new Date(itinerary.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      const isOngoing = today >= startDate && today <= endDate && itinerary.status === 'pending';
      
      console.log('🔍 Ongoing filter for:', itinerary.title, {
        today: today.toDateString(),
        startDate: startDate.toDateString(),
        endDate: endDate.toDateString(),
        status: itinerary.status,
        todayTime: today.getTime(),
        startTime: startDate.getTime(),
        endTime: endDate.getTime(),
        isOngoing
      });
      
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
        today > endDate || 
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

  // Debug: Log itineraries when they change
  useEffect(() => {
    console.log('📋 ItinerariesScreen - Total itineraries:', itineraries.length);
    console.log('👤 Current user ID:', session?.user?.id);
    console.log('🎯 User itineraries:', userItineraries.length);
    console.log('🔍 Filtered itineraries (' + selectedOption + '):', filteredItineraries.length);
  }, [itineraries, session?.user?.id, selectedOption, filteredItineraries.length]);

 

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
  itinerariesContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  itineraryCard: {
    marginBottom: 14,
    borderRadius: 10,
    padding: 16,
    overflow: 'hidden',
    paddingBottom: 25,
  },
  cardDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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