import Button from '@/components/Button';
import DatePicker from '@/components/DatePicker';
import DropDownField from '@/components/DropDownField';
import Header from '@/components/Header';
import LocationAutocomplete, { LocationItem } from '@/components/LocationAutocomplete';
import LocationDisplay from '@/components/LocationDisplay';
import LoadingModal from '@/components/modals/LoadingModal';
import TextField from '@/components/TextField';
import ThemedIcons from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ToggleButton from '@/components/ToggleButton';
import { useSession } from '@/context/SessionContext';
import { saveItinerary } from '@/services/itinerariesApiService';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import CubeButton from '@/components/RoundedButton'
import Switch from '@/components/Switch';

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

export default function CreateItineraryScreen() {
  const { session } = useSession();
  const router = useRouter();
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
  const [modalLocationName, setModalLocationName] = useState('');
  const [modalNote, setModalNote] = useState('');
  const [modalLocationData, setModalLocationData] = useState<Partial<LocationItem>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

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
    if (!title.trim() || !startDate || !endDate) {
      Alert.alert('Missing Required Fields', 'Please enter a title, start date, and end date.');
      return;
    }
    const createdOn = new Date();
    let result = {
      userID: session?.user?.id || '',
      title,
      description,
      type,
      createdOn: createdOn.toISOString(),
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
      const saveResult = await saveItinerary(result, session?.accessToken || '');
      setLoading(false);
      setSuccess(saveResult.success);
      setErrorMessage(saveResult.errorMessage);
    })();
  };

  // Modal functions
  const openLocationModal = (dayIdx: number | null) => {
    setCurrentDayIdx(dayIdx);
    setModalLocationName('');
    setModalNote('');
    setModalLocationData({});
    setShowLocationModal(true);
  };

  const closeLocationModal = () => {
    setShowLocationModal(false);
    setCurrentDayIdx(null);
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

      if (planDaily && currentDayIdx !== null) {
        addLocationToDay(currentDayIdx, locationToAdd);
      } else {
        addLocation(locationToAdd);
      }
      closeLocationModal();
    }
  };

  return (
    <ThemedView color='primary' style={{ flex: 1 }}>
      <Header/>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TextField placeholder="Title" value={title} onChangeText={setTitle} 
            style={{ fontFamily: 'PoppinsBold', fontSize: 27, borderColor: 'transparent', marginBottom: 0, height: 60}}
          />
          <TextField placeholder="Add a Description" value={description} onChangeText={setDescription} 
            style={{ borderColor: 'transparent', minHeight: 60, height: descriptionHeight, textAlignVertical: 'top'}}
            multiline
            onContentSizeChange={e => setDescriptionHeight(e.nativeEvent.contentSize.height)}
          />
          <View style={{paddingHorizontal: 16, marginBottom: 10}}>
            <DropDownField
              placeholder="Type"
              value={type}
              onValueChange={setType}
              values={ITINERARY_TYPES}
            />
            <View style={styles.rowBetween}>
              <DatePicker
                placeholder="Start Date"
                value={startDate}
                onChange={setStartDate}
                minimumDate={new Date()}
                maximumDate={endDate || undefined}
                style={{flex: 2}}
              />
              <DatePicker
                placeholder="End Date"
                value={endDate}
                onChange={setEndDate}
                minimumDate={startDate || new Date()}
                style={{flex: 2}}
              />
            </View>
            
            {/* Only show planDaily toggle if more than 1 day */}
            {/* <ToggleButton
                  value="planDaily"
                  label={planDaily ? 'Yes' : 'No'}
                  initialSelected={planDaily}
                  onToggle={(_, selected) => {
                    setPlanDaily(selected);
                    setDailyLocations([]);
                  }} */}
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

            <ThemedView shadow color='primary' style={styles.locationContainer}>
              {planDaily ? (
                <>
                  {autoDailyLocations.map((day, dayIdx) => (
                    <View key={dayIdx} style={styles.dayBlock}>
                      <ThemedText type='defaultSemiBold'>Day {dayIdx + 1}</ThemedText>
                      <ThemedText style={{opacity: 0.5, marginBottom: 10}}>({day.date?.toDateString()})</ThemedText>
                      <LocationDisplay
                        content={day.locations.map((loc, locIdx) => (
                          <View key={locIdx} style={styles.locationRow}>
                            <View style={{ flex: 1 }}>
                              <ThemedText>{loc.locationName}</ThemedText>
                              {loc.note ? (
                                <ThemedText style={{opacity: .5}}>{loc.note}</ThemedText>
                              ) : null}
                            </View>
                            <TouchableOpacity onPress={() => removeLocation(dayIdx, locIdx)}>
                              <ThemedIcons library='MaterialIcons' name='close' size={20} color='red'/>
                            </TouchableOpacity>
                          </View>
                        ))}
                      />
                      <TouchableOpacity style={styles.addLocationButton} onPress={() => openLocationModal(dayIdx)}>
                        <ThemedIcons library='MaterialIcons' name='add' size={20}/>
                        <ThemedText>Add Location</ThemedText>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <LocationDisplay
                    content={locations.map((loc, idx) => (
                      <View key={idx} style={styles.locationRow}>
                        <View style={{ flex: 1 }}>
                          <ThemedText>{loc.locationName}</ThemedText>
                          {loc.note ? (
                            <ThemedText style={{opacity: .5}}>{loc.note}</ThemedText>
                          ) : null}
                        </View>
                        <TouchableOpacity onPress={() => removeLocation(null, idx)}>
                          <ThemedIcons library='MaterialIcons' name='close' size={20} color='red'/>
                        </TouchableOpacity>
                      </View>
                    ))}
                  />
                  <TouchableOpacity style={styles.addLocationButton} onPress={() => openLocationModal(null)}>
                    <ThemedIcons library='MaterialIcons' name='add' size={20}/>
                    <ThemedText>Add Location</ThemedText>
                  </TouchableOpacity>
                </>
              )}
            </ThemedView>
            
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingModal
        visible={loading || success || !!errorMessage}
        success={success}
        successMessage="Itinerary saved! Redirecting..."
        errorMessage={errorMessage}
        redirectTo="/home/itineraries/itineraries"
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
                title="Add"
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
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 5,
  },
  dayBlock: {
    borderBottomColor: '#ccc4',
    borderBottomWidth: 1,
    padding: 10
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLocationButton:{
    backgroundColor: '#ccc5',
    padding: 10,
    borderRadius: 10,
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
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden'
  },
  modalOverlay:{
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 14,
    width: '100%',
    borderRadius: 14
  }
});
