import Button from '@/components/Button';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BACKEND_URL } from '@/constants/Config';
import { useLocation } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/useThemeColor';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSession } from '@/context/SessionContext';
import { router } from 'expo-router';
import { generateRouteWithLocations } from '@/services/routeApiService';
import FadedHeader from '@/components/custom/FadedHeader';
import LoadingContainerAnimation from '@/components/LoadingContainerAnimation';
import EmptyMessage from '@/components/EmptyMessage';

export default function NearbyHelpSection() {
  const { latitude, longitude, loading: locationLoading } = useLocation();
  const { session, updateSession } = useSession();
  const accentColor = useThemeColor({}, 'accent');

  const [amenities, setAmenities] = useState<any[]>([]);
  const [amenityLoading, setAmenityLoading] = useState(false);
  const [amenityError, setAmenityError] = useState<string | null>(null);
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
        <ThemedText type="defaultSemiBold">
          {amenity.name}
        </ThemedText>
        <ThemedText style={{opacity: 0.5}}>
          {amenity.amenityType === 'fire_station' ? 'Fire Station' : amenity.amenityType?.charAt(0).toUpperCase() + amenity.amenityType?.slice(1) || 'Unknown'}
        </ThemedText>
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
      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadedHeader title='Nearby Help' subtitle='Find help in your area' iconName='shield-alert-outline'
         {...selectedAmenityType === 'hospital' && {iconName: 'hospital-box', color: 'red'}}
         {...selectedAmenityType === 'police' && {iconName: 'police-badge', color: 'blue'}}
         {...selectedAmenityType === 'fire_station' && {iconName: 'fire', color: 'orange'}}
        />
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.amenitiesButtonsContainer}
          contentContainerStyle={{paddingHorizontal: 16, gap: 12}}
        >
          {locationLoading ? (
            <>
              <ThemedView color='primary' shadow style={styles.amenitiesButton}>
                <ActivityIndicator size={20}/>
                <ThemedText>Looking for the nearest amenity</ThemedText>
              </ThemedView>
            </>
          ) : (
            <>
              <TouchableOpacity 
                onPress={() => {
                  fetchAmenities('hospital');
                  setSelectedAmenityType('hospital');
                }}
              >
                <ThemedView 
                  color='primary' 
                  shadow 
                  style={[
                    styles.amenitiesButton, 
                    selectedAmenityType === 'hospital' && {backgroundColor: 'red'}
                  ]}
                >
                  <ThemedIcons 
                    library='MaterialIcons' 
                    name='local-hospital' 
                    size={20}
                    color={selectedAmenityType === 'hospital' ? 'white' : undefined}
                  />
                  <ThemedText style={selectedAmenityType === 'hospital' ? {color: 'white'} : undefined}>
                    Hospital
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  fetchAmenities('police');
                  setSelectedAmenityType('police');
                }}
              >
                <ThemedView 
                  color='primary' 
                  shadow 
                  style={[
                    styles.amenitiesButton, 
                    selectedAmenityType === 'police' && {backgroundColor: 'blue'}
                  ]}
                >
                  <ThemedIcons 
                    library='MaterialIcons' 
                    name='local-police' 
                    size={20}
                    color={selectedAmenityType === 'police' ? 'white' : undefined}
                  />
                  <ThemedText style={selectedAmenityType === 'police' ? {color: 'white'} : undefined}>
                    Police
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  fetchAmenities('fire_station');
                  setSelectedAmenityType('fire_station');
                }}
              >
                <ThemedView 
                  color='primary' 
                  shadow 
                  style={[
                    styles.amenitiesButton, 
                    selectedAmenityType === 'fire_station' && {backgroundColor: 'orange'}
                  ]}
                >
                  <ThemedIcons 
                    library='MaterialIcons' 
                    name='local-fire-department' 
                    size={20}
                    color={selectedAmenityType === 'fire_station' ? 'white' : undefined}
                  />
                  <ThemedText style={selectedAmenityType === 'fire_station' ? {color: 'white'} : undefined}>
                    Fire Department
                  </ThemedText>
                </ThemedView>
              </TouchableOpacity>
              </>
            )}
        </ScrollView>
        {amenityLoading && (
          <ThemedView color='primary' shadow style={styles.loadingContainer}>
            <LoadingContainerAnimation/>
          </ThemedView>
        )}
        {amenityError && (
          <View style={styles.errorContainer}>
            <EmptyMessage title='Uh oh...' description={amenityError}
              iconName='emoticon-sad' iconLibrary='MaterialDesignIcons'
            />
          </View>
        )}
        {amenities.length > 0 && (
          <View>
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
        {selectedAmenityType===null && (
          <View style={styles.errorContainer}>
            <EmptyMessage title='Look for help' description='Please select an amenity'
              iconName='crisis-alert'
            />
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  amenitiesButtonsContainer: {
    paddingVertical: 16,
  },
  amenitiesButton: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  loadingContainer: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    height: 200,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  amenityCard: {
    marginVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
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
});