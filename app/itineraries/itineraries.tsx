import CubeButton from '@/components/RoundedButton';
import Header from '@/components/Header';
import OptionsPopup from '@/components/OptionsPopup';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { deleteItinerary, getItinerariesByUserAndStatus } from '@/services/itinerariesApiService';
import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';

export default function ItinerariesScreen() {
  const { session } = useSession();
  const [ongoingItineraries, setOngoingItineraries] = useState<any[]>([]);
  const [upcomingItineraries, setUpcomingItineraries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // Set up a timer to refresh at midnight Asia/Manila
  useEffect(() => {
    function msUntilNextManilaMidnight() {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const manilaNow = new Date(utc + 8 * 60 * 60000);
      const nextMidnight = new Date(manilaNow);
      nextMidnight.setHours(24, 0, 0, 0);
      return nextMidnight.getTime() - manilaNow.getTime();
    }
    const timer = setTimeout(() => {
      setRefreshFlag(f => f + 1);
    }, msUntilNextManilaMidnight());
    return () => clearTimeout(timer);
  }, [refreshFlag]);

  // Fetch itineraries when refreshFlag changes
  useEffect(() => {
    const fetchItineraries = async () => {
      if (!session?.user?.id || !session?.accessToken) {
        setError('No user session or access token');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch ongoing and upcoming itineraries separately
        const [ongoingResult, upcomingResult] = await Promise.all([
          getItinerariesByUserAndStatus(session.user.id, 'ongoing', session.accessToken),
          getItinerariesByUserAndStatus(session.user.id, 'upcoming', session.accessToken)
        ]);

        if (ongoingResult.success) {
          setOngoingItineraries(ongoingResult.data || []);
        } else {
          setError(ongoingResult.errorMessage || 'Failed to fetch ongoing itineraries');
        }

        if (upcomingResult.success) {
          setUpcomingItineraries(upcomingResult.data || []);
        } else {
          setError(upcomingResult.errorMessage || 'Failed to fetch upcoming itineraries');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch itineraries');
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [refreshFlag, session]);

  // Call this after data changes (delete, cancel, mark as completed)
  const handleDataChanged = () => {
    setRefreshFlag(f => f + 1);
  };

  // Pass the itinerary data directly to the view screen
  const goToViewItinerary = (itinerary: any) => {
    router.push({
      pathname: '/itineraries/itineraries-view',
      params: { itineraryData: JSON.stringify(itinerary) }
    });
  };

  const renderItineraryItem = (itinerary: any) => (
    <ThemedView color='primary' shadow key={itinerary.id} style={styles.itineraryRow}>
      <View style={{ flex: 1 }}>
        <TouchableOpacity onPress={() => goToViewItinerary(itinerary)} activeOpacity={0.7}>
          <ThemedText type='defaultSemiBold'>{itinerary.title}</ThemedText>
          {itinerary.status === 'ongoing' ? (
            <ThemedText style={{opacity: .7}}>Ongoing</ThemedText>
          ) : (
            <ThemedText style={{opacity: .7}}>Upcoming</ThemedText>
          )}
          <View style={styles.typesContainer}>
            <ThemedIcons library="MaterialIcons" name="edit-calendar" size={15}/>
            <ThemedText style={styles.type}>{itinerary.type}</ThemedText>
            <ThemedIcons library="MaterialDesignIcons" name="calendar" size={15}/>
            <ThemedText style={styles.type}>{itinerary.startDate?.slice(0,10)}  to  {itinerary.endDate?.slice(0,10)}</ThemedText>
          </View>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <Header 
        label="Itineraries" 
        rightButton={
          <OptionsPopup options={[
            <TouchableOpacity onPress={() => router.push('/itineraries/itineraries-history')} style={styles.options}>
              <ThemedIcons library="MaterialIcons" name="history" size={22} color="#222" />
              <ThemedText>View History</ThemedText>
            </TouchableOpacity>
          ]}> 
            <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22} color="#222" />
          </OptionsPopup>
        }
      />
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {loading && (
          <ActivityIndicator size="large" style={{ marginTop: 20 }} />
        )}
        
        {error && (
          <ThemedView style={{ padding: 16, alignItems: 'center' }}>
            <ThemedIcons library="MaterialIcons" name="error" size={24} color="red" />
            <ThemedText style={{ marginTop: 8, textAlign: 'center' }}>{error}</ThemedText>
          </ThemedView>
        )}

        {!loading && !error && (
          <>
            {/* Ongoing Itineraries Section */}
            {ongoingItineraries.length > 0 && ongoingItineraries.map(renderItineraryItem)}

            {/* Upcoming Itineraries Section */}
            {upcomingItineraries.length > 0 && upcomingItineraries.map(renderItineraryItem)}

            {/* No itineraries message */}
            {ongoingItineraries.length === 0 && upcomingItineraries.length === 0 && (
              <ThemedView style={{ padding: 16, alignItems: 'center' }}>
                <ThemedText>No ongoing or upcoming itineraries found.</ThemedText>
              </ThemedView>
            )}
          </>
        )}
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
  itineraryRow:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  type:{
    marginLeft: 2,
    marginRight: 10,
    fontSize: 13,
    opacity: .5
  },
  typesContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  options:{
    flexDirection: 'row',
    gap: 10,
    padding: 5,
    flex: 1
  }
});