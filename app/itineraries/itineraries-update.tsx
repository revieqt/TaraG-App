import Button from '@/components/Button';
import DatePicker from '@/components/DatePicker';
import DropDownField from '@/components/DropDownField';
import LocationAutocomplete, { LocationItem } from '@/components/LocationAutocomplete';
import LocationDisplay from '@/components/LocationDisplay';
import TextField from '@/components/TextField';
import ThemedIcons from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { useUpdateItinerary } from '@/services/itinerariesApiService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import CubeButton from '@/components/RoundedButton'
import Switch from '@/components/Switch';
import BackButton from '@/components/custom/BackButton';
import ProcessModal from '@/components/modals/ProcessModal';

const ITINERARY_TYPES = [
  { label: 'Solo', value: 'Solo' },
  { label: 'Group', value: 'Group' },
  { label: 'Family', value: 'Family' },
  { label: 'Business', value: 'Business' },
];

interface DailyLocation {
  date: Date | null;
  locations: LocationItem[];
}

// Helper to generate days between two dates (inclusive)
function getDatesBetween(start: Date, end: Date): Date[] {
  const dates = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Helper to get the number of days between two dates (inclusive)
function getNumDays(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export default function UpdateItineraryScreen() {
  const { session } = useSession();
  const { updateItineraryComplete } = useUpdateItinerary();
  const router = useRouter();
  const params = useLocalSearchParams<{ itineraryData: string; returnTo?: string; groupID?: string }>();
  const [descriptionHeight, setDescriptionHeight] = useState(60);

  // State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Solo');
  const [planDaily, setPlanDaily] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [dailyLocations, setDailyLocations] = useState<DailyLocation[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentDayIdx, setCurrentDayIdx] = useState<number | null>(null);
  const [editingLocationIdx, setEditingLocationIdx] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [modalLocationName, setModalLocationName] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalLocationData, setModalLocationData] = useState<Partial<LocationItem>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [itineraryId, setItineraryId] = useState<string>('');
  const [status, setStatus] = useState<string>('pending');

  // Populate fields from params
  useEffect(() => {
    if (params.itineraryData) {
      try {
        const data = JSON.parse(params.itineraryData);
        setItineraryId(data.id || '');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setType(data.type || 'Solo');
        setStatus(data.status || 'pending');
        setPlanDaily(!!data.planDaily);
        setStartDate(data.startDate ? new Date(data.startDate) : null);
        setEndDate(data.endDate ? new Date(data.endDate) : null);

        if (data.planDaily && Array.isArray(data.locations)) {
          setDailyLocations(
            data.locations.map((d: any) => ({
              date: d.date ? new Date(d.date) : null,
              locations: Array.isArray(d.locations) ? d.locations : [],
            }))
          );
        } else if (Array.isArray(data.locations)) {
          setLocations(Array.isArray(data.locations) ? data.locations : []);
        } else {
          setLocations([]);
        }
      } catch (err) {
        setErrorMessage('Failed to load itinerary data for update.');
      }
    }
  }, [params.itineraryData]);

  // For daily plan, auto-generate days from startDate to endDate
  let autoDailyLocations: DailyLocation[] = dailyLocations;
  if (planDaily && startDate && endDate && startDate <= endDate) {
    const days = getDatesBetween(startDate, endDate);
    autoDailyLocations = days.map((date, idx) => {
      const existing = dailyLocations.find(d => d.date && d.date.toDateString() === date.toDateString());
      return existing || { date, locations: [] };
    });
  }

  // Calculate number of days between startDate and endDate
  const numDays = startDate && endDate ? getNumDays(startDate, endDate) : 0;

  // If only 1 day, force planDaily to false
  useEffect(() => {
    if (numDays <= 1 && planDaily) {
      setPlanDaily(false);
    }
  }, [numDays]);

  // Add a location to a day
  const addLocationToDay = (dayIdx: number, loc: LocationItem) => {
    const dayDate = autoDailyLocations[dayIdx]?.date;
    if (!dayDate) return;
    let updated = [...dailyLocations];
    let idx = updated.findIndex(d => d.date && d.date.toDateString() === dayDate.toDateString());
    if (idx === -1) {
      updated.push({ date: dayDate, locations: [loc] });
    } else {
      updated[idx] = {
        ...updated[idx],
        locations: [...updated[idx].locations, loc],
      };
    }
    setDailyLocations(updated);
  };

  // Add a location for non-daily
  const addLocation = (loc: LocationItem) => {
    setLocations([...locations, loc]);
  };

  // Remove location (for both modes)
  const removeLocation = (dayIdx: number | null, locIdx: number) => {
    if (planDaily && dayIdx !== null) {
      const updated = [...dailyLocations];
      updated[dayIdx].locations.splice(locIdx, 1);
      setDailyLocations(updated);
    } else {
      const updated = [...locations];
      updated.splice(locIdx, 1);
      setLocations(updated);
    }
  };

  // Submit handler
  const handleSubmit = () => {
    if (!title.trim() || !startDate || !endDate || !itineraryId) {
      Alert.alert('Missing Required Fields', 'Please enter a title, start date, and end date.');
      return;
    }
    const updatedOn = new Date();
    let result = {
      userID: session?.user?.id || '',
      username: session?.user?.username || '',
      title,
      description,
      type,
      status,
      updatedOn: updatedOn.toISOString(),
      startDate: startDate ? startDate.toISOString() : null,
      endDate: endDate ? endDate.toISOString() : null,
      planDaily,
      locations: planDaily
        ? autoDailyLocations.map((d) => ({
            date: d.date ? d.date.toISOString() : null,
            locations:
              dailyLocations.find(dl => dl.date && d.date && dl.date.toDateString() === d.date.toDateString())?.locations || [],
          }))
        : locations,
    };
    setLoading(true);
    setSuccess(false);
    setErrorMessage(undefined);

    (async () => {
      const saveResult = await updateItineraryComplete(itineraryId, result);
      setLoading(false);
      setSuccess(saveResult.success);
      setErrorMessage(saveResult.errorMessage);
      
      if (saveResult.success) {
        // Handle navigation based on returnTo parameter
        if (params.returnTo === 'groups-view' && params.groupID) {
          router.replace({
            pathname: '/groups/groups-view',
            params: { groupID: params.groupID }
          });
        } else {
          // Default navigation back to itineraries list
          router.replace('/itineraries/itineraries');
        }
      }
    })();
  };

  // Modal functions
  const openLocationModal = (dayIdx: number | null) => {
    setCurrentDayIdx(dayIdx);
    setEditingLocationIdx(null);
    setIsEditMode(false);
    setModalLocationName('');
    setModalNote('');
    setModalLocationData({});
    setShowLocationModal(true);
  };

  const openEditLocationModal = (dayIdx: number | null, locIdx: number, location: LocationItem) => {
    setCurrentDayIdx(dayIdx);
    setEditingLocationIdx(locIdx);
    setIsEditMode(true);
    setModalLocationName(location.locationName || '');
    setModalNote(location.note || '');
    setModalLocationData(location);
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
    setCurrentDayIdx(null);
    setEditingLocationIdx(null);
    setIsEditMode(false);
    setModalLocationName('');
    setModalNote('');
    setModalLocationData({});
  };

  const handleAddLocationFromModal = () => {
    if (modalLocationData && modalLocationData.locationName && modalLocationData.latitude && modalLocationData.longitude) {
      const locationToAdd = { 
        ...modalLocationData, 
        note: modalNote || '' 
      } as LocationItem;

      if (isEditMode && editingLocationIdx !== null) {
        // Edit existing location
        if (planDaily && currentDayIdx !== null) {
          const dayDate = autoDailyLocations[currentDayIdx]?.date;
          if (dayDate) {
            const updated = [...dailyLocations];
            const idx = updated.findIndex(d => d.date && d.date.toDateString() === dayDate.toDateString());
            if (idx !== -1) {
              updated[idx].locations[editingLocationIdx] = locationToAdd;
              setDailyLocations(updated);
            }
          }
        } else {
          const updated = [...locations];
          updated[editingLocationIdx] = locationToAdd;
          setLocations(updated);
        }
      } else {
        // Add new location
        if (planDaily && currentDayIdx !== null) {
          addLocationToDay(currentDayIdx, locationToAdd);
        } else {
          addLocation(locationToAdd);
        }
      }
      closeLocationModal();
    }
  };

  return (
    <ThemedView color='primary' style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ThemedView style={{paddingBottom: 50}}>
            <BackButton style={{ marginTop: 20, marginLeft: 10 }}/>
            <TextField placeholder="Title" value={title} onChangeText={setTitle} 
              style={{ fontFamily: 'PoppinsBold', fontSize: 27, borderColor: 'transparent', marginBottom: 0, height: 60, backgroundColor: 'transparent'}}
            />
            <TextField placeholder="Add a Description" value={description} onChangeText={setDescription} 
              style={{ borderColor: 'transparent',backgroundColor: 'transparent', minHeight: 60, height: descriptionHeight, textAlignVertical: 'top'}}
              multiline
              onContentSizeChange={e => setDescriptionHeight(e.nativeEvent.contentSize.height)}
            />
            <View style={{paddingHorizontal: 16, marginBottom: 10}}>
              <DropDownField
                placeholder="Type"
                value={type}
                onValueChange={setType}
                values={ITINERARY_TYPES}
                style={{backgroundColor: 'transparent', fontFamily: 'PoppinsRegular'}}
              />
              <View style={styles.rowBetween}>
                <DatePicker
                  placeholder="Start Date"
                  value={startDate}
                  onChange={setStartDate}
                  minimumDate={new Date()}
                  maximumDate={endDate || undefined}
                  style={{flex: 2, backgroundColor: 'transparent'}}
                />
                <DatePicker
                  placeholder="End Date"
                  value={endDate}
                  onChange={setEndDate}
                  minimumDate={startDate || new Date()}
                  style={{flex: 2, backgroundColor: 'transparent'}}
                />
              </View>

              {numDays > 1 && (
                <Switch
                  key="planDaily"
                  label="Plan Daily?"
                  description={planDaily ? 'Yes' : 'No'}
                  value={planDaily}
                  onValueChange={(value) => {
                    setPlanDaily(value);
                    setDailyLocations([]);
                  }}
                />
              )}
            </View>
            <ThemedView color='primary' style={styles.bottomOverlay}/>
          </ThemedView>
          

          <View style={styles.locationContainer}>
            {planDaily ? (
              <>
                {autoDailyLocations.map((day, dayIdx) => (
                  <View key={dayIdx} style={styles.dayBlock}>
                    <View style={styles.rowBetween}>
                      <View style={{flex: 1, marginTop: 5}}>
                        <ThemedText type='subtitle' style={{fontSize: 16}}>Day {dayIdx + 1}</ThemedText>
                        <ThemedText style={{opacity: 0.5, marginBottom: 10, fontSize: 12}}>({day.date?.toDateString()})</ThemedText>
                      </View>
                      <TouchableOpacity style={styles.addLocationButton} onPress={() => openLocationModal(dayIdx)}>
                        <ThemedIcons library='MaterialIcons' name='add' size={15} color='#00CAFF'/>
                        <ThemedText style={{color: '#00CAFF', fontSize: 12}}>Add Location</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <LocationDisplay
                      content={day.locations.map((loc, locIdx) => (
                        <View key={locIdx} style={styles.locationRow}>
                          <TouchableOpacity 
                            style={{ flex: 1, marginBottom: 10 }}
                            onPress={() => openEditLocationModal(dayIdx, locIdx, loc)}
                          >
                            <ThemedText>{loc.locationName}</ThemedText>
                            {loc.note ? (
                              <ThemedText style={{opacity: .5}}>{loc.note}</ThemedText>
                            ) : null}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeLocation(dayIdx, locIdx)}>
                            <ThemedIcons library='MaterialIcons' name='close' size={20}/>
                          </TouchableOpacity>
                        </View>
                      ))}
                    />
                    
                  </View>
                ))}
              </>
            ) : (
              <>
                <View style={styles.rowBetween}>
                    <ThemedText type='subtitle' style={{fontSize: 16}}>Locations</ThemedText>
                  <TouchableOpacity style={styles.addLocationButton} onPress={() => openLocationModal(null)}>
                    <ThemedIcons library='MaterialIcons' name='add' size={15} color='#00CAFF'/>
                    <ThemedText style={{color: '#00CAFF', fontSize: 12}}>Add Location</ThemedText>
                  </TouchableOpacity>
                </View>
                <View style={{marginTop: 16}}>
                  <LocationDisplay
                    content={locations.map((loc, idx) => (
                      <View key={idx} style={styles.locationRow}>
                        <TouchableOpacity 
                          style={{ flex: 1, marginBottom: 15 }}
                          onPress={() => openEditLocationModal(null, idx, loc)}
                        >
                          <ThemedText>{loc.locationName}</ThemedText>
                          {loc.note ? (
                            <ThemedText style={{opacity: .5}}>{loc.note}</ThemedText>
                          ) : null}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeLocation(null, idx)}>
                          <ThemedIcons library='MaterialIcons' name='close' size={20}/>
                        </TouchableOpacity>
                      </View>
                    ))}
                  />
                </View>
                
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <ProcessModal
        visible={loading || success || !!errorMessage}
        success={success}
        successMessage="Itinerary updated!"
        errorMessage={errorMessage}
      />
      <CubeButton
        size={60}
        iconName="check"
        iconColor="#fff"
        onPress={handleSubmit}
        style={{
          ...styles.cubeButton,
          opacity: !title.trim() || !startDate || !endDate ? 0.5 : 1,
          pointerEvents: !title.trim() || !startDate || !endDate ? 'none' : 'auto'
        }}
      />

      {/* Add Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeLocationModal}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <LocationAutocomplete
              value={modalLocationName}
              onSelect={(loc) => {
                setModalLocationName(loc.locationName || '');
                setModalLocationData(loc);
              }}
              placeholder="Search for a location"
            />
            
            <TextField
              placeholder="Add a note (optional)"
              value={modalNote}
              onChangeText={setModalNote}
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between'}}>
              <View style={{width: '48%'}}>
                <Button
                title="Cancel"
                onPress={closeLocationModal}
              />
              </View>
              
              <View style={{width: '48%'}}>
              <Button
                title={isEditMode ? "Update" : "Add"}
                type='primary'
                onPress={handleAddLocationFromModal}
                disabled={!modalLocationData.locationName || !modalLocationData.latitude || !modalLocationData.longitude}
              />
              </View>
            </View>
          </ThemedView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bottomOverlay:{
   position: 'absolute',
   bottom:-2,
   left: 0,
   right: 0,
   height: 20,
   borderTopLeftRadius: 200,
   borderTopRightRadius: 200,
   borderWidth: 1,
   borderColor: '#ccc4',
   borderBottomWidth: 0,
  },
  dayBlock: {
    marginBottom: 16
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10
  },
  addLocationButton:{
    borderColor: '#00CAFF',
    borderWidth: 1,
    padding: 7,
    borderRadius: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  cubeButton:{
    position: 'absolute',
    bottom: 20,
    right: 20
  },
  locationContainer:{
    paddingHorizontal: 16,
  },
  modalOverlay:{
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 14,
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ccc4',
  }
});
