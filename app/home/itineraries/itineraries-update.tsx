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
import { updateItinerary as updateItineraryApi } from '@/services/itinerariesApiService';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

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
  const [showAddLocation, setShowAddLocation] = useState<{[key: string]: boolean}>({});
  const [pendingLocation, setPendingLocation] = useState<{[key: string]: Partial<LocationItem>}>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [itineraryId, setItineraryId] = useState<string>('');

  // Populate fields from params
  useEffect(() => {
    if (params.itineraryData) {
      try {
        const data = JSON.parse(params.itineraryData);
        setItineraryId(data.id || '');
        setTitle(data.title || '');
        setDescription(data.description || '');
        setType(data.type || 'Solo');
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
      const saveResult = await updateItineraryApi(itineraryId, result, session?.accessToken || '');
      setLoading(false);
      setSuccess(saveResult.success);
      setErrorMessage(saveResult.errorMessage);
      
      if (saveResult.success) {
        // Handle navigation based on returnTo parameter
        if (params.returnTo === 'groups-view' && params.groupID) {
          router.replace({
            pathname: '/explore/groups-view',
            params: { groupID: params.groupID }
          });
        } else {
          // Default navigation back to itineraries list
          router.replace('/home/itineraries/itineraries');
        }
      }
    })();
  };

  // Add location UI logic
  function renderAddLocationUI(dayIdx: number | null) {
    const key = dayIdx !== null ? String(dayIdx) : 'main';
    return (
      <View style={styles.addLocationContainer}>
        <LocationAutocomplete
          value={pendingLocation[key]?.locationName || ''}
          onSelect={loc => setPendingLocation(prev => ({ ...prev, [key]: { ...prev[key], ...loc } }))}
          placeholder="Location Name"
        />
        <TextField
          placeholder="Note (optional)"
          value={pendingLocation[key]?.note || ''}
          onChangeText={text => setPendingLocation(prev => ({ ...prev, [key]: { ...prev[key], note: text } }))}
        />
        <Button
          title="Add"
          onPress={() => {
            const loc = pendingLocation[key];
            if (loc && loc.locationName && loc.latitude && loc.longitude) {
              if (planDaily && dayIdx !== null) {
                addLocationToDay(dayIdx, { ...loc, note: loc.note || '' } as LocationItem);
              } else {
                addLocation({ ...loc, note: loc.note || '' } as LocationItem);
              }
              setShowAddLocation(prev => ({ ...prev, [key]: false }));
              setPendingLocation(prev => ({ ...prev, [key]: {} }));
            }
          }}
          buttonStyle={{ marginTop: 6 }}
        />
      </View>
    );
  }

  return (
    <ThemedView color='primary' style={{ flex: 1 }}>
      <Header label="Update Itinerary" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TextField placeholder="Title" value={title} onChangeText={setTitle} 
            style={{ fontFamily: 'PoppinsBold', fontSize: 35, borderColor: 'transparent', marginBottom: 0, height: 60}}
          />
          <TextField placeholder="Add a Description" value={description} onChangeText={setDescription} 
            style={{ borderColor: 'transparent', minHeight: 60, height: descriptionHeight, textAlignVertical: 'top'}}
            multiline
            onContentSizeChange={e => setDescriptionHeight(e.nativeEvent.contentSize.height)}
          />
          <View style={{paddingHorizontal: 20, marginBottom: 10}}>
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
            {numDays > 1 && (
              <View style={styles.rowBetween}>
                <ThemedText>Plan Daily?</ThemedText>
                <ToggleButton
                  value="planDaily"
                  label={planDaily ? 'Yes' : 'No'}
                  initialSelected={planDaily}
                  onToggle={(_, selected) => {
                    setPlanDaily(selected);
                    setDailyLocations([]);
                  }}
                />
              </View>
            )}
            {planDaily ? (
              <View style={{ marginTop: 10 }}>
                <ThemedText type='subtitle' style={styles.sectionTitle}>Daily Plans</ThemedText>
                {autoDailyLocations.map((day, dayIdx) => (
                  <View key={dayIdx} style={styles.dayBlock}>
                    <ThemedText style={{fontSize: 16, fontWeight: 'bold'}}>Day {dayIdx + 1}</ThemedText>
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
                    {showAddLocation[String(dayIdx)] ? (
                      renderAddLocationUI(dayIdx)
                    ) : (
                      <TouchableOpacity style={styles.addLocationButton} onPress={() => setShowAddLocation(prev => ({ ...prev, [String(dayIdx)]: true }))}>
                        <ThemedIcons library='MaterialIcons' name='add-circle-outline' size={20} color='#008000'/>
                        <ThemedText style={styles.addLocationText}>Add Location</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ marginTop: 10 }}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>Locations</ThemedText>
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
                {showAddLocation['main'] ? (
                  renderAddLocationUI(null)
                ) : (
                  <TouchableOpacity style={styles.addLocationButton} onPress={() => setShowAddLocation(prev => ({ ...prev, main: true }))}>
                    <ThemedIcons library='MaterialIcons' name='add-circle-outline' size={20} color='#008000'/>
                    <ThemedText style={styles.addLocationText}>Add Location</ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            )}
            <Button
              title="Update Itinerary"
              onPress={handleSubmit}
              buttonStyle={{ marginTop: 20 }}
              disabled={!title.trim() || !startDate || !endDate}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <LoadingModal
        visible={loading || success || !!errorMessage}
        success={success}
        successMessage="Itinerary updated! Redirecting..."
        errorMessage={errorMessage}
        redirectTo="/home/itineraries/itineraries"
      />
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
  sectionTitle: {
    marginBottom: 8,
    marginTop: 10,
  },
  dayBlock: {
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addLocationButton:{
    borderColor: 'transparent',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10
  },
  addLocationText:{
    color: '#008000',
    fontWeight: 'bold'
  },
  addLocationContainer:{
    padding: 10
  }
});
