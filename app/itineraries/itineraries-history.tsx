import Header from '@/components/Header';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getItinerariesByUserAndStatus } from '@/services/itinerariesApiService';
import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View, ScrollView } from 'react-native';

export default function ItinerariesHistoryScreen() {
  const { session } = useSession();
  const [cancelledItineraries, setCancelledItineraries] = useState<any[]>([]);
  const [completedItineraries, setCompletedItineraries] = useState<any[]>([]);
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
        // Fetch cancelled and completed itineraries separately
        const [cancelledResult, completedResult] = await Promise.all([
          getItinerariesByUserAndStatus(session.user.id, 'cancelled', session.accessToken),
          getItinerariesByUserAndStatus(session.user.id, 'completed', session.accessToken)
        ]);

        if (cancelledResult.success) {
          setCancelledItineraries(cancelledResult.data || []);
        } else {
          setError(cancelledResult.errorMessage || 'Failed to fetch cancelled itineraries');
        }

        if (completedResult.success) {
          setCompletedItineraries(completedResult.data || []);
        } else {
          setError(completedResult.errorMessage || 'Failed to fetch completed itineraries');
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
          {itinerary.status === 'cancelled' ? (
            <ThemedText style={{opacity: .7}}>Cancelled</ThemedText>
          ) : (
            <ThemedText style={{opacity: .7}}>Completed</ThemedText>
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
        label="History"
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
            {/* Cancelled Itineraries Section */}
            {cancelledItineraries.length > 0 && cancelledItineraries.map(renderItineraryItem)}

            {/* Completed Itineraries Section */}
            {completedItineraries.length > 0 && completedItineraries.map(renderItineraryItem)}

            {/* No itineraries message */}
            {cancelledItineraries.length === 0 && completedItineraries.length === 0 && (
              <ThemedView style={{ padding: 16, alignItems: 'center' }}>
                <ThemedText>No cancelled or completed itineraries found.</ThemedText>
              </ThemedView>
            )}
          </>
        )}
      </ScrollView>
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
});