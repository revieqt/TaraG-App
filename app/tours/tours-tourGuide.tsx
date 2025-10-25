import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import Carousel from '@/components/Carousel';
import TextField from '@/components/TextField';
import { router } from "expo-router";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedIcons } from "@/components/ThemedIcons";
import { useSession } from "@/context/SessionContext";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LinearGradient } from "expo-linear-gradient";
import { getAgencyById, Agency } from "@/services/agencyApiService";
import { getToursByTourGuide, categorizeTours, Tour, CategorizedTours } from "@/services/tourApiService";
import GradientBlobs from "@/components/GradientBlobs";
import ProBadge from "@/components/custom/ProBadge";

interface TourGuideSectionProps {
  agencyID?: string;
}

export default function TourGuideSection({ agencyID }: TourGuideSectionProps){
  const { session } = useSession();
  const backgroundColor = useThemeColor({}, 'background');
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState('ongoing');
  const accentColor = useThemeColor({}, 'accent');
  const [error, setError] = useState<string | null>(null);
  const [tours, setTours] = useState<Tour[]>([]);
  const [categorizedTours, setCategorizedTours] = useState<CategorizedTours>({
    ongoing: [],
    upcoming: [],
    history: []
  });
  const [toursLoading, setToursLoading] = useState(false);

  useEffect(() => {
    // Use agencyID from session if not provided as prop
    const effectiveAgencyID = agencyID || session?.user?.agency?.agencyID;
    if (effectiveAgencyID) {
      fetchAgency(effectiveAgencyID);
      fetchTours(effectiveAgencyID);
    }
  }, [agencyID, session?.user?.agency?.agencyID]);

  const fetchAgency = async (id: string) => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getAgencyById({ agencyID: id }, session.accessToken);
      setAgency(data);
    } catch (err: any) {
      console.error('Error fetching agency:', err);
      setError(err.message || 'Failed to load agency details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTours = async (agencyID: string) => {
    if (!session?.accessToken || !session?.user?.id) {
      console.log('❌ Missing session data:', {
        hasAccessToken: !!session?.accessToken,
        hasUserID: !!session?.user?.id
      });
      return;
    }
    
    console.log('🔍 Fetching tours for:', {
      agencyID,
      userID: session.user.id
    });
    
    setToursLoading(true);
    try {
      const fetchedTours = await getToursByTourGuide(
        agencyID,
        session.user.id,
        session.accessToken
      );
      console.log('✅ Fetched tours:', fetchedTours.length);
      console.log('📦 Tours data:', fetchedTours);
      
      setTours(fetchedTours);
      const categorized = categorizeTours(fetchedTours);
      console.log('📊 Categorized tours:', {
        ongoing: categorized.ongoing.length,
        upcoming: categorized.upcoming.length,
        history: categorized.history.length
      });
      console.log('📍 Detailed categorization:', categorized);
      setCategorizedTours(categorized);
    } catch (err: any) {
      console.error('❌ Error fetching tours:', err);
    } finally {
      setToursLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={{ marginTop: 10 }}>Loading agency details...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <ThemedIcons library="MaterialIcons" name="error-outline" size={48} />
        <ThemedText style={{ marginTop: 10, opacity: 0.7 }}>{error}</ThemedText>
      </View>
    );
  }

  // Get user's agency data from session (user info, not full agency)
  const userData = session?.user;
  const userAgencyData = session?.user?.agency;


  return(
    <ScrollView>
      {/* Header with cover image (using logo as cover) */}
      <ThemedView color='secondary' style={styles.header}>
        {agency?.logo && (
          <Image 
            source={{ uri: agency.logo }} 
            style={styles.coverImage}
            resizeMode="cover"
          />
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', backgroundColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.agencyNameContainer}
        >
          <View style={styles.agencyHeaderContent}>
            <View style={{ flex: 1 }}>
              <ThemedText type="title" style={{ color: '#fff'}}>
                {agency?.name || 'Agency Name'}
              </ThemedText>
              {agency?.type && (
                <ThemedText style={{color: '#fff'}}>
                  {agency.type}
                </ThemedText>
              )}
              {agency?.verified && (
                <View style={styles.verifiedBadge}>
                  <ThemedIcons library="MaterialIcons" name="verified" size={16} color="#4CAF50" />
                  <ThemedText style={[styles.verifiedText, { color: '#4CAF50' }]}>Verified</ThemedText>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ThemedView>

      <ThemedView color='primary' shadow style={styles.detailsContainer}>
        <GradientBlobs/>
        <View style={styles.detailsRow}>
          <ThemedText type='subtitle' style={{fontSize: 14}}>{userData?.fname} {userData?.mname} {userData?.lname} </ThemedText>
          <ProBadge/>
        </View>
        <ThemedText style={{opacity: .7}}>{userAgencyData?.role}</ThemedText>
        <ThemedText style={{opacity: .5}}>Business Email: {userAgencyData?.businessEmail}</ThemedText>
        <ThemedText style={{opacity: .5}}>Business Number: {userAgencyData?.businessContactNumber}</ThemedText>
        
      </ThemedView>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.typeButtonsContainer}
        contentContainerStyle={{paddingHorizontal: 16, gap: 12}}
      >
        <TouchableOpacity 
          onPress={() => {
            setSelectedOption('ongoing');
          }}
        >
          <ThemedView 
            color='primary' 
            shadow 
            style={[
              styles.typeButton, 
              selectedOption === 'ongoing' && {backgroundColor: accentColor}
            ]}
          >
            <ThemedIcons 
              library='MaterialDesignIcons' 
              name='timer-pause-outline' 
              size={20}
              color={selectedOption === 'ongoing' ? 'white' : undefined}
            />
            <ThemedText style={selectedOption === 'ongoing' ? {color: 'white'} : undefined}>
              Ongoing
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {
            setSelectedOption('upcoming');
          }}
        >
          <ThemedView 
            color='primary' 
            shadow 
            style={[
              styles.typeButton, 
              selectedOption === 'upcoming' && {backgroundColor: accentColor}
            ]}
          >
            <ThemedIcons 
              library='MaterialDesignIcons' 
              name='timer-play-outline' 
              size={20}
              color={selectedOption === 'upcoming' ? 'white' : undefined}
            />
            <ThemedText style={selectedOption === 'upcoming' ? {color: 'white'} : undefined}>
              Upcoming
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => {
            setSelectedOption('history');
          }}
        >
          <ThemedView 
            color='primary' 
            shadow 
            style={[
              styles.typeButton, 
              selectedOption === 'history' && {backgroundColor: accentColor}
            ]}
          >
            <ThemedIcons 
              library='MaterialDesignIcons' 
              name='history' 
              size={20}
              color={selectedOption === 'history' ? 'white' : undefined}
            />
            <ThemedText style={selectedOption === 'history' ? {color: 'white'} : undefined}>
              History
            </ThemedText>
          </ThemedView>
        </TouchableOpacity>
      </ScrollView>

      {/* Tours Display */}
      <View style={{ padding: 16 }}>
        {toursLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />
            <ThemedText style={{ marginTop: 10 }}>Loading tours...</ThemedText>
          </View>
        ) : (
          <>
            {selectedOption === 'ongoing' && (
              <View>
                <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                  Ongoing Tours ({categorizedTours.ongoing.length})
                </ThemedText>
                {categorizedTours.ongoing.length > 0 ? (
                  categorizedTours.ongoing.map((tour) => (
                    <TourCard key={tour.tourID} tour={tour} />
                  ))
                ) : (
                  <ThemedView color="primary" shadow style={styles.emptyContainer}>
                    <ThemedIcons library="MaterialIcons" name="event-busy" size={48} />
                    <ThemedText style={{ marginTop: 10, opacity: 0.7 }}>
                      No ongoing tours
                    </ThemedText>
                  </ThemedView>
                )}
              </View>
            )}

            {selectedOption === 'upcoming' && (
              <View>
                <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                  Upcoming Tours ({categorizedTours.upcoming.length})
                </ThemedText>
                {categorizedTours.upcoming.length > 0 ? (
                  categorizedTours.upcoming.map((tour) => (
                    <TourCard key={tour.tourID} tour={tour} />
                  ))
                ) : (
                  <ThemedView color="primary" shadow style={styles.emptyContainer}>
                    <ThemedIcons library="MaterialIcons" name="event" size={48} />
                    <ThemedText style={{ marginTop: 10, opacity: 0.7 }}>
                      No upcoming tours
                    </ThemedText>
                  </ThemedView>
                )}
              </View>
            )}

            {selectedOption === 'history' && (
              <View>
                <ThemedText type="subtitle" style={{ marginBottom: 12 }}>
                  Tour History ({categorizedTours.history.length})
                </ThemedText>
                {categorizedTours.history.length > 0 ? (
                  categorizedTours.history.map((tour) => (
                    <TourCard key={tour.tourID} tour={tour} />
                  ))
                ) : (
                  <ThemedView color="primary" shadow style={styles.emptyContainer}>
                    <ThemedIcons library="MaterialIcons" name="history" size={48} />
                    <ThemedText style={{ marginTop: 10, opacity: 0.7 }}>
                      No tour history
                    </ThemedText>
                  </ThemedView>
                )}
              </View>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

// Tour Card Component
const TourCard = ({ tour }: { tour: Tour }) => {
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <TouchableOpacity
      onPress={() => {
        // Navigate to tour details
        router.push({
          pathname: '/tours/tours-view',
          params: { 
            tourID: tour.tourID,
            tourData: JSON.stringify(tour)
          }
        });
      }}
    >
      <ThemedView color="primary" shadow style={styles.tourCard}>
        {tour.images && tour.images.length > 0 && (
          <Image 
            source={{ uri: tour.images[0] }} 
            style={styles.tourImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.tourCardContent}>
          <ThemedText type="defaultSemiBold" style={{ fontSize: 16 }}>
            {tour.name}
          </ThemedText>
          <ThemedText style={{ opacity: 0.7, marginTop: 4 }} numberOfLines={2}>
            {tour.description}
          </ThemedText>
          
          {tour.itineraryData && (
            <View style={styles.tourDates}>
              <ThemedIcons library="MaterialIcons" name="calendar-today" size={14} />
              <ThemedText style={{ fontSize: 12, opacity: 0.7, marginLeft: 4 }}>
                {formatDate(tour.itineraryData.startDate)} - {formatDate(tour.itineraryData.endDate)}
              </ThemedText>
            </View>
          )}

          <View style={styles.tourFooter}>
            <View style={styles.tourStatus}>
              <ThemedText style={{ 
                fontSize: 12, 
                color: tour.status === 'completed' ? '#4CAF50' : 
                       tour.status === 'cancelled' ? '#FF4444' : '#2196F3',
                fontWeight: '600'
              }}>
                {tour.status?.toUpperCase() || 'DRAFT'}
              </ThemedText>
            </View>
            <ThemedText style={{ fontSize: 12, opacity: 0.7 }}>
              {tour.participants?.members?.length || 0}/{tour.participants?.maxCapacity || 0} participants
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header:{
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  coverImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  agencyNameContainer:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  agencyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailsRow:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  detailsContainer: {
    padding: 12,
    margin: 16,
    borderRadius: 15,
    overflow: 'hidden',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeButtonsContainer: {
    paddingBottom: 16,
  },
  typeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    gap: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  tourCard: {
    borderRadius: 15,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tourImage: {
    width: '100%',
    height: 150,
  },
  tourCardContent: {
    padding: 16,
  },
  tourDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tourFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  tourStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
});
