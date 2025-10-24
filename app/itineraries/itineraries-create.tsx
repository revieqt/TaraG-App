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
import { useSaveItinerary } from '@/services/itinerariesApiService';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region } from 'react-native-maps';
import TaraMarker from '@/components/maps/TaraMarker';
import { useLocation } from '@/hooks/useLocation';
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

export default function CreateItineraryScreen() {
  const { session } = useSession();
  const router = useRouter();
  const { saveItineraryComplete } = useSaveItinerary();
  const params = useLocalSearchParams();
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
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const { latitude, longitude, loading: locationLoading } = useLocation();
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

  // Set initial startDate from URL parameter
  useEffect(() => {
    if (params.startDate && typeof params.startDate === 'string') {
      const initialDate = new Date(params.startDate);
      if (!isNaN(initialDate.getTime())) {
        setStartDate(initialDate);
      }
    }
  }, [params.startDate]);

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
      username: session?.user?.username || '',
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
      console.log('🎯 Creating itinerary with data:', result);
      const saveResult = await saveItineraryComplete(result);
      setLoading(false);
      setSuccess(saveResult.success);
      setErrorMessage(saveResult.errorMessage);
      
      if (saveResult.success) {
        console.log('✅ Itinerary created successfully!');
      } else {
        console.error('❌ Failed to create itinerary:', saveResult.errorMessage);
      }
    })();
  };

  // Reverse geocode to get location name from coordinates
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setIsLoadingLocation(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TaraG/1.0'
          }
        }
      );
      const data = await response.json();
      const locationName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      return locationName;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Handle map region change - update location data when user moves map
  const handleMapRegionChangeComplete = async (region: Region) => {
    const locationName = await reverseGeocode(region.latitude, region.longitude);
    setModalLocationName(locationName);
    setModalLocationData({
      locationName,
      latitude: region.latitude,
      longitude: region.longitude,
    });
  };

  // Handle location selection from autocomplete - update map to show selected location
  const handleLocationSelect = (loc: LocationItem) => {
    setModalLocationName(loc.locationName || '');
    setModalLocationData(loc);
    // Update map region to the selected location
    if (loc.latitude && loc.longitude) {
      setMapRegion({
        latitude: loc.latitude,
        longitude: loc.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Modal functions
  const openLocationModal = (dayIdx: number | null) => {
    setCurrentDayIdx(dayIdx);
    setEditingLocationIdx(null);
    setIsEditMode(false);
    setModalLocationName('');
    setModalNote('');
    setModalLocationData({});
    // Initialize map to current location or default
    if (latitude && longitude) {
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      // Default to Cebu City
      setMapRegion({
        latitude: 10.3157,
        longitude: 123.8854,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
    setShowLocationModal(true);
  };

  const openEditLocationModal = (dayIdx: number | null, locIdx: number, location: LocationItem) => {
    setCurrentDayIdx(dayIdx);
    setEditingLocationIdx(locIdx);
    setIsEditMode(true);
    setModalLocationName(location.locationName || '');
    setModalNote(location.note || '');
    setModalLocationData(location);
    // Initialize map to the location being edited
    if (location.latitude && location.longitude) {
      setMapRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
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
    setMapRegion(null);
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
        successMessage="Itinerary saved!"
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
        <ThemedView style={{flex:1}}>
          {/* Interactive Map */}
          {mapRegion && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                region={mapRegion}
                onRegionChangeComplete={handleMapRegionChangeComplete}
              />
              {/* Fixed center marker overlay */}
              <View style={styles.centerMarkerContainer}>
                <View style={styles.centerMarker} />
              </View>
              {isLoadingLocation && (
                <View style={styles.loadingOverlay}>
                  <ThemedText style={{fontSize: 12, opacity: 0.7}}>Getting location...</ThemedText>
                </View>
              )}
              <View style={styles.mapOverlay}/>
            </View>
          )}

          <View style={{padding: 16, paddingTop: 0}}>
            <ThemedText style={{fontSize: 12, opacity: 0.6, marginBottom: 8, marginTop: 12}}>
              Move the map to select a location or search below:
            </ThemedText>
            
            <LocationAutocomplete
              value={modalLocationName}
              onSelect={handleLocationSelect}
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
          </View>
          
        </ThemedView>
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
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  mapOverlay:{
    height: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 16,
  },
  centerMarkerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  centerMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00CAFF',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  }
});
