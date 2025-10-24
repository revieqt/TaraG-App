import OptionsPopup from '@/components/OptionsPopup';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import BackButton from '@/components/custom/BackButton';
import {
  getItinerariesById,
  useDeleteItinerary,
  useMarkItineraryAsDone,
  useCancelItinerary,
} from '@/services/itinerariesApiService';
import { useSession } from '@/context/SessionContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { groupsApiService } from '@/services/groupsApiService';
import TextField from '@/components/TextField';
import Button from '@/components/Button';
import ItineraryMap from '@/components/maps/ItineraryMap';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDateToString } from '@/utils/formatDateToString';

export default function ItineraryViewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useSession();
  const { getItineraryById } = useItinerary();
  const { deleteItineraryComplete } = useDeleteItinerary();
  const { markItineraryAsDoneComplete } = useMarkItineraryAsDone();
  const { cancelItineraryComplete } = useCancelItinerary();
  const [itinerary, setItinerary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadItinerary = async () => {
      if (!id) {
        setError('No itinerary ID provided.');
        setItinerary(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // First, search in local ItineraryContext
        console.log('🔍 Searching for itinerary ID in local context:', id);
        const localItinerary = getItineraryById(id);
        
        if (localItinerary) {
          console.log('✅ Found itinerary in local context:', localItinerary.title);
          setItinerary(localItinerary);
          setLoading(false);
          return;
        }

        // If not found locally, fetch from backend
        console.log('🌐 Itinerary not found locally, fetching from backend...');
        if (!session?.accessToken) {
          setError('Authentication required to fetch itinerary.');
          setLoading(false);
          return;
        }

        const result = await getItinerariesById(id, session.accessToken);
        
        if (result.success && result.data) {
          console.log('✅ Found itinerary in backend:', result.data.title);
          setItinerary(result.data);
        } else {
          console.log('❌ Itinerary not found in backend');
          setError(result.errorMessage || 'Itinerary not found.');
          setItinerary(null);
        }
      } catch (err: any) {
        console.error('❌ Error loading itinerary:', err);
        setError(err.message || 'Failed to load itinerary.');
        setItinerary(null);
      } finally {
        setLoading(false);
      }
    };

    loadItinerary();
  }, [id, getItineraryById, session?.accessToken]);

  const getAllLocations = () => {
    if (!itinerary?.locations) return [];
    const locations: any[] = [];
    itinerary.locations.forEach((day: any, dayIndex: number) => {
      if (Array.isArray(day.locations)) {
        day.locations.forEach((location: any, locIndex: number) => {
          if (location.latitude && location.longitude) {
            locations.push({
              ...location,
              dayIndex,
              locIndex,
              label: `${dayIndex + 1}.${locIndex + 1}`,
            });
          }
        });
      } else if (day.latitude && day.longitude) {
        locations.push({
          ...day,
          dayIndex: 0,
          locIndex: dayIndex,
          label: `${dayIndex + 1}`,
        });
      }
    });
    return locations;
  };

  // Handlers for actions
  const handleMarkAsCompleted = async () => {
    if (!itinerary?.id) {
      Alert.alert('Error', 'No itinerary available');
      return;
    }
    setLoading(true);
    const result = await markItineraryAsDoneComplete(itinerary.id);
    setLoading(false);
    if (result.success) {
      setItinerary({ ...itinerary, status: 'completed', manuallyUpdated: true });
      Alert.alert('Success', 'Itinerary marked as completed.');
      router.replace('/itineraries/itineraries');
    } else {
      setError(result.errorMessage || 'Failed to mark as completed');
    }
  };

  const handleCancel = async () => {
    if (!itinerary?.id) {
      Alert.alert('Error', 'No itinerary available');
      return;
    }
    setLoading(true);
    const result = await cancelItineraryComplete(itinerary.id);
    setLoading(false);
    if (result.success) {
      setItinerary({ ...itinerary, status: 'cancelled', manuallyUpdated: true });
      Alert.alert('Success', 'Itinerary cancelled.');
      router.replace('/itineraries/itineraries');
    } else {
      setError(result.errorMessage || 'Failed to cancel itinerary');
    }
  };

  const handleDelete = async () => {
    if (!itinerary?.id) return;
    Alert.alert(
      'Delete Itinerary',
      'Are you sure you want to delete this itinerary? Doing so will remove the itinerary permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            setLoading(true);
            const result = await deleteItineraryComplete(itinerary.id);
            setLoading(false);
            if (result.success) {
              Alert.alert('Deleted', 'Itinerary deleted.');
              router.replace('/itineraries/itineraries');
            } else {
              setError(result.errorMessage || 'Failed to delete itinerary');
            }
          }
        }
      ]
    );
  };

  const handleGoToUpdateForm = () => {
    if (!itinerary || typeof itinerary !== 'object') {
      Alert.alert('Error', 'No itinerary data to update.');
      return;
    }
    router.push({
      pathname: '/itineraries/itineraries-update',
      params: { itineraryData: JSON.stringify(itinerary) }
    });
  };

  const handleRepeatItinerary = () => {
    if (!itinerary || typeof itinerary !== 'object') {
      Alert.alert('Error', 'No itinerary data to repeat.');
      return;
    }
    
    // Create a copy of the itinerary without startDate and endDate, and set status to pending
    const itineraryToRepeat = {
      ...itinerary,
      startDate: undefined,
      endDate: undefined,
      status: 'pending'
    };
    
    router.push({
      pathname: '/itineraries/itineraries-update',
      params: { itineraryData: JSON.stringify(itineraryToRepeat) }
    });
  };

  const handleCreateGroupWithItinerary = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!session?.accessToken || !session?.user) {
      Alert.alert('Error', 'Please log in to create a group');
      return;
    }

    if (!itinerary?.id) {
      Alert.alert('Error', 'No itinerary available to link to group');
      return;
    }

    try {
      setCreatingGroup(true);
      
      // Combine name parts
      const fullName = [
        session.user.fname,
        session.user.mname,
        session.user.lname
      ].filter(Boolean).join(' ');

      const createGroupData = {
        groupName: groupName.trim(),
        userID: session.user.id,
        username: session.user.username,
        name: fullName,
        profileImage: session.user.profileImage || '',
        itineraryID: itinerary.id,
      };

      const result = await groupsApiService.createGroupWithItinerary(session.accessToken, createGroupData);
      
      Alert.alert(
        'Group Created!', 
        `Group "${groupName}" has been created successfully with your itinerary!\n\nInvite Code: ${result.inviteCode}\n\nShare this code with friends to invite them to your group trip.`,
        [
          {
            text: 'Copy Code',
            onPress: () => {
              console.log('Invite code:', result.inviteCode);
            }
          },
          { text: 'OK' }
        ]
      );
      
      setGroupName('');
    } catch (error) {
      console.error('Error creating group with itinerary:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const showFirstOptions =
    itinerary && (itinerary.status === 'pending');

  return (
    <View style={{ flex: 1 }}>
      <ItineraryMap itinerary={itinerary} />
      <LinearGradient
        colors={['#000', 'transparent']}
        style={styles.headerGradient}
      >
        {showFirstOptions ? (
          <OptionsPopup
            options={[
              <OptionsPopup
                key="createGroupTrip"
                style={styles.createGroupTrip}
                options={[
                  <View key="header">
                    <ThemedText type='subtitle'>Create Group Trip</ThemedText>
                    <ThemedText>Create a group with this itinerary and invite your friends</ThemedText>
                  </View>,
                  <View style={{flex: 1}} key="form">
                    <TextField
                      placeholder="Enter Group Name"
                      value={groupName}
                      onChangeText={setGroupName}
                      onFocus={() => {}}
                      onBlur={() => {}}
                      isFocused={false}
                      autoCapitalize="words"
                    />
                    <Button
                      title={creatingGroup ? 'Creating...' : 'Create Group'}
                      type='primary'
                      onPress={handleCreateGroupWithItinerary}
                      disabled={creatingGroup}
                    />
                  </View>
                ]}
              >
                <ThemedIcons library="MaterialIcons" name="group" size={20}/>
                <ThemedText>Create a Group Trip with this Itinerary</ThemedText>
              </OptionsPopup>,
              <TouchableOpacity style={styles.optionsChild} onPress={handleGoToUpdateForm}>
                <ThemedIcons library="MaterialIcons" name="edit" size={20} />
                <ThemedText>Update Itinerary</ThemedText>
              </TouchableOpacity>,
              <TouchableOpacity style={styles.optionsChild} onPress={handleMarkAsCompleted}>
                <ThemedIcons library="MaterialIcons" name="check" size={20} />
                <ThemedText>Mark Itinerary as Completed</ThemedText>
              </TouchableOpacity>,
              <TouchableOpacity style={styles.optionsChild} onPress={handleCancel}>
                <ThemedIcons library="MaterialIcons" name="cancel" size={20} />
                <ThemedText>Cancel Itinerary</ThemedText>
              </TouchableOpacity>,
              <TouchableOpacity style={styles.optionsChild} onPress={handleDelete}>
                <ThemedIcons library="MaterialIcons" name="delete" size={20} />
                <ThemedText>Delete Itinerary</ThemedText>
              </TouchableOpacity>,
            ]}
            style={styles.options}
          >
            <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={20} color="#fff" />
          </OptionsPopup>
        ) : (
          <OptionsPopup
            options={[
              <TouchableOpacity style={styles.optionsChild} onPress={handleRepeatItinerary}>
                <ThemedIcons library="MaterialIcons" name="history" size={20} />
                <ThemedText>Repeat Itinerary</ThemedText>
              </TouchableOpacity>,
              <TouchableOpacity style={styles.optionsChild} onPress={handleDelete}>
                <ThemedIcons library="MaterialIcons" name="delete" size={20} />
                <ThemedText>Delete Itinerary</ThemedText>
              </TouchableOpacity>
            ]}
            style={styles.options}
          >
            <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={20} color="#fff" />
          </OptionsPopup>
        )}

        <BackButton type="close-floating" color="#fff"/>
        <ThemedText type='subtitle' style={{ color: '#fff'}}>
          {itinerary?.title}
        </ThemedText>
        <View style={styles.detailsContainer}>
          <ThemedIcons library="MaterialDesignIcons" name="calendar" size={13} color="#fff"/>
          <ThemedText style={{ color: '#fff', fontSize: 11 }}>
            {formatDateToString(itinerary?.startDate)} - {formatDateToString(itinerary?.endDate)}
          </ThemedText>
        </View>
        <View style={styles.detailsContainer}>
          <ThemedIcons library="MaterialIcons" name="edit-calendar" size={13} color="#fff"/>
          <ThemedText style={{ color: '#fff', fontSize: 11 }}>
            {itinerary?.type}
          </ThemedText>
        </View>
        <View style={styles.detailsContainer}>
          <ThemedIcons library="MaterialIcons" name="person" size={13} color="#fff"/>
          <ThemedText style={{ color: '#fff', fontSize: 11 }}>
            Created by {itinerary?.username}
          </ThemedText>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    position: 'absolute',
    top: 0,
    right: 30,
    zIndex: 10,
    padding: 8,
  },
  optionsChild:{
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  createGroupTrip:{
    flexDirection: 'row',
    height: 20,
    gap: 10,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 50,
    gap: 3,
    zIndex: 1,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});