import CubeButton from '@/components/RoundedButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/useThemeColor';
import WeatherCard from '@/components/custom/WeatherCard';
import { LinearGradient } from 'expo-linear-gradient';
import HomeMap from '@/components/maps/HomeMap';
import { router } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import WeeklyCalendar from '@/components/WeeklyCalendar';
import { getItinerariesById } from '@/services/itinerariesApiService';
import { groupsApiService } from '@/services/groupsApiService';
import AlertsContainer from '@/components/custom/AlertsContainer';
import ActiveRouteButton from '@/components/custom/ActiveRouteButton';

export default function HomeScreen() {
  const { session } = useSession();
  const user = session?.user;
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);



  // Function to check if a date falls within an itinerary's date range
  const isDateInItinerary = (date: Date, itinerary: any) => {
    if (!itinerary.startDate || !itinerary.endDate) return false;
    const startDate = new Date(itinerary.startDate);
    const endDate = new Date(itinerary.endDate);
    return date >= startDate && date <= endDate;
  };

  // Function to fetch user's itineraries and group itineraries
  const fetchCalendarEvents = async () => {
    if (!session?.accessToken || !session?.user?.id) return;

    setEventsLoading(true);
    try {
      const events: any[] = [];

      // Fetch user's personal itineraries
      const itinerariesResponse = await getItinerariesById(session.user.id, session.accessToken);
      
      // Convert itineraries to calendar events
      if (itinerariesResponse.success && itinerariesResponse.data) {
        itinerariesResponse.data.forEach((itinerary: any) => {
          if (itinerary.startDate && itinerary.endDate) {
            events.push({
              id: `itinerary-${itinerary.id}`,
              title: itinerary.title,
              start: new Date(itinerary.startDate),
              end: new Date(itinerary.endDate),
              color: primaryColor,
              type: 'personal'
            });
          }
        });
      }

      // Fetch user's groups
      const userGroups = await groupsApiService.getGroups(session.accessToken, session.user.id);
      
      // For each group, fetch its itinerary if it has one
      for (const group of userGroups) {
        if (group.itineraryID) {
          try {
            const groupItineraryResponse = await getItinerariesById(group.itineraryID, session.accessToken);
            if (groupItineraryResponse.success && groupItineraryResponse.data && groupItineraryResponse.data.length > 0) {
              const itinerary = groupItineraryResponse.data[0];
              if (itinerary.startDate && itinerary.endDate) {
                events.push({
                  id: `group-itinerary-${group.id}`,
                  title: `${group.name}: ${itinerary.title}`,
                  start: new Date(itinerary.startDate),
                  end: new Date(itinerary.endDate),
                  color: secondaryColor,
                  type: 'group'
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching itinerary for group ${group.id}:`, error);
          }
        }
      }

      setCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  // Fetch events on component mount and when session changes
  useEffect(() => {
    fetchCalendarEvents();
  }, [session?.accessToken, session?.user?.id]);

  // Refresh events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCalendarEvents();
    }, [session?.accessToken, session?.user?.id])
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView>
        <View>
          <View style={styles.mapHeaderContainer}>
            <HomeMap/>
          </View>

          <View style={styles.headerContent}>
            <LinearGradient
              colors={['transparent', backgroundColor]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />
            
            <View style={styles.textContainer}>
              <ThemedText type='title' style={{color: secondaryColor}}>
                Hello {user?.fname ? `${user.fname}` : ''}!
              </ThemedText>
              <ThemedText type='defaultSemiBold' style={{opacity: 0.7}}>Welcome to TaraG!</ThemedText>
            </View>
            <Image source={require('@/assets/images/tara-cheerful.png')} style={styles.taraImage} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View style={styles.menu}>
            <View style={styles.menuOptions}>
              <CubeButton
                size={57}
                iconName="route"
                iconSize={25}
                iconColor="#fff"
                onPress={() => router.push('/routes/routes')}
              />
              <ThemedText style={styles.menuOptionText}>Routes</ThemedText>
            </View>

            <View style={styles.menuOptions}>
              <CubeButton
                size={57}
                iconName="event-note"
                iconSize={25}
                iconColor="#fff"
                onPress={() => router.push('/itineraries/itineraries')}
              />
              <ThemedText style={styles.menuOptionText}>Itineraries</ThemedText>
            </View>

            <View style={styles.menuOptions}>
              <CubeButton
                size={57}
                iconLibrary="MaterialDesignIcons"
                iconName="car-brake-alert"
                iconSize={25}
                iconColor="#fff"
                onPress={() => router.push('/safety/safety')}
              />
              <ThemedText style={styles.menuOptionText}>Safety</ThemedText>
            </View>

            <View style={styles.menuOptions}>
              <CubeButton
                size={57}
                iconLibrary="MaterialDesignIcons"
                iconName="robot-happy-outline"
                iconSize={25}
                iconColor="#fff"
                onPress={() => router.push('/home/aiChat')}
              />
              <ThemedText style={styles.menuOptionText}>TaraAI</ThemedText>
            </View>
          </View>

          <WeatherCard current />
          <WeeklyCalendar
            events={calendarEvents}
          />
        </View>
      </ScrollView>
      
      <AlertsContainer>
         { session?.activeRoute && (
          <ActiveRouteButton/>
        )}
      </AlertsContainer>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mapHeaderContainer: {
    height: 280,
    overflow: 'hidden',
    backgroundColor: 'blue',
  },
  taraImage: {
    position: 'absolute',
    bottom: -80,
    right: -30,
    width: 150,
    height: 240,
    zIndex: 2,
  },
  gradientOverlay: {
    height: 100,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
    pointerEvents: 'none',
  },
  headerContent: {
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
    padding: 16,
    zIndex: 3,
    pointerEvents: 'box-none', // This allows touches to pass through except for the actual content
  },
  textContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    zIndex: 3,
  },
  menu:{
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingVertical: 25,
  },
  menuOptions:{
    width: '22%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 40,
  },
  menuOptionText:{
    fontSize: 12,
    marginTop: 5,
    opacity: 0.6,
  },
});