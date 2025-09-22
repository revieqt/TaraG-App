import TextField from "@/components/TextField";
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LinearGradient } from "expo-linear-gradient";
import RoundedButton from "@/components/RoundedButton";
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import { ThemedView } from "@/components/ThemedView";
import LocationAutocomplete, { LocationItem } from "@/components/LocationAutocomplete";
import { useState } from "react";
import ThemedIcons from "@/components/ThemedIcons";
import BottomSheet from "@/components/BottomSheet";
import { useLocation } from "@/hooks/useLocation";
import { BACKEND_URL } from "@/constants/Config";

// const categories = [{
//     "accomodations":{
//         {label:"Accomodations", value:"accomodations"}
//     },
//     "food":{
//         {}
//     },
//     "facilities":{
//         {}
//     },
//     "attractions":{
//         {}
//     },
//     "services":{
//         {}
//     }
// }
// ];

interface Amenity {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    phone: string | null;
    website: string | null;
}

export default function DefaultMap() {
    const primaryColor = useThemeColor({}, 'primary');
    const secondaryColor = useThemeColor({}, 'secondary');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAllCategoryVisible, setIsAllCategoryVisible] = useState(false);
    const [isAccomodations, setIsAccomodations] = useState(false);
    const [isFood, setIsFood] = useState(false);
    const [isFacilities, setIsFacilities] = useState(false);
    const [isAttractions, setIsAttractions] = useState(false);
    const [isServices, setIsServices] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchResults, setSearchResults] = useState<Amenity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [bottomSheetKey, setBottomSheetKey] = useState(0);
    
    const { latitude, longitude } = useLocation();
    
    
    const handleCategorySelect = (category: string) => {
        switch (category) {
            case 'accomodations':
                setIsAccomodations(true);
                setIsModalVisible(true);
                break;
            case 'food':
                setIsFood(true);
                setIsModalVisible(true);
                break;
            case 'facilities':
                setIsFacilities(true);
                setIsModalVisible(true);
                break;
            case 'attractions':
                setIsAttractions(true);
                setIsModalVisible(true);
                break;
            case 'services':
                setIsServices(true);
                setIsModalVisible(true);
                break;
            default:
                setIsAllCategoryVisible(true);
                setIsModalVisible(true);
                break;
        }
    };

    const searchAmenities = async (amenity?: string, tourism?: string, aeroway?: string) => {
        if (!latitude || !longitude) {
            console.error('Location not available');
            return;
        }

        // Hide modal and show BottomSheet immediately
        setIsModalVisible(false);
        setIsAllCategoryVisible(false);
        setIsAccomodations(false);
        setIsFood(false);
        setIsFacilities(false);
        setIsAttractions(false);
        setIsServices(false);
        setShowResults(true);
        setIsLoading(true);
        setSearchResults([]); // Clear previous results
        setBottomSheetKey(prev => prev + 1); // Force BottomSheet to re-render and reset position

        try {
            const response = await fetch(`${BACKEND_URL}/amenities/nearest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amenity,
                    tourism,
                    aeroway,
                    latitude,
                    longitude,
                }),
            });

            if (response.ok) {
                const results = await response.json();
                setSearchResults(results);
            } else {
                console.error('Failed to fetch amenities');
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Error searching amenities:', error);
            setSearchResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleModalClose = () => {
        setIsModalVisible(false);
        setIsAllCategoryVisible(false);
        setIsAccomodations(false);
        setIsFood(false);
        setIsFacilities(false);
        setIsAttractions(false);
        setIsServices(false);
        setShowResults(false);
        setSearchResults([]);
    };
    
    return (
    <View style={styles.content}>
        <LinearGradient
            colors={['#000', 'transparent']}
            style={styles.headerGradient}
        />
        <View style={styles.searchContent}>
            <TouchableOpacity onPress={() => handleCategorySelect('all')}>
                <ThemedView color='primary' shadow style={styles.searchButton}>
                    <ThemedText style={{opacity: .5}}>Search</ThemedText>
                </ThemedView>
            </TouchableOpacity>

            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScrollView}
                contentContainerStyle={{gap:8}}
            >
                <TouchableOpacity onPress={() => handleCategorySelect('accomodations')}>
                    <View style={styles.categoryButtonContent}>
                        <ThemedIcons library="MaterialIcons" name="hotel" size={20} color="#fff" />
                        <ThemedText style={styles.categoryButtonText}>Accomodations</ThemedText>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleCategorySelect('food')}>
                    <View style={styles.categoryButtonContent}>
                        <ThemedIcons library="MaterialIcons" name="restaurant" size={20} color="#fff" />
                        <ThemedText style={styles.categoryButtonText}>Food</ThemedText>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleCategorySelect('facilities')}>
                    <View style={styles.categoryButtonContent}>
                        <ThemedIcons library="MaterialIcons" name="local-gas-station" size={20} color="#fff" />
                        <ThemedText style={styles.categoryButtonText}>Travel Facilities</ThemedText>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleCategorySelect('attractions')}>
                    <View style={styles.categoryButtonContent}>
                        <ThemedIcons library="MaterialIcons" name="local-hospital" size={20} color="#fff" />
                        <ThemedText style={styles.categoryButtonText}>Attractions</ThemedText>
                    </View>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => handleCategorySelect('services')}>
                    <View style={styles.categoryButtonContent}>
                        <ThemedIcons library="MaterialIcons" name="shopping-cart" size={20} color="#fff" />
                        <ThemedText style={styles.categoryButtonText}>Services</ThemedText>
                    </View>
                </TouchableOpacity>
            </ScrollView>
            
        </View>

        <RoundedButton
            size={60}
            iconLibrary="MaterialDesignIcons"
            iconName="compass"
            iconColor="#fff"
            onPress={() => router.push('/routes/routes-create')}
            style={{position: 'absolute', bottom: 20, right: 20}}
        />

        <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setIsModalVisible(false)}
        >
            <TouchableOpacity style={styles.modalOverlay} onPress={handleModalClose}>
                <View style={{width: '100%'}}>
                    <LocationAutocomplete
                        value=""
                        onSelect={() => {}}
                        placeholder="Enter location to search..."
                        style={{flex: 1, width: '100%'}}
                    />
                </View>

                <ScrollView style={{paddingTop: 100}} showsVerticalScrollIndicator={false}>
                    <ThemedText type='subtitle' style={{color: '#fff', marginBottom: 20}}>You might be looking for</ThemedText>
                
                    { (isAllCategoryVisible || isAccomodations) && (
                        <View style={{marginBottom: 20}}>
                            <ThemedText type='defaultSemiBold' style={{color: '#fff', marginBottom: 10}}>Accommodation</ThemedText>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('hotel')}>
                                    <ThemedText style={styles.amenityButtonText}>Hotel</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'guest_house')}>
                                    <ThemedText style={styles.amenityButtonText}>Guest House</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'hostel')}>
                                    <ThemedText style={styles.amenityButtonText}>Hostel</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'motel')}>
                                    <ThemedText style={styles.amenityButtonText}>Motel</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'resort')}>
                                    <ThemedText style={styles.amenityButtonText}>Resort</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    { (isAllCategoryVisible || isFood) && (
                        <View style={{marginBottom: 20}}>
                            <ThemedText type='defaultSemiBold' style={{color: '#fff', marginBottom: 10}}>Food</ThemedText>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('restaurant')}>
                                    <ThemedText style={styles.amenityButtonText}>Restaurant</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('fast_food')}>
                                    <ThemedText style={styles.amenityButtonText}>Fast Food</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('cafe')}>
                                    <ThemedText style={styles.amenityButtonText}>Cafe</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('bar')}>
                                    <ThemedText style={styles.amenityButtonText}>Bar</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('pub')}>
                                    <ThemedText style={styles.amenityButtonText}>Pub</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('food_court')}>
                                    <ThemedText style={styles.amenityButtonText}>Food Court</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    { (isAllCategoryVisible || isFacilities) && (
                        <View style={{marginBottom: 20}}>
                            <ThemedText type='defaultSemiBold' style={{color: '#fff', marginBottom: 10}}>Travel Facilities</ThemedText>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('bus_station')}>
                                    <ThemedText style={styles.amenityButtonText}>Bus Station</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('bus_stop')}>
                                    <ThemedText style={styles.amenityButtonText}>Bus Stop</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('taxi')}>
                                    <ThemedText style={styles.amenityButtonText}>Taxi</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('ferry_terminal')}>
                                    <ThemedText style={styles.amenityButtonText}>Ferry Terminal</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, undefined, 'aerodrome')}>
                                    <ThemedText style={styles.amenityButtonText}>Airport</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    { (isAllCategoryVisible || isAttractions) && (
                        <View style={{marginBottom: 20}}>
                            <ThemedText type='defaultSemiBold' style={{color: '#fff', marginBottom: 10}}>Attractions</ThemedText>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'information')}>
                                    <ThemedText style={styles.amenityButtonText}>Information</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'attraction')}>
                                    <ThemedText style={styles.amenityButtonText}>Attraction</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'museum')}>
                                    <ThemedText style={styles.amenityButtonText}>Museum</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'artwork')}>
                                    <ThemedText style={styles.amenityButtonText}>Artwork</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'theme_park')}>
                                    <ThemedText style={styles.amenityButtonText}>Theme Park</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities(undefined, 'zoo')}>
                                    <ThemedText style={styles.amenityButtonText}>Zoo</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    { (isAllCategoryVisible || isServices) && (
                        <View style={{marginBottom: 20}}>
                            <ThemedText type='defaultSemiBold' style={{color: '#fff', marginBottom: 10}}>Services</ThemedText>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('bank')}>
                                    <ThemedText style={styles.amenityButtonText}>Bank</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.amenityButton} onPress={() => searchAmenities('pharmacy')}>
                                    <ThemedText style={styles.amenityButtonText}>Pharmacy</ThemedText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </TouchableOpacity>
        </Modal>

        {/* BottomSheet for displaying search results */}
        {showResults && (
            <BottomSheet key={bottomSheetKey} snapPoints={[0.3, 0.6, 0.9]} defaultIndex={1}>
                <View>
                    <ThemedText type="subtitle" style={{ marginBottom: 20 }}>
                        {isLoading ? 'Searching...' : `Search Results (${searchResults.length} found)`}
                    </ThemedText>
                    
                    {isLoading ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ThemedText>Loading nearby amenities...</ThemedText>
                        </View>
                    ) : searchResults.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                            <ThemedText type="defaultSemiBold" style={{ marginBottom: 10 }}>
                                No results found nearby
                            </ThemedText>
                            <ThemedText style={{ textAlign: 'center', opacity: 0.7 }}>
                                Try searching for a different type of amenity or check your location.
                            </ThemedText>
                        </View>
                    ) : (
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {searchResults.map((amenity, index) => (
                                <ThemedView key={amenity.id || index} style={styles.resultItem}>
                                    <ThemedText type="defaultSemiBold" style={styles.resultName}>
                                        {amenity.name}
                                    </ThemedText>
                                    <ThemedText style={styles.resultAddress}>
                                        {amenity.address}
                                    </ThemedText>
                                    {amenity.phone && (
                                        <ThemedText style={styles.resultPhone}>
                                            📞 {amenity.phone}
                                        </ThemedText>
                                    )}
                                    {amenity.website && (
                                        <ThemedText style={styles.resultWebsite}>
                                            🌐 {amenity.website}
                                        </ThemedText>
                                    )}
                                </ThemedView>
                            ))}
                        </ScrollView>
                    )}
                    
                    <TouchableOpacity 
                        style={styles.closeButton} 
                        onPress={() => setShowResults(false)}
                    >
                        <ThemedText style={styles.closeButtonText}>Close</ThemedText>
                    </TouchableOpacity>
                </View>
            </BottomSheet>
        )}
    </View>
   ); 
}

const styles = StyleSheet.create({
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        zIndex: 1000
    },
    searchContent: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 1002
    },
    searchButton:{
        width: '100%',
        padding: 10,
        borderRadius: 14,
        height: 48,

    },
    addButton: {
        marginTop: -12,
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 150,
        opacity: .5,
        pointerEvents: 'none',
      },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
    },
    modalCloseButton: {
        padding: 5,
    },
    horizontalScrollView: {
        marginTop: 15,
    },
    categoryButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        backgroundColor: 'rgba(0,0,0,.5)'
    },
    categoryButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    amenityButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    amenityButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    resultItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    resultName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    resultAddress: {
        fontSize: 14,
        opacity: 0.8,
        marginBottom: 5,
    },
    resultPhone: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 3,
    },
    resultWebsite: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 3,
    },
    closeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    closeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});