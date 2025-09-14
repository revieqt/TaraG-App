import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import RoundedButton from '@/components/RoundedButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { useState, useEffect } from 'react';
import { getItinerariesByUserAndStatus } from '@/services/itinerariesApiService';
import { groupsApiService } from '@/services/groupsApiService';
import EmptyMessage from '@/components/EmptyMessage';

export default function LinkItineraryToGroup() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const [itineraries, setItineraries] = useState<any[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  
  const groupID = params.groupID as string;

  // Fetch user's itineraries
  useEffect(() => {
    const fetchItineraries = async () => {
      if (!session?.accessToken || !session?.user?.id) return;
      
      setLoading(true);
      try {
        // Fetch ongoing and upcoming itineraries
        const [ongoingResult, upcomingResult] = await Promise.all([
          getItinerariesByUserAndStatus(session.user.id, 'ongoing', session.accessToken),
          getItinerariesByUserAndStatus(session.user.id, 'upcoming', session.accessToken)
        ]);
        
        const combinedItineraries = [];
        
        if (ongoingResult.success && ongoingResult.data) {
          combinedItineraries.push(...ongoingResult.data);
        }
        
        if (upcomingResult.success && upcomingResult.data) {
          combinedItineraries.push(...upcomingResult.data);
        }
        
        setItineraries(combinedItineraries);
        
        if (!ongoingResult.success && !upcomingResult.success) {
          console.error('Failed to fetch itineraries:', ongoingResult.errorMessage || upcomingResult.errorMessage);
        }
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [session]);

  // Handle itinerary selection
  const handleItinerarySelect = (itinerary: any) => {
    setSelectedItinerary(itinerary);
  };

  // Handle linking itinerary to group
  const handleLinkItinerary = async () => {
    if (!selectedItinerary || !session?.accessToken || !session?.user?.id) return;
    
    try {
      await groupsApiService.linkGroupItinerary(session.accessToken, {
        groupID: groupID,
        itineraryID: selectedItinerary.id,
        adminID: session.user.id
      });
      
      Alert.alert(
        'Success',
        'Itinerary has been linked to the group successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error linking itinerary:', error);
      Alert.alert('Error', 'Failed to link itinerary. Please try again.');
    }
  };

  return (
    <ThemedView style={{flex: 1}}>
      <Header label='Select an Itinerary'/>
      
      <ScrollView style={{flex: 1, padding: 20}} showsVerticalScrollIndicator={false}>
        {loading ? (
          <EmptyMessage
          title='Loading'
          description="Please wait while we fetch your itineraries."
          loading
          />
        ) : itineraries.length === 0 ? (
          <EmptyMessage iconLibrary='MaterialDesignIcons' iconName='note-remove'
          title='No Itinerary Found'
          description="You have no upcoming or incoming itineraries."
          />
        ) : (
          <>
          {itineraries.map((itinerary) => (
              <TouchableOpacity
                key={itinerary.id}
                style={[
                  styles.itineraryCard,
                  selectedItinerary?.id === itinerary.id && {
                    borderColor: accentColor,
                    borderWidth: 2,
                    backgroundColor: `${accentColor}20`
                  }
                ]}
                onPress={() => handleItinerarySelect(itinerary)}
              >
                <View style={styles.itineraryHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.itineraryTitle}>
                    {itinerary.title || 'Untitled Itinerary'}
                  </ThemedText>
                  <ThemedText style={styles.itineraryDate}>
                    {new Date(itinerary.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                
                {itinerary.description && (
                  <ThemedText style={styles.itineraryDescription} numberOfLines={2}>
                    {itinerary.description}
                  </ThemedText>
                )}
                
                <View style={styles.itineraryFooter}>
                  <ThemedText style={styles.itineraryStatus}>
                    Status: {itinerary.status}
                  </ThemedText>
                  {itinerary.days && (
                    <ThemedText style={styles.itineraryDays}>
                      {itinerary.days.length} day{itinerary.days.length !== 1 ? 's' : ''}
                    </ThemedText>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
      
      {selectedItinerary && (
        <RoundedButton
          iconLibrary="MaterialIcons"
          iconName="check"
          iconColor="white"
          size={60}
          iconSize={30}
          onPress={handleLinkItinerary}
          style={styles.confirmButton}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  itineraryCard: {
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itineraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itineraryTitle: {
    flex: 1,
    marginRight: 10,
  },
  itineraryDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  itineraryDescription: {
    marginBottom: 10,
    opacity: 0.8,
    lineHeight: 18,
  },
  itineraryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itineraryStatus: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  itineraryDays: {
    fontSize: 12,
    opacity: 0.7,
  },
  confirmButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
});