import Header from '@/components/Header';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import RoundedButton from '@/components/RoundedButton';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSession } from '@/context/SessionContext';
import { useState, useEffect } from 'react';
import { groupsApiService } from '@/services/groupsApiService';
import EmptyMessage from '@/components/EmptyMessage';
import { useItinerary, Itinerary } from '@/context/ItineraryContext';

export default function LinkItineraryToGroup() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const [filteredItineraries, setFilteredItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const { itineraries } = useItinerary();
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  
  const groupID = params.groupID as string;

  // Filter itineraries from context
  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      // Filter itineraries based on requirements:
      // 1. Only current user's itineraries
      // 2. Only current/future dates (startDate >= today)
      // 3. Exclude completed and cancelled status
      const filtered = itineraries.filter((itinerary) => {
        // Check if it belongs to current user
        if (itinerary.userID !== session?.user?.id) {
          return false;
        }
        
        // Check if status is not completed or cancelled
        if (itinerary.status === 'completed' || itinerary.status === 'cancelled') {
          return false;
        }
        
        // Check if start date is current or future
        const startDate = new Date(itinerary.startDate);
        startDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
        
        return startDate >= currentDate;
      });
      
      // Sort by start date (earliest first)
      filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      
      setFilteredItineraries(filtered);
    } catch (error) {
      console.error('Error filtering itineraries:', error);
      setFilteredItineraries([]);
    } finally {
      setLoading(false);
    }
  }, [itineraries, session?.user?.id]);

  // Handle itinerary selection
  const handleItinerarySelect = (itinerary: Itinerary) => {
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
        ) : filteredItineraries.length === 0 ? (
          <EmptyMessage iconLibrary='MaterialDesignIcons' iconName='note-remove'
          title='No Available Itineraries'
          description="You have no current or upcoming itineraries available for linking."
          />
        ) : (
          <>
          {filteredItineraries.map((itinerary) => (
              <TouchableOpacity
                key={itinerary.id}
                style={[
                  styles.itineraryCard,
                  selectedItinerary?.id === itinerary.id && {
                    borderColor: accentColor,
                    borderWidth: 2,
                    backgroundColor: `${accentColor}20`
                  },
                  {backgroundColor: primaryColor}

                ]}
                onPress={() => handleItinerarySelect(itinerary)}
              >
                <View style={styles.itineraryHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.itineraryTitle}>
                    {itinerary.title || 'Untitled Itinerary'}
                  </ThemedText>
                  <ThemedText style={styles.itineraryDate}>
                    {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
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
                  <ThemedText style={styles.itineraryDays}>
                    {Math.ceil((new Date(itinerary.endDate).getTime() - new Date(itinerary.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day{Math.ceil((new Date(itinerary.endDate).getTime() - new Date(itinerary.startDate).getTime()) / (1000 * 60 * 60 * 24)) !== 0 ? 's' : ''}
                  </ThemedText>
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