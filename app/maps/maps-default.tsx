import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Alert, TouchableOpacity, ScrollView, Image } from 'react-native';
import MapView, { Region, PROVIDER_DEFAULT, MAP_TYPES } from 'react-native-maps';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import LocationAutocomplete, { LocationItem } from '@/components/LocationAutocomplete';
import TaraMarker from '@/components/maps/TaraMarker';
import BottomSheet from '@/components/BottomSheet';
import Button from '@/components/Button';
import { generateRouteWithLocations } from '@/services/routeApiService';
import { useLocation } from '@/hooks/useLocation';  
import { useMapType } from '@/hooks/useMapType';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'expo-router';
import EmptyMessage from '@/components/EmptyMessage';
import { ThemedIcons } from '@/components/ThemedIcons';
import WeatherCard from '@/components/custom/WeatherCard';
import LoadingContainerAnimation from '@/components/LoadingContainerAnimation';
import usePlacesApi from '@/services/placesApiService';
import { LinearGradient } from 'expo-linear-gradient';
import GradientBlobs from '@/components/GradientBlobs';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Cebu City coordinates
const CEBU_LATITUDE = 10.3157;
const CEBU_LONGITUDE = 123.8854;

export default function DefaultMap() {
  const primaryColor = useThemeColor({}, 'primary');
  const { latitude, longitude, suburb, city, state, country, loading, error } = useLocation();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { mapType: currentMapType } = useMapType();
  const { session, updateSession } = useSession();
  const { searchPlaceByText, searchAutocomplete, getPlaceDetails, searchNearbyPlaces } = usePlacesApi();
  const [cityInfo, setCityInfo] = useState<string | null>(null);
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [loadingCityInfo, setLoadingCityInfo] = useState(false);
  const [selectedLocationInfo, setSelectedLocationInfo] = useState<string | null>(null);
  const [selectedLocationImage, setSelectedLocationImage] = useState<string | null>(null);
  const [loadingSelectedInfo, setLoadingSelectedInfo] = useState(false);
  const [quickFacts, setQuickFacts] = useState<any>(null);
  const [attractions, setAttractions] = useState<any[]>([]);
  const [loadingAttractions, setLoadingAttractions] = useState(false);
  const [selectedAttractions, setSelectedAttractions] = useState<any[]>([]);
  const [loadingSelectedAttractions, setLoadingSelectedAttractions] = useState(false);
  
const getMapTypeEnum = (mapType: string) => {
    switch (mapType) {
      case 'satellite':
        return MAP_TYPES.SATELLITE;
      case 'hybrid':
        return MAP_TYPES.HYBRID;
      case 'terrain':
        return MAP_TYPES.TERRAIN;
      case 'standard':
      default:
        return MAP_TYPES.STANDARD;
    }
  };

  // Helper function to format place types for display
  const formatPlaceType = (types?: string[]) => {
    if (!types || types.length === 0) return null;
    // Get the first type and format it nicely
    const primaryType = types[0].replace(/_/g, ' ');
    return primaryType.charAt(0).toUpperCase() + primaryType.slice(1);
  };

  // Helper function to format price level
  const formatPriceLevel = (priceLevel?: string) => {
    if (!priceLevel) return null;
    const levels: { [key: string]: string } = {
      'PRICE_LEVEL_FREE': 'Free',
      'PRICE_LEVEL_INEXPENSIVE': '$',
      'PRICE_LEVEL_MODERATE': '$$',
      'PRICE_LEVEL_EXPENSIVE': '$$$',
      'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$',
    };
    return levels[priceLevel] || null;
  };

  // State for map region and selected location
  const [region, setRegion] = useState<Region>({
    latitude: CEBU_LATITUDE,
    longitude: CEBU_LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Update map region when user location changes
  useEffect(() => {
    if (latitude && longitude) {
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  }, [latitude, longitude]);

  // Fetch city information when no location is selected
  useEffect(() => {
    console.log('🗺️ City info effect triggered - selectedLocation:', selectedLocation, 'city:', city);
    if (!selectedLocation && city) {
      console.log('🗺️ Fetching city info for:', city);
      setLoadingCityInfo(true);
      
      searchPlaceByText(city)
        .then((placeInfo) => {
          console.log('🗺️ Place info received:', placeInfo);
          if (placeInfo) {
            // Use editorialSummary if available, otherwise use address
            setCityInfo(placeInfo.editorialSummary || placeInfo.address || null);
            setCityImage(placeInfo.photoUrl || null);
          } else {
            setCityInfo(null);
            setCityImage(null);
          }
        })
        .catch((error) => {
          console.error('🗺️ Error fetching city info:', error);
          setCityInfo(null);
          setCityImage(null);
        })
        .finally(() => {
          setLoadingCityInfo(false);
        });
    } else {
      console.log('🗺️ Not fetching - selectedLocation exists or no city');
      // Clear city info when location is selected
      setCityInfo(null);
      setCityImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, city]);

  // Fetch selected location information with full details
  useEffect(() => {
    if (selectedLocation && selectedLocation.locationName) {
      console.log('🗺️ Fetching selected location info for:', selectedLocation.locationName);
      setLoadingSelectedInfo(true);
      
      // First try to get place info via text search
      searchPlaceByText(selectedLocation.locationName)
        .then(async (placeInfo) => {
          console.log('🗺️ Selected place info received:', placeInfo);
          if (placeInfo) {
            // If we have a placeId, get full details for complete description
            if (placeInfo.placeId) {
              try {
                const fullDetails = await getPlaceDetails(placeInfo.placeId);
                console.log('🗺️ Full place details:', fullDetails);
                console.log('🗺️ editorialSummary from details:', fullDetails.editorialSummary);
                console.log('🗺️ editorialSummary from search:', placeInfo.editorialSummary);
                
                // Priority: editorialSummary from either source > address
                // editorialSummary provides rich description for places/establishments
                const editorialSummary = fullDetails.editorialSummary || placeInfo.editorialSummary;
                const description = editorialSummary || fullDetails.address || placeInfo.address;
                
                console.log('🗺️ Final description:', description);
                setSelectedLocationInfo(description);
                setSelectedLocationImage(placeInfo.photoUrl || null);
                
                // Set quick facts
                setQuickFacts({
                  types: fullDetails.types,
                  priceLevel: fullDetails.priceLevel,
                  businessStatus: fullDetails.businessStatus,
                  openingHours: fullDetails.openingHours,
                  phoneNumber: fullDetails.phoneNumber,
                  website: fullDetails.website,
                  rating: fullDetails.rating,
                  totalRatings: fullDetails.totalRatings,
                });
              } catch (error) {
                console.error('🗺️ Error getting full details:', error);
                // Fallback to basic info
                setSelectedLocationInfo(placeInfo.editorialSummary || placeInfo.address || null);
                setSelectedLocationImage(placeInfo.photoUrl || null);
              }
            } else {
              setSelectedLocationInfo(placeInfo.editorialSummary || placeInfo.address || null);
              setSelectedLocationImage(placeInfo.photoUrl || null);
            }
          } else {
            setSelectedLocationInfo(null);
            setSelectedLocationImage(null);
          }
        })
        .catch((error) => {
          console.error('🗺️ Error fetching selected location info:', error);
          setSelectedLocationInfo(null);
          setSelectedLocationImage(null);
        })
        .finally(() => {
          setLoadingSelectedInfo(false);
        });
    } else {
      setSelectedLocationInfo(null);
      setSelectedLocationImage(null);
      setQuickFacts(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // Fetch attractions for current city
  useEffect(() => {
    if (!selectedLocation && city && latitude && longitude) {
      console.log('🎯 Fetching nearby attractions for current location:', { latitude, longitude });
      setLoadingAttractions(true);
      
      // Google Places API types for nearby search
      const placeTypes = [
        'shopping_mall',
        'resort_hotel',
        'amusement_park',
        'historical_landmark',
        'tourist_attraction'
      ];
      
      // Search nearby places within 5km radius
      searchNearbyPlaces(latitude, longitude, placeTypes, 5000)
        .then((results) => {
          console.log('🎯 Nearby attractions received:', results.length);
          setAttractions(results.slice(0, 15)); // Limit to 15 attractions
        })
        .catch((error) => {
          console.error('🎯 Error fetching nearby attractions:', error);
          setAttractions([]);
        })
        .finally(() => {
          setLoadingAttractions(false);
        });
    } else {
      setAttractions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, city, latitude, longitude]);

  // Fetch attractions for selected location (if it's a city or place)
  useEffect(() => {
    if (selectedLocation && selectedLocation.locationName && selectedLocation.latitude && selectedLocation.longitude) {
      console.log('🎯 Fetching nearby attractions for selected location:', { 
        name: selectedLocation.locationName, 
        lat: selectedLocation.latitude, 
        lng: selectedLocation.longitude 
      });
      setLoadingSelectedAttractions(true);
      
      // Google Places API types for nearby search
      const placeTypes = [
        'shopping_mall',
        'resort_hotel',
        'amusement_park',
        'historical_landmark',
        'tourist_attraction'
      ];
      
      // Search nearby places within 5km radius
      searchNearbyPlaces(selectedLocation.latitude, selectedLocation.longitude, placeTypes, 5000)
        .then((results) => {
          console.log('🎯 Nearby attractions for selected location received:', results.length);
          // Only show attractions if we found some
          if (results.length > 0) {
            setSelectedAttractions(results.slice(0, 15));
          } else {
            setSelectedAttractions([]);
          }
        })
        .catch((error) => {
          console.error('🎯 Error fetching nearby attractions for selected location:', error);
          setSelectedAttractions([]);
        })
        .finally(() => {
          setLoadingSelectedAttractions(false);
        });
    } else {
      setSelectedAttractions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation]);

  // Handle location selection from autocomplete
  const handleLocationSelect = (location: LocationItem) => {
    setSelectedLocation(location);
    setSearchQuery(location.locationName);
    
    if (location.latitude && location.longitude) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01, // Zoom in more for selected location
        longitudeDelta: 0.01 * ASPECT_RATIO,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  };

  // Handle back button - clear selected location and search
  const handleBackPress = () => {
    setSelectedLocation(null);
    setSearchQuery('');
  };

  // Handle attraction click
  const handleAttractionClick = async (attraction: any) => {
    console.log('🎯 Attraction clicked:', attraction);
    try {
      // Get place details using placeId for accurate coordinates
      const placeDetails = await getPlaceDetails(attraction.placeId);
      if (placeDetails) {
        const newLocation = {
          locationName: placeDetails.name,
          latitude: placeDetails.location.lat,
          longitude: placeDetails.location.lng,
          note: placeDetails.address,
        };
        
        setSelectedLocation(newLocation);
        setSearchQuery(placeDetails.name);
        
        // Animate map to the selected location
        const newRegion = {
          latitude: placeDetails.location.lat,
          longitude: placeDetails.location.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01 * ASPECT_RATIO,
        };
        
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('🎯 Error getting place details:', error);
    }
  };

  // Animate to region when it changes
  const handleRegionChange = (newRegion: Region) => {
    mapRef.current?.animateToRegion(newRegion, 500);
  };

 

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

const defaultRegion: Region = {
    latitude: CEBU_LATITUDE,
    longitude: CEBU_LONGITUDE,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };
  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType={getMapTypeEnum(currentMapType)}
        region={region}
        showsUserLocation
        zoomControlEnabled
        initialRegion={defaultRegion}
        onRegionChangeComplete={handleRegionChange}
      >
        {/* Selected Location Marker */}
        {selectedLocation?.latitude && selectedLocation.longitude && (
          <TaraMarker
            type="dot"
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title={selectedLocation.locationName}
            description={selectedLocation.note}
          />
        )}
      </MapView>

      <LinearGradient
        colors={[ '#000','transparent']}
        style={styles.searchContainer}
      >
        <LocationAutocomplete
          value={searchQuery}
          onSelect={handleLocationSelect}
          placeholder="Search for a location"
        />

      </LinearGradient>

      {error && (
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      )}

      {/* Bottom Sheet - Two States */}
      {selectedLocation ? (
        /* STATE B: Selected Location */
        <BottomSheet snapPoints={[0.4,0.75]} defaultIndex={0}>
          <ScrollView style={styles.bottomSheetContent}>
            <View>
            <View style={styles.locationTitleContainer}>
              <TouchableOpacity onPress={handleBackPress}>
                <ThemedIcons library="MaterialIcons" name="arrow-back-ios" size={20} />
              </TouchableOpacity>
              <ThemedText type="subtitle">
                {selectedLocation.locationName}
              </ThemedText>
            </View>

            {/* Address */}
            {selectedLocation.note ? (
              <View style={styles.locationDetailsContainer}>
                <ThemedIcons library="MaterialIcons" name="location-on" size={15} />
                <ThemedText style={{fontSize: 12}}>
                  {selectedLocation.note} ( {selectedLocation.latitude?.toFixed(6)}, {selectedLocation.longitude?.toFixed(6)} )
                </ThemedText>
              </View>
            ):(
              <View style={styles.locationDetailsContainer}>
                <ThemedIcons library="MaterialIcons" name="location-on" size={15} />
                <ThemedText style={{fontSize: 12}}>
                  {selectedLocation.latitude?.toFixed(6)}, {selectedLocation.longitude?.toFixed(6)}
                </ThemedText>
              </View>
            )}

            {/* Location Information & Image */}
            {loadingSelectedInfo ? (
              <View style={styles.loadingInfo}>
                <LoadingContainerAnimation />
              </View>
            ) : (
              <>
                {selectedLocationImage && (
                  <View style={styles.cityImageContainer}>
                    <Image 
                      source={{ uri: selectedLocationImage }}
                      style={styles.cityImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {selectedLocationInfo && (
                  <ThemedText style={styles.cityInfo}>
                    {selectedLocationInfo}
                  </ThemedText>
                )}

                {/* Quick Facts */}
                {quickFacts && (
                  <ThemedView color='primary' shadow style={styles.quickFactsContainer}>
                    <GradientBlobs/>
                    {formatPlaceType(quickFacts.types) && (
                      <View style={styles.quickFactItem}>
                        <ThemedIcons library="MaterialIcons" name="category" size={18}/>
                        <ThemedText>{formatPlaceType(quickFacts.types)}</ThemedText>
                      </View>
                    )}
                    {quickFacts.rating && (
                      <View style={styles.quickFactItem}>
                        <ThemedIcons library="MaterialIcons" name="star" size={18}/>
                        <ThemedText>{quickFacts.rating} ({quickFacts.totalRatings})</ThemedText>
                      </View>
                    )}
                    {formatPriceLevel(quickFacts.priceLevel) && (
                      <View style={styles.quickFactItem}>
                        <ThemedIcons library="MaterialIcons" name="attach-money" size={18}/>
                        <ThemedText>{formatPriceLevel(quickFacts.priceLevel)}</ThemedText>
                      </View>
                    )}
                    {quickFacts.openingHours && (
                      <View style={styles.quickFactItem}>
                        <ThemedIcons library="MaterialIcons" name="schedule" size={18}/>
                        <ThemedText>
                          {quickFacts.openingHours.open_now ? 'Open now' : 'Closed'}
                        </ThemedText>
                      </View>
                    )}
                    {quickFacts.phoneNumber && (
                      <View style={styles.quickFactItem}>
                        <ThemedIcons library="MaterialIcons" name="phone" size={18}/>
                        <ThemedText>{quickFacts.phoneNumber}</ThemedText>
                      </View>
                    )}
                    {quickFacts.website && (
                      <View style={styles.quickFactItem}>
                        <ThemedIcons library="MaterialIcons" name="language" size={18}/>
                        <ThemedText numberOfLines={1}>{quickFacts.website}</ThemedText>
                      </View>
                    )}
                  </ThemedView>
                )}
              </>
            )}

            {/* Weather Card */}
            <WeatherCard
              latitude={selectedLocation.latitude || 0}
              longitude={selectedLocation.longitude || 0}
              date={new Date().toISOString().split('T')[0]}
              locationName={selectedLocation.locationName}
            />

            {/* Get Directions Button */}
            <Button
              title="Get Directions"
              onPress={() => handleGetDirection(selectedLocation)}
              type="primary"
            />

            {/* Attractions (only if it's a city/place, not establishment) */}
            {selectedAttractions.length > 0 && (
              <View style={styles.attractionsContainer}>
                <ThemedText type="subtitle" style={{marginBottom: 10, marginTop: 15}}>
                  Nearby Attractions
                </ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attractionsScroll}>
                  {selectedAttractions.map((attraction, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.attractionCard}
                      onPress={() => handleAttractionClick(attraction)}
                    >
                      {attraction.photoUrl ? (
                        <Image 
                          source={{ uri: attraction.photoUrl }}
                          style={styles.attractionImage}
                          resizeMode="cover"
                        />
                      ) : attraction.location ? (
                        <View style={styles.attractionMapContainer}>
                          <MapView
                            style={styles.attractionMap}
                            provider={PROVIDER_DEFAULT}
                            region={{
                              latitude: attraction.location.lat,
                              longitude: attraction.location.lng,
                              latitudeDelta: 0.005,
                              longitudeDelta: 0.005,
                            }}
                            scrollEnabled={false}
                            zoomEnabled={false}
                            rotateEnabled={false}
                            pitchEnabled={false}
                          >
                            <TaraMarker
                              type="dot"
                              coordinate={{
                                latitude: attraction.location.lat,
                                longitude: attraction.location.lng,
                              }}
                            />
                          </MapView>
                        </View>
                      ) : (
                        <View style={styles.attractionImagePlaceholder}>
                          <ThemedIcons library="MaterialIcons" name="place" size={40} color={primaryColor} />
                        </View>
                      )}
                      <LinearGradient
                        colors={['transparent', '#000']}
                        style={styles.attractionCardText}
                      >
                        <ThemedText style={styles.attractionName} numberOfLines={2}>
                          {attraction.mainText}
                        </ThemedText>
                        <ThemedText style={styles.attractionSecondary} numberOfLines={1}>
                          {attraction.secondaryText}
                        </ThemedText>
                      </LinearGradient>
                      
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {loadingSelectedAttractions && (
              <View style={styles.loadingInfo}>
                <LoadingContainerAnimation />
                <ThemedText style={{textAlign: 'center', marginTop: 10}}>Loading attractions...</ThemedText>
              </View>
            )}
            </View>
          </ScrollView>
        </BottomSheet>
      ):(
        /* STATE A: No Selected Location (Default) */
        <BottomSheet snapPoints={[0.4, 0.75]} defaultIndex={0}>
          <ScrollView style={styles.bottomSheetContent}>
            <View>
              <ThemedText>Your currently in</ThemedText>
              { (city || loading || loadingCityInfo) && (
                <ThemedText type="subtitle" style={{marginBottom: 10}}>
                  {suburb && city ? `${suburb}, ${city}` : city || 'Your Location'}
                  {state && `, ${state}`}
                  {country && `, ${country}`}
                </ThemedText>
              )}

            {/* Show loading if location is still loading OR city info is loading */}
            {(loading || loadingCityInfo) ? (
              <View style={styles.loadingInfo}>
                <LoadingContainerAnimation />
              </View>
            ) : (
              <>
                {/* City Information & Image from Places API */}
                {cityImage && (
                  <View style={styles.cityImageContainer}>
                    <Image 
                      source={{ uri: cityImage }}
                      style={styles.cityImage}
                      resizeMode="cover"
                    />
                  </View>
                )}
                {cityInfo && (
                  <ThemedText style={styles.cityInfo}>
                    {cityInfo}
                  </ThemedText>
                )}

                {/* Attractions Near Current City */}
                {attractions.length > 0 && (
                  <View style={styles.attractionsContainer}>
                    <ThemedText type="subtitle" style={{marginBottom: 10, marginTop: 15}}>
                      Nearby Attractions
                    </ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attractionsScroll}>
                      {attractions.map((attraction, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.attractionCard}
                          onPress={() => handleAttractionClick(attraction)}
                        >
                          {attraction.photoUrl ? (
                            <Image 
                              source={{ uri: attraction.photoUrl }}
                              style={styles.attractionImage}
                              resizeMode="cover"
                            />
                          ) : attraction.location ? (
                            <View style={styles.attractionMapContainer}>
                              <MapView
                                style={styles.attractionMap}
                                provider={PROVIDER_DEFAULT}
                                region={{
                                  latitude: attraction.location.lat,
                                  longitude: attraction.location.lng,
                                  latitudeDelta: 0.005,
                                  longitudeDelta: 0.005,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                rotateEnabled={false}
                                pitchEnabled={false}
                              >
                                <TaraMarker
                                  type="dot"
                                  coordinate={{
                                    latitude: attraction.location.lat,
                                    longitude: attraction.location.lng,
                                  }}
                                />
                              </MapView>
                            </View>
                          ) : (
                            <View style={styles.attractionImagePlaceholder}>
                              <ThemedIcons library="MaterialIcons" name="place" size={40} color={primaryColor} />
                            </View>
                          )}
                          <LinearGradient
                            colors={['transparent', '#000']}
                            style={styles.attractionCardText}
                          >
                            <ThemedText style={styles.attractionName} numberOfLines={2}>
                              {attraction.mainText}
                            </ThemedText>
                            <ThemedText style={styles.attractionSecondary} numberOfLines={1}>
                              {attraction.secondaryText}
                            </ThemedText>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {loadingAttractions && (
                  <View style={styles.loadingInfo}>
                    <LoadingContainerAnimation />
                    <ThemedText style={{textAlign: 'center', marginTop: 10}}>Loading attractions...</ThemedText>
                  </View>
                )}
              </>
            )}
            </View>
          </ScrollView>
        </BottomSheet>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    padding: 16,
    paddingBottom: 25,
    pointerEvents: 'box-none'
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
    paddingBottom: 280,
  },
  locationNote: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  coordinateValue: {
    marginVertical: 10,
    opacity: 0.5,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  locationDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    opacity: .5,
    marginBottom: 15
  },
  cityInfo: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
    opacity: 0.8
  },
  loadingInfo: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15
  },
  cityImageContainer: {
    marginBottom: 15
  },
  cityImageLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 5
  },
  cityImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10
  },
  attractionsContainer: {
    marginTop: 10,
    marginBottom: 20
  },
  attractionsScroll: {
    marginBottom: 10
  },
  attractionCard: {
    width: 150,
    height: 200,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(128, 128, 128, 0.2)',
    overflow: 'hidden'
  },
  attractionImage: {
    width: '100%',
    height: '100%'
  },
  attractionMapContainer: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  attractionMap: {
    width: '100%',
    height: '100%',
  },
  attractionImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attractionCardText:{
    position: 'absolute',
    right: 0,
    left: 0,
    bottom: 0,
    zIndex: 3,
    padding: 8
  },
  attractionName: {
    fontSize: 12,
    marginTop: 8,
    color: '#fff'
  },
  attractionSecondary: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 4,
    color: '#fff'
  },
  quickFactsContainer: {
    marginTop: 10,
    marginBottom: 15,
    padding: 12,
    borderRadius: 10,
    overflow: 'hidden'
  },
  quickFactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    width: '100%'
  },
});
