import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import Carousel from '@/components/Carousel';
import TextField from '@/components/TextField';
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ThemedIcons from "@/components/ThemedIcons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSession } from "@/context/SessionContext";
import TourGuideSection from "./tours-tourGuide";
import { getAllActiveTours, Tour } from "@/services/tourApiService";
import EmptyMessage from "@/components/EmptyMessage";

export default function ToursSection(){
  const { session } = useSession();
  const [tours, setTours] = useState<Tour[]>([]);
  const [filteredTours, setFilteredTours] = useState<Tour[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const accentColor = useThemeColor({}, 'accent');
  const textColor = useThemeColor({}, 'text');
  const primaryColor = useThemeColor({}, 'primary');

  // Fetch tours for travelers
  useEffect(() => {
    if (session?.user?.type === 'traveler' && session?.accessToken) {
      fetchTours();
    }
  }, [session?.user?.type, session?.accessToken]);

  const fetchTours = async () => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    try {
      const fetchedTours = await getAllActiveTours(session.accessToken);
      setTours(fetchedTours);
      setFilteredTours(fetchedTours);
    } catch (error) {
      console.error('Error fetching tours:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter tours based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTours(tours);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = tours.filter(tour => 
        tour.name.toLowerCase().includes(query) ||
        tour.description.toLowerCase().includes(query) ||
        tour.tags.some(tag => tag.toLowerCase().includes(query))
      );
      setFilteredTours(filtered);
    }
  }, [searchQuery, tours]);

  const handleTourPress = (tour: Tour) => {
    router.push({
      pathname: '/tours/tours-avail',
      params: { tourData: JSON.stringify(tour) }
    });
  };

  const formatDate = (date: any) => {
    if (!date) return 'Date TBA';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

    if(session?.user?.type === 'traveler'){
      if (loading) {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
            <ActivityIndicator size="large" color={accentColor} />
            <ThemedText style={{ marginTop: 16 }}>Loading tours...</ThemedText>
          </View>
        );
      }

      return(
        <ScrollView>
          {/* Carousel with top tours */}
          {tours.length > 0 && (
            <View style={styles.carouselContainer}>
              <Carousel
                images={tours.slice(0, 3).map(tour => tour.images[0] || 'https://via.placeholder.com/400x300')}
                titles={tours.slice(0, 3).map(tour => tour.name)}
                subtitles={tours.slice(0, 3).map(tour => tour.description.substring(0, 60) + '...')}
                buttonLabels={tours.slice(0, 3).map(() => 'View Tour')}
                buttonLinks={tours.slice(0, 3).map(tour => () => handleTourPress(tour))}
                darkenImage
                navigationArrows
              />
            </View>
          )}

          {/* Search Field */}
          <View style={styles.options}>
            <View style={{flex: 1}}>
              <TextField
                placeholder="Search tours..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => {}}
                onBlur={() => {}}
                isFocused={false}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Tours List */}
          {filteredTours.length === 0 ? (
            <EmptyMessage
              iconLibrary="MaterialIcons"
              iconName="explore-off"
              title={searchQuery ? "No tours found" : "No tours available"}
              description={searchQuery ? "Try a different search term" : "Check back later for new tours"}
            />
          ) : (
            <View style={styles.toursGrid}>
              {filteredTours.map((tour) => (
                <TouchableOpacity
                  key={tour.tourID}
                  style={styles.tourCard}
                  onPress={() => handleTourPress(tour)}
                >
                  <Image
                    source={{ uri: tour.images[0] || 'https://via.placeholder.com/400x300' }}
                    style={styles.tourImage}
                    resizeMode="cover"
                  />
                  <ThemedView color="primary" style={styles.tourInfo}>
                    <ThemedText type="defaultSemiBold" numberOfLines={1}>
                      {tour.name}
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.7, fontSize: 12 }} numberOfLines={2}>
                      {tour.description}
                    </ThemedText>
                    
                    {/* Date and Price Row */}
                    <View style={styles.tourMeta}>
                      {tour.itineraryData && (
                        <View style={styles.metaItem}>
                          <ThemedIcons library="MaterialIcons" name="calendar-today" size={14} color={textColor} />
                          <ThemedText style={{ fontSize: 11, marginLeft: 4, opacity: 0.7 }}>
                            {formatDate(tour.itineraryData.startDate)}
                          </ThemedText>
                        </View>
                      )}
                      <View style={styles.metaItem}>
                        <ThemedText style={{ fontSize: 14, fontWeight: '600', color: accentColor }}>
                          {tour.pricing.currency} {tour.pricing.price}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Capacity */}
                    <View style={styles.capacityBar}>
                      <ThemedIcons library="MaterialIcons" name="people" size={14} color={textColor} />
                      <ThemedText style={{ fontSize: 11, marginLeft: 4, opacity: 0.7 }}>
                        {(tour.participants?.members?.filter((m: any) => m.isApproved)?.length || 0)}/{tour.participants?.maxCapacity || 0} joined
                      </ThemedText>
                    </View>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
    );}

    if(session?.user?.type === 'tourGuide'){
    return(
      <TourGuideSection agencyID={session?.user?.agency?.agencyID} />
    );}
    
};

const styles = StyleSheet.create({
    options:{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        margin: 20,
    },
    carouselContainer:{
        width: '100%',
        height: 320,
    },
    toursGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 10,
        gap: 12,
    },
    tourCard: {
        width: '48%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
    },
    tourImage: {
        width: '100%',
        height: 120,
    },
    tourInfo: {
        padding: 12,
    },
    tourMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    capacityBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
});
