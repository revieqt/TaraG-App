import Button from '@/components/Button';
import BackButton from '@/components/custom/BackButton';
import SOSButton from '@/components/custom/SOSButton';
import GradientHeader from '@/components/GradientHeader';
import HorizontalSections from '@/components/HorizontalSections';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BACKEND_URL } from '@/constants/Config';
import { useLocation } from '@/hooks/useLocation';
import { useDocument } from '@/hooks/useDocument';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Alert} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import { generateRouteWithLocations } from '@/services/routeApiService';

export default function SafetyScreen() {
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const { fetchDocument } = useDocument();
  const { session, updateSession } = useSession();

  const [amenities, setAmenities] = useState<any[]>([]);
  const [amenityLoading, setAmenityLoading] = useState(false);
  const [amenityError, setAmenityError] = useState<string | null>(null);

  const [emergencyTips, setEmergencyTips] = useState<any[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipsError, setTipsError] = useState<string | null>(null);

  const [selectedAmenityType, setSelectedAmenityType] = useState<string | null>(null);

  const handleGetDirection = async (amenity: any) => {
    if (session?.activeRoute) {
      Alert.alert(
        "Active Route Detected",
        "You must end the active route before creating a new one.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (!latitude || !longitude || !session?.user?.id) {
      Alert.alert("Error", "Unable to get your location or user information.");
      return;
    }

    try {
      const route = await generateRouteWithLocations({
        startLocation: { latitude, longitude },
        endLocation: { latitude: amenity.latitude, longitude: amenity.longitude },
        waypoints: [],
        mode: 'driving-car',
        userID: session.user.id
      });

      if (route) {
        const activeRoute = {
          routeID: `route_${Date.now()}`,
          userID: session.user.id,
          location: [
            { latitude, longitude, locationName: 'Your Location' },
            { latitude: amenity.latitude, longitude: amenity.longitude, locationName: amenity.name }
          ],
          mode: 'driving-car',
          status: 'active',
          createdOn: new Date(),
          routeData: route
        };

        await updateSession({ activeRoute });
        console.log('Route to amenity created:', activeRoute);
        
        // Use a more reliable navigation approach
        try {
          // Small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 50));
          router.replace('/(tabs)/maps');
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback navigation
          router.push('/(tabs)/maps');
        }
      } else {
        Alert.alert("Error", "Failed to generate route. Please try again.");
      }
    } catch (error) {
      console.error('Error generating route to amenity:', error);
      Alert.alert("Error", "Failed to generate route. Please try again.");
    }
  };

  useEffect(() => {
    setTipsLoading(true);
    setTipsError(null);
    fetchDocument('emergencyTips-mobileApp')
      .then((data: any) => {
        // If the data is an array, set it directly
        if (Array.isArray(data)) {
          setEmergencyTips(data);
        } else if (data && Array.isArray(data.sections)) {
          setEmergencyTips([data]);
        } else {
          setEmergencyTips([]);
        }
      })
      .catch(() => setTipsError('Failed to load emergency tips.'))
      .finally(() => setTipsLoading(false));
  }, [fetchDocument]);

  function getTipTitleForAmenityType(type: string) {
    switch (type) {
      case 'hospital':
      case 'clinic':
      case 'doctors':
        return 'Health Emergency';
      case 'police':
        return 'Police / Safety Emergency';
      case 'fire_station':
      case 'rescue_station':
        return 'Fire Emergency';
      default:
        return '';
    }
  }

  const fetchAmenities = async (amenityType: string) => {
    if (!latitude || !longitude) {
      setAmenityError('Location not available.');
      return;
    }
    setAmenityLoading(true);
    setAmenityError(null);
    setAmenities([]);
    
    try {
      let amenitiesToFetch: string[] = [];
      if (amenityType === 'hospital') {
        amenitiesToFetch = ['hospital', 'clinic', 'doctors'];
      } else if (amenityType === 'fire_station') {
        amenitiesToFetch = ['fire_station', 'rescue_station'];
      } else {
        amenitiesToFetch = [amenityType];
      }
      const amenityPromises = amenitiesToFetch.map(async (amenity) => {
        const requestBody = { 
          amenity: amenity, 
          latitude, 
          longitude 
        };
        const res = await fetch(`${BACKEND_URL}/amenities/nearest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to fetch ${amenity}: ${res.status} ${errorText}`);
        }
        const data = await res.json();
        return data.map((item: any) => ({
          ...item,
          amenityType: amenity
        }));
      });
      const results = await Promise.all(amenityPromises);
      const allAmenities = results.flat();
      setAmenities(allAmenities);
    } catch (err: any) {
      setAmenityError('You might have network issues. Please try again');
    } finally {
      setAmenityLoading(false);
    }
  };

  const renderAmenityCard = (amenity: any, index: number) => (
    <ThemedView key={amenity.id || index} color='primary' shadow style={styles.amenityCard}>
      <View style={styles.mapContainer}>
        <MapView
          style={{flex: 1}}
          initialRegion={{
            latitude: amenity.latitude,
            longitude: amenity.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: amenity.latitude,
              longitude: amenity.longitude,
            }}
            title={amenity.name}
          />
        </MapView>
      </View>
      <View style={{padding: 16}}>
        <View style={styles.amenityHeader}>
          <ThemedText type="defaultSemiBold" style={{marginBottom: 8, flex: 1}}>
            {amenity.name}
          </ThemedText>
          <ThemedText style={styles.amenityType}>
            {amenity.amenityType?.charAt(0).toUpperCase() + amenity.amenityType?.slice(1) || 'Unknown'}
          </ThemedText>
        </View>
        {amenity.address && (
          <View style={styles.infoRow}>
            <ThemedIcons library="MaterialIcons" name="location-on" size={16}/>
            <ThemedText numberOfLines={2}>
              {amenity.address}
            </ThemedText>
          </View>
        )}
        {amenity.phone && (
          <View style={styles.infoRow}>
            <ThemedIcons library="MaterialIcons" name="phone" size={16}/>
            <ThemedText>
              {amenity.phone}
            </ThemedText>
          </View>
        )}
        {amenity.website && (
          <View style={styles.infoRow}>
            <ThemedIcons library="MaterialIcons" name="language" size={16}/>
            <ThemedText numberOfLines={1}>
              {amenity.website}
            </ThemedText>
          </View>
        )}
        <View style={styles.infoRow}>
          <Button title="Get Directions" onPress={() => handleGetDirection(amenity)} buttonStyle={{}}/>
        </View>
      </View>
    </ThemedView>
  );

  return (
    <ThemedView style={{flex:1}}>
      <BackButton style={styles.backButton}/>
      <ThemedView color='primary'>
        {/* <GradientHeader/>
        <View style={styles.header}>
          <SOSButton/>
          <View style={{ justifyContent: 'center'}}>
            <ThemedText type='subtitle'>Emergency State</ThemedText>
            <ThemedText type='defaultSemiBold'>Safety Mode</ThemedText>
          </View>
        </View> */}

        {locationLoading ? (
          <ActivityIndicator size="large" color="#4300FF" style={{marginTop: 40}} />
        ) : (
          <>
            
            <ThemedText style={{textAlign: 'center', paddingTop: 70,zIndex: 500}}>
              Who do you need to reach in your emergency?
            </ThemedText>

            <View style={styles.helpMenu}>
              <ThemedView shadow style={styles.helpButton}>
                <TouchableOpacity 
                  style={styles.helpButtonContent} 
                  onPress={() => {
                    fetchAmenities('hospital');
                    setSelectedAmenityType('hospital');
                  }}
                >
                  <ThemedIcons library='MaterialIcons' name='local-hospital' size={30} color='red'/>
                </TouchableOpacity>
              </ThemedView>
              <ThemedView shadow style={styles.helpButton}>
                <TouchableOpacity 
                  style={styles.helpButtonContent} 
                  onPress={() => {
                    fetchAmenities('police');
                    setSelectedAmenityType('police');
                  }}
                >
                  <ThemedIcons library='MaterialIcons' name='local-police' size={30} color='blue'/>
                </TouchableOpacity>
              </ThemedView>
              <ThemedView shadow style={styles.helpButton}>
                <TouchableOpacity 
                  style={styles.helpButtonContent} 
                  onPress={() => {
                    fetchAmenities('fire_station');
                    setSelectedAmenityType('fire_station');
                  }}
                >
                  <ThemedIcons library='MaterialIcons' name='local-fire-department' size={30} color='orange'/>
                </TouchableOpacity>
              </ThemedView>
            </View>
          </>
          
        )}
      </ThemedView>
      <HorizontalSections
        labels={['Help Finder', 'Emergency Tips']}
        type="fullTab"
        containerStyle={{ flex: 1 }}
        sections={[
        <View key="help" style={{ flex: 1 }}>
          <ScrollView 
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {amenityLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4300FF" />
              </View>
            )}
            {amenityError && (
              <View style={styles.errorContainer}>
                <ThemedText type="error">{amenityError}</ThemedText>
              </View>
            )}
            {amenities.length > 0 && (
              <View style={styles.amenitiesContainer}>
                {amenities.map((amenity, index) => (
                  <TouchableOpacity
                    key={amenity.id || index}
                    activeOpacity={0.8}
                    onPress={() => setSelectedAmenityType(amenity.amenityType)}
                  >
                    {renderAmenityCard(amenity, index)}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>,
        <ScrollView key="tips" style={{ flex: 1, padding: 20 }}>
          {tipsLoading && (
            <ActivityIndicator size="large" color="#4300FF" style={{marginTop: 40}} />
          )}
          {tipsError && (
            <ThemedText type="error" style={{marginBottom: 10}}>{tipsError}</ThemedText>
          )}
          {!tipsLoading && !tipsError && (
            <>
              {selectedAmenityType ? (
                (() => {
                  const tipTitle = getTipTitleForAmenityType(selectedAmenityType);
                  const tip = emergencyTips.find((t: any) => t.title === tipTitle);
                  if (!tip) {
                    return <ThemedText>No emergency tip available for this amenity.</ThemedText>;
                  }
                  return (
                    <View style={{marginBottom: 24}}>
                      <ThemedText type="subtitle" style={{marginBottom: 4}}>
                        {tip.title}
                      </ThemedText>
                      <ThemedText style={{marginBottom: 10}}>
                        {tip.description}
                      </ThemedText>
                      {Array.isArray(tip.sections) && tip.sections.map((section: any, sidx: number) => (
                        <View key={sidx} style={styles.sectionContent}>
                          <ThemedText type="defaultSemiBold">
                            {section.subtitle}
                          </ThemedText>
                          <ThemedText style={styles.sectionDescription}>
                            {section.description}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  );
                })()
              ) : (
                <ThemedText>Select an amenity to view the corresponding emergency tip.</ThemedText>
              )}
            </>
          )}
        </ScrollView>
        ]}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 20,
    zIndex: 10,
    marginTop: 50,
    flexDirection: 'row',
    gap: 15
  },
  backButton:{
    position: 'absolute',
    zIndex: 100,
    top: 16,
    left: 16,
  },
  helpMenu:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginVertical: 20,
  },
  helpButton:{
    padding: 15,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  helpButtonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  scrollContent: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  amenitiesContainer: {
    marginTop: 10,
  },
  amenityCard: {
    margin: 10,
    borderRadius: 12,
    borderColor: '#ccc4',
    borderWidth: 1,
  },
  mapContainer: {
    height: 150,
    width: '100%',
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
    opacity: 0.5,
  },
  amenityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amenityType: {
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContent:{
    marginVertical: 10,

  },
  sectionDescription: {
    marginLeft: 10,
  },
});