import { AlertCard } from '@/components/AlertCard';
import CubeButton from '@/components/RoundedButton';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSession } from '@/context/SessionContext';
import { Alert, useAlerts } from '@/hooks/useAlerts';
import { useLocation } from '@/hooks/useLocation';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherImage } from '@/utils/weatherUtils';
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
  const { suburb, city, loading, error, latitude, longitude } = useLocation();
  const { weatherData, loading: weatherLoading, error: weatherError } = useWeather(latitude || 0, longitude || 0);
  const backgroundColor = useThemeColor({}, 'background');
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');

  // Use alerts hook with user location
  const userLocation = {
    suburb,
    city,
    state: '',
    region: '',
    country: ''
  };
  const { alerts, loading: alertsLoading, error: alertsError } = useAlerts(userLocation);

  // State for calendar events
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const getLocationText = () => {
    if (error) return 'Location unavailable';
    if (suburb && city) return `${suburb}, ${city}`;
    if (city) return city;
    if (suburb) return suburb;
    return 'Location unavailable';
  };

  const handleAlertPress = (alert: Alert) => {
    router.push({
      pathname: '/account/alert-view',
      params: {
        alertId: alert.id,
        title: alert.title,
        note: alert.note,
        severity: alert.severity,
        target: alert.target.join(', ')
      }
    });
  };

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
            
            <TouchableOpacity 
              style={{flex: 1}} 
              onPress={() => router.push('/(tabs)/maps')}
            >
              <HomeMap/>
            </TouchableOpacity>
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

        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={styles.menu}>
            <View style={styles.menuOptions}>
              <CubeButton
                size={60}
                iconName="route"
                iconSize={27}
                iconColor="#fff"
                onPress={() => router.push('/routes/routes')}
              />
              <ThemedText style={styles.menuOptionText}>Routes</ThemedText>
            </View>

            <View style={styles.menuOptions}>
              <CubeButton
                size={60}
                iconName="event-note"
                iconSize={27}
                iconColor="#fff"
                onPress={() => router.push('/itineraries/itineraries')}
              />
              <ThemedText style={styles.menuOptionText}>Itineraries</ThemedText>
            </View>

            <View style={styles.menuOptions}>
              <CubeButton
                size={60}
                iconLibrary="MaterialDesignIcons"
                iconName="car-brake-alert"
                iconSize={27}
                iconColor="#fff"
                onPress={() => router.push('/home/safety')}
              />
              <ThemedText style={styles.menuOptionText}>Safety</ThemedText>
            </View>

            <View style={styles.menuOptions}>
              <CubeButton
                size={60}
                iconLibrary="MaterialDesignIcons"
                iconName="robot-happy-outline"
                iconSize={27}
                iconColor="#fff"
                onPress={() => router.push('/home/aiChat')}
              />
              <ThemedText style={styles.menuOptionText}>TaraAI</ThemedText>
            </View>
          </View>

          
          
          {(loading || weatherLoading ) ? (
             <View style={styles.loadingContainer}>
               <ActivityIndicator size="large"/>
             </View>
           ) : (
            <>
              <ThemedView shadow color='primary' style={styles.locationContent}>
                {/* Weather Image */}
                {weatherData && (
                  <Image 
                    source={getWeatherImage(weatherData.weatherCode)} 
                    style={styles.weatherImage}
                  />
                )}
                
                <ThemedText style={{opacity: .5}}>You're currently at</ThemedText>
                <ThemedText type='subtitle'>{getLocationText()}</ThemedText>
                {weatherData && (
                  <ThemedText style={{opacity: .5}}>
                    {weatherData.weatherType}
                  </ThemedText>
                )}
                <View style={{justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 30}}>
                  <View style={styles.weather}>
                    <ThemedIcons library='MaterialDesignIcons' name='thermometer' size={20} color='#B36B6B'/>
                    <ThemedText type='defaultSemiBold' style={{marginTop: 3}}>
                      {weatherData ? `${Math.round(weatherData.temperature)}°C` : '0°C'}
                    </ThemedText>
                    <ThemedText style={styles.menuOptionText}>Temperature</ThemedText>
                  </View>
                  <View style={styles.weather}>
                    <ThemedIcons library='MaterialDesignIcons' name='cloud' size={20} color='#6B8BA4'/>
                    <ThemedText type='defaultSemiBold' style={{marginTop: 3}}>
                      {weatherData ? `${weatherData.precipitation}mm` : '0mm'}
                    </ThemedText>
                    <ThemedText style={styles.menuOptionText}>Precipitation</ThemedText>
                  </View>
                  <View style={styles.weather}>
                    <ThemedIcons library='MaterialDesignIcons' name='water' size={20} color='#5A7D9A'/>
                    <ThemedText type='defaultSemiBold' style={{marginTop: 3}}>
                      {weatherData ? `${weatherData.humidity}%` : '0%'}
                    </ThemedText>
                    <ThemedText style={styles.menuOptionText}>Air Humidity</ThemedText>
                  </View>
                </View>
              </ThemedView>

              {/* Alerts Section */}
              {alerts.length > 0 && (
                <View style={styles.alertsSection}>
                  <View style={styles.alertsHeader}>
                    <ThemedText type="subtitle">Local Alerts</ThemedText>
                    <ThemedText style={styles.alertCount}>{alerts.length} alert{alerts.length !== 1 ? 's' : ''}</ThemedText>
                  </View>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.alertsScrollContainer}
                  >
                    {alerts.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onPress={handleAlertPress}
                      />
                    ))}
                  </ScrollView>
                </View>
              )}

              <WeeklyCalendar
                events={calendarEvents}
              />
            </>
          )}
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
    height: 300,
    overflow: 'hidden',
    backgroundColor: 'blue',
  },
  taraImage: {
    position: 'absolute',
    bottom: -80,
    right: -30,
    width: 160,
    height: 250,
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
    padding: 20,
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
    width: '20%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  locationContent: {
    width: '100%',
    padding: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15
  },
  redirectToTara: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    marginBottom: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  headerButtons:{
    padding: 10,
    width: 50,
    height: 50,
    justifyContent: 'center', 
    alignItems: 'center',
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  alertsSection: {
    marginVertical: 20,
  },
  alertsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  alertsScrollContainer: {
    paddingLeft: 0,
    paddingRight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 40,
  },
  weather:{
    justifyContent: 'center',
    alignItems: 'center',
    width: '30%'
  },
  weatherImage: {
    position: 'absolute',
    right: 0,
    width: 150,
    height: 150,
    marginRight: -40,
    marginTop: -15,
  },
  distance:{
    fontSize: 20,
    textAlign: 'center',
  },
  menuOptionText:{
    fontSize: 12,
    marginTop: 5,
    opacity: 0.6,
  },
});