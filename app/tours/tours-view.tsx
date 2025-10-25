import BottomSheet from '@/components/BottomSheet';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ThemedIcons from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useSession } from '@/context/SessionContext';
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { getItinerariesById } from '@/services/itinerariesApiService';
import EmptyMessage from '@/components/EmptyMessage';
import ItineraryMap from '@/components/maps/ItineraryMap';
import { LinearGradient } from 'expo-linear-gradient';
import BackButton from '@/components/custom/BackButton';
import OptionsPopup from '@/components/OptionsPopup';
import TourMap from '@/components/maps/TourMap';
import TourChat from './tours-chat';
import { useTourLocation } from '@/hooks/useTourLocation';
import Switch from '@/components/Switch';
import GradientBlobs from '@/components/GradientBlobs';

export default function TourView() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const backgroundColor = useThemeColor({}, 'background');
  const accentColor = useThemeColor({}, 'accent');
  const { session } = useSession();
  const [selectedButton, setSelectedButton] = useState('members');
  const [itineraryData, setItineraryData] = useState(null);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [tourData, setTourData] = useState<any>(null);
  const [loadingTour, setLoadingTour] = useState(true);
  const [lastTourFetchTime, setLastTourFetchTime] = useState<number>(0);
  const [forceTourRefresh, setForceTourRefresh] = useState(false);
  
  // Get tour ID from params
  const tourID = params.tourID as string;
  const tourDataParam = params.tourData as string;

  // Cache configuration
  const TOUR_CACHE_DURATION = 30000; // 30 seconds cache

  // Auto-send location updates every 10 seconds
  const { isSharingLocation, toggleLocationSharing } = useTourLocation({ tourId: tourID, enabled: !!tourID });

  // Check if tour data is stale and needs refresh
  const isTourDataStale = () => {
    const now = Date.now();
    return (now - lastTourFetchTime) > TOUR_CACHE_DURATION || forceTourRefresh;
  };

  // Function to fetch tour data
  const fetchTourData = async (forceRefresh = false) => {
    if (!tourID && !tourDataParam) return;
    
    // Skip fetch if data is fresh and not forcing refresh
    if (!forceRefresh && !isTourDataStale() && tourData) {
      console.log('📋 Using cached tour data');
      return;
    }
    
    setLoadingTour(true);
    try {
      if (tourDataParam) {
        const parsed = JSON.parse(tourDataParam);
        setTourData(parsed);
        setLastTourFetchTime(Date.now());
        setForceTourRefresh(false);
      } else if (tourID) {
        // TODO: Fetch tour data from API using tourID
        console.log('🔍 Fetching tour data for ID:', tourID);
      }
    } catch (error) {
      console.error('❌ Error loading tour data:', error);
    } finally {
      setLoadingTour(false);
    }
  };

  // Load tour data on component mount
  useEffect(() => {
    fetchTourData();
  }, [tourID, tourDataParam]);

  // Listen for focus events to refresh data when returning from other screens
  useFocusEffect(
    useCallback(() => {
      setItineraryData(null);
      if (isTourDataStale()) {
        fetchTourData(true);
      }
    }, [lastTourFetchTime, forceTourRefresh])
  );

  // Function to fetch itinerary data
  const fetchItinerary = async () => {
    if (!tourData?.itineraryID || !session?.accessToken) return;
    
    setLoadingItinerary(true);
    try {
      const result = await getItinerariesById(tourData.itineraryID, session.accessToken);
      if (result.success) {
        setItineraryData(result.data);
      } else {
        console.error('Failed to fetch itinerary:', result.errorMessage);
      }
    } catch (error) {
      console.error('Error fetching itinerary:', error);
    } finally {
      setLoadingItinerary(false);
    }
  };

  // Auto-load itinerary when tour data changes
  useEffect(() => {
    if (tourData) {
      // If tour already has embedded itineraryData, use it
      if (tourData.itineraryData) {
        console.log('✅ Using embedded itinerary data from tour');
        setItineraryData(tourData.itineraryData);
      }
      // Otherwise, fetch it if we have an itineraryID
      else if (tourData.itineraryID && selectedButton === 'itinerary' && !itineraryData) {
        console.log('🔍 Fetching itinerary data using ID:', tourData.itineraryID);
        fetchItinerary();
      }
    }
  }, [tourData, selectedButton]);

  // Handle button selection and fetch itinerary if needed
  const handleButtonPress = (buttonType: string) => {
    setSelectedButton(buttonType);
    // Only fetch if we don't have embedded data and have an ID
    if (buttonType === 'itinerary' && !tourData?.itineraryData && tourData?.itineraryID && !itineraryData) {
      fetchItinerary();
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loadingTour) {
    return (
      <ThemedView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" />
        <ThemedText style={{marginTop: 10}}>Loading tour details...</ThemedText>
      </ThemedView>
    );
  }

  if (!tourData) {
    return (
      <ThemedView style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ThemedText>Tour data not found</ThemedText>
      </ThemedView>
    );
  }

  const approvedMembers = tourData.participants?.members?.filter((m: any) => m.isApproved) || [];
  const tourGuides = tourData.participants?.tourGuides || [];
  const allParticipants = [...tourGuides, ...approvedMembers];
  const totalParticipants = allParticipants.length;
  
  // Check if current user is a tour guide
  const isCurrentUserGuide = tourGuides.some((guide: any) => guide.userID === session?.user?.id);
  
  // Render member/guide item
  const renderParticipantItem = (participant: any, isTourGuide: boolean = false) => (
    <View key={participant.userID} style={styles.memberItem}>
      <Image
        source={{ uri: participant.profileImage || 'https://ui-avatars.com/api/?name=' + participant.name }}
        style={styles.memberImage}
      />
      <View style={{flex: 1}}>
        <ThemedText type="defaultSemiBold">{participant.name}</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>@{participant.username}</ThemedText>
        <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
          {isTourGuide ? 'Tour Guide' : 'Member'}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={{flex: 1}}>
      {/* Default TourMap background - always rendered */}
      <TourMap 
        tourId={tourID} 
        tourParticipants={allParticipants}
      />
      
      {/* ItineraryMap overlay - only when itinerary data is successfully loaded */}
      {itineraryData && selectedButton === 'itinerary' && (
        <View style={styles.mapOverlay}>
          <ItineraryMap itinerary={itineraryData} />
        </View>
      )}

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#000', 'transparent']}
          style={styles.headerGradient}
          pointerEvents="none"
        />
        <View style={styles.headerContent}>
          <OptionsPopup options={[
            <TouchableOpacity style={styles.options} onPress={() => {}}>
              <ThemedIcons library="MaterialIcons" name="info" size={20} />
              <ThemedText>Tour Info</ThemedText>
            </TouchableOpacity>,
          ]} style={styles.optionsButton}> 
            <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22} color="#fff" />
          </OptionsPopup>
          <BackButton type='close-floating' color='white'/>
          <ThemedText type="subtitle" style={{color: '#fff'}}>
            {tourData.name}
          </ThemedText>
          <View style={styles.tourStats}>
            {tourData.itineraryData && (
              <View style={styles.statItem}>
                <ThemedIcons library='MaterialIcons' name='calendar-today' size={16} color='#fff'/>
                <ThemedText style={styles.statText}>
                  {formatDate(tourData.itineraryData.startDate)} - {formatDate(tourData.itineraryData.endDate)}
                </ThemedText>
              </View>
            )}
            <View style={styles.statItem}>
              <ThemedIcons library='MaterialIcons' name='people' size={16} color='#fff'/>
              <ThemedText style={styles.statText}>
                {totalParticipants} participant{totalParticipants !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.buttonRow}
            style={{pointerEvents: 'auto'}}
          >
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: selectedButton === 'members' ? accentColor : 'rgba(0,0,0,0.5)'}]} 
              onPress={() => handleButtonPress('members')}
            >
              <ThemedText style={{color: selectedButton === 'members' ? '#222' : '#fff'}}>Members</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: selectedButton === 'itinerary' ? accentColor : 'rgba(0,0,0,0.5)'}]} 
              onPress={() => handleButtonPress('itinerary')}
            >
              <ThemedText style={{color: selectedButton === 'itinerary' ? '#222' : '#fff'}}>Itinerary</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, {backgroundColor: selectedButton === 'chat' ? accentColor : 'rgba(0,0,0,0.5)'}]} 
              onPress={() => handleButtonPress('chat')}
            >
              <ThemedText style={{color: '#fff'}}>Chat</ThemedText>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    
      <View style={styles.content}>
        {selectedButton === 'members' && (
          <BottomSheet snapPoints={[0.3, 0.6, 1]} defaultIndex={1} style={{zIndex: 100000}}>
            <ScrollView>
              {/* Share Location Toggle */}
              <ThemedView color='primary' shadow style={styles.shareLocationContainer}>
                <GradientBlobs/>
                <View style={{zIndex: 10}}>
                  <Switch
                    label="Share My Location"
                    description={isSharingLocation ? 'Your location is visible to tour participants' : 'Your location is hidden from tour participants'}
                    value={isSharingLocation}
                    onValueChange={toggleLocationSharing}
                  />
                </View>
              </ThemedView>

              <ThemedText type="defaultSemiBold" style={{ marginTop: 20, marginBottom: 10, opacity: 0.7, paddingHorizontal: 16 }}>
                Tour Guides ({tourGuides.length})
              </ThemedText>
              {tourGuides.map((guide: any) => renderParticipantItem(guide, true))}
            
              <ThemedText type="defaultSemiBold" style={{ marginTop: 20, marginBottom: 10, opacity: 0.7, paddingHorizontal: 16 }}>
                Members ({approvedMembers.length})
              </ThemedText>
              {approvedMembers.length > 0 ? (
                approvedMembers.map((member: any) => renderParticipantItem(member, false))
              ) : (
                <EmptyMessage 
                  iconLibrary='MaterialIcons' 
                  iconName='people-outline'
                  title='No Members Yet'
                  description="No members have joined this tour yet."
                />
              )}
            </ScrollView>
          </BottomSheet>
        )}

        {selectedButton === 'itinerary' && (
          <>
            {loadingItinerary && (
              <BottomSheet snapPoints={[0.3, 0.6, 1]} defaultIndex={1} style={{zIndex: 100000}}>
                <ActivityIndicator size="small" />
              </BottomSheet>
            )}
            {!loadingItinerary && !itineraryData && (
              <BottomSheet snapPoints={[0.3, 0.6, 1]} defaultIndex={1} style={{zIndex: 100000}}>
                <EmptyMessage 
                  iconLibrary='MaterialDesignIcons' 
                  iconName='note-remove'
                  title='Error Loading Itinerary'
                  description="Failed to load itinerary details."
                />
              </BottomSheet>
            )}
            {!tourData.itineraryID && !tourData.itineraryData && (
              <BottomSheet snapPoints={[0.3, 0.6, 1]} defaultIndex={1} style={{zIndex: 100000}}>
                <EmptyMessage 
                  iconLibrary='MaterialDesignIcons' 
                  iconName='note-remove'
                  title='No Itinerary Linked'
                  description="This tour doesn't have an associated itinerary yet."
                />
              </BottomSheet>
            )}
          </>
        )}

        {selectedButton === 'chat' && (
          <TourChat tourData={tourData} />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tourStats: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 3,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#fff',
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  memberImage:{
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginRight: 15
  },
  buttonRow:{
    flexDirection: 'row',
    gap: 10,
    height: 35,
    zIndex: 10000,
    marginTop: 10,
  },
  button:{
    borderRadius: 30,
    paddingVertical: 7,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },
  optionsButton:{
    position: 'absolute',
    right: 35,
    top: -6,
    padding: 5,
    zIndex: 100
  },
  options:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
  },
  headerContainer:{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingBottom: 20,
    pointerEvents: 'box-none',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    padding: 16,
    paddingTop: 25,
    pointerEvents: 'box-none',
  },
  content:{
    width: '100%',
    height: Dimensions.get('window').height-145,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 10,
  },
  shareLocationContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
