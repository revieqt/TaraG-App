import Button from '@/components/Button';
import Header from '@/components/Header';
import OptionsPopup from '@/components/OptionsPopup';
import TextField from '@/components/TextField';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MAX_FREE_MESSAGES_PER_DAY } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';
import { useAIChat } from '@/hooks/useAIChat';
import { useLocation } from '@/hooks/useLocation';
import { createRoute, getRoutes } from '@/services/routeApiService';
import { saveItinerary } from '@/services/itinerariesApiService';
import { geocodeLocation } from '@/utils/geocoding';
import { getWeatherForCurrentLocation, getWeatherForLocation, formatWeatherForChat } from '@/utils/weatherCache';
import ChatLoading from '@/components/ChatLoading';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import {AutoScrollView} from '@/components/AutoScrollView';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';

function getTodayKey() {
  const today = new Date();
  return `aiChatCount_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
}

export default function AIChatScreen() {
  const { messages, loading, error, sendMessage, resetChat, suggestions, pendingAction, setPendingAction } = useAIChat();
  const [input, setInput] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const { session, updateSession } = useSession();
  const { latitude, longitude, city, suburb, loading: locationLoading, error: locationError } = useLocation();
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const accentColor = useThemeColor({}, 'accent');
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      const key = getTodayKey();
      const stored = await AsyncStorage.getItem(key);
      setMessageCount(stored ? parseInt(stored, 10) : 0);
    };
    loadCount();
  }, []);

  useEffect(() => {
    const saveCount = async () => {
      const key = getTodayKey();
      await AsyncStorage.setItem(key, messageCount.toString());
    };
    saveCount();
  }, [messageCount]);

  const isProUser = !!session?.user?.isProUser;
  const hasMessagesLeft = isProUser || messageCount < MAX_FREE_MESSAGES_PER_DAY;

  const handleSend = () => {
    if (!input.trim()) return;

    if (!isProUser) {
      if (messageCount >= MAX_FREE_MESSAGES_PER_DAY) {
        return;
      }
      setMessageCount((prev) => prev + 1);
    }

    sendMessage(input.trim(), {
      userID: session?.user?.id,
      hasActiveRoute: !!session?.activeRoute
    });
    setInput('');
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleConfirmItinerary = async () => {
    if (!pendingAction || !session?.accessToken || !session?.user?.id) return;
    
    try {
      const { destination, duration, preferences, title, description, type, startDate, endDate, planDaily } = pendingAction.data || {};
      
      // Create itinerary structure with required fields
      const itinerary = {
        title: title || 'AI Generated Itinerary',
        description: description || 'Travel itinerary created by AI assistant',
        type: type || 'vacation',
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        planDaily: planDaily || [],
        userID: session.user.id,
        locations: [destination || 'Sample Destination']
      };

      // Save itinerary using existing service
      const saveResult = await saveItinerary(itinerary, session.accessToken);
      
      if (saveResult.success) {
        sendMessage('Itinerary created successfully! You can view it in your itineraries.', {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
      } else {
        console.error('Failed to save itinerary:', saveResult.errorMessage);
        sendMessage('Sorry, there was an issue creating your itinerary. Please try again.', {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
      }
    } catch (error) {
      console.error('Error creating itinerary:', error);
      sendMessage('Sorry, there was an issue creating your itinerary. Please try again.', {
        userID: session?.user?.id,
        hasActiveRoute: !!session?.activeRoute
      });
    }
    
    setPendingAction(null);
  };

  const handleConfirmRoute = async () => {
    if (!pendingAction || !session?.accessToken || !session?.user?.id) return;
    
    try {
      const { startLocation, endLocation, transportMode } = pendingAction.data || {};
      
      // Check if location is still loading - don't clear pending action, let user retry
      if (locationLoading) {
        sendMessage('I\'m still getting your location. Please wait a moment and try the "Yes, Create Route" button again.', {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
        return;
      }

      // Check if we have user's current location
      if (!latitude || !longitude) {
        console.error('Missing user location data for route creation. Coords:', latitude, longitude, 'Error:', locationError);
        
        let errorMessage = 'I need to get your current location first to create a route.';
        if (locationError) {
          errorMessage += ' It looks like there was an issue accessing your location. Please check your location permissions and try again.';
        } else {
          errorMessage += ' Please make sure location services are enabled and try again.';
        }
        
        // Show user-friendly message
        sendMessage(errorMessage, {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
        setPendingAction(null);
        return;
      }

      // Handle single location input (user only provided destination)
      // Use current location as start point
      let startLat = latitude;
      let startLon = longitude;
      let startName = `${suburb || city || 'Current Location'}`;
      let endLat: number;
      let endLon: number;
      let endName: string;

      // If only endLocation is provided (single location input)
      if (endLocation && !startLocation) {
        // Use current location as start
        console.log('Single location input detected. Using current location as start:', startName);
        
        // Geocode the destination
        const geocodedDestination = await geocodeLocation(endLocation);
        
        if (!geocodedDestination) {
          sendMessage(`Sorry, I couldn\'t find the location "${endLocation}". Please try again with a more specific address.`, {
            userID: session?.user?.id,
            hasActiveRoute: !!session?.activeRoute
          });
          setPendingAction(null);
          return;
        }

        endLat = geocodedDestination.latitude;
        endLon = geocodedDestination.longitude;
        endName = geocodedDestination.locationName;
      }
      // If both locations are provided
      else if (startLocation && endLocation) {
        // Geocode start location
        const geocodedStart = await geocodeLocation(startLocation);
        if (!geocodedStart) {
          sendMessage(`Sorry, I couldn\'t find the start location "${startLocation}". Please try again.`, {
            userID: session?.user?.id,
            hasActiveRoute: !!session?.activeRoute
          });
          setPendingAction(null);
          return;
        }

        // Geocode end location
        const geocodedEnd = await geocodeLocation(endLocation);
        if (!geocodedEnd) {
          sendMessage(`Sorry, I couldn\'t find the destination "${endLocation}". Please try again.`, {
            userID: session?.user?.id,
            hasActiveRoute: !!session?.activeRoute
          });
          setPendingAction(null);
          return;
        }

        startLat = geocodedStart.latitude;
        startLon = geocodedStart.longitude;
        startName = geocodedStart.locationName;
        endLat = geocodedEnd.latitude;
        endLon = geocodedEnd.longitude;
        endName = geocodedEnd.locationName;
      }
      // Missing location data
      else {
        console.error('Missing location data for route creation');
        sendMessage('Sorry, I need at least a destination to create a route.', {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
        setPendingAction(null);
        return;
      }

      // Create locations array matching routes-create.tsx format
      const locations = [
        {
          latitude: startLat,
          longitude: startLon,
          locationName: startName
        },
        {
          latitude: endLat,
          longitude: endLon,
          locationName: endName
        }
      ];

      // Get route data first using getRoutes (matching routes-create.tsx)
      const routeData = await getRoutes({
        location: locations.map(loc => ({ latitude: loc.latitude, longitude: loc.longitude })),
        mode: transportMode || 'driving-car'
      });

      if (!routeData) {
        console.error('Failed to generate route data');
        sendMessage('Sorry, I couldn\'t generate the route. Please try again.', {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
        setPendingAction(null);
        return;
      }

      // Create active route object matching routes-create.tsx format
      const activeRoute = {
        routeID: `route_${Date.now()}`,
        userID: session.user.id,
        location: locations,
        mode: transportMode || 'driving-car',
        status: 'active',
        createdOn: new Date(),
        routeData: routeData
      };

      // Save to SessionContext
      await updateSession({ activeRoute });
      
      // Send confirmation message
      sendMessage('Route created successfully! You can now view it in the Maps tab.', {
        userID: session?.user?.id,
        hasActiveRoute: true
      });
    } catch (error) {
      console.error('Error creating route:', error);
    }
    
    setPendingAction(null);
  };

  const handleDeclineAction = () => {
    sendMessage('No, thank you', {
      userID: session?.user?.id,
      hasActiveRoute: !!session?.activeRoute
    });
    setPendingAction(null);
  };

  const handleWeatherRequest = async () => {
    if (!pendingAction) return;
    
    try {
      const { location, date } = pendingAction.data || {};
      
      let result;
      let locationName;
      
      // If no specific location provided, use current location
      if (!location || location.toLowerCase() === 'current' || location.toLowerCase() === 'here') {
        // Check if we have current location
        if (!latitude || !longitude) {
          sendMessage('I need your current location to check the weather. Please make sure location services are enabled.', {
            userID: session?.user?.id,
            hasActiveRoute: !!session?.activeRoute
          });
          setPendingAction(null);
          return;
        }
        
        locationName = `${suburb || city || 'your location'}`;
        result = await getWeatherForCurrentLocation(latitude, longitude, date);
      } else {
        // Fetch weather for specified location
        locationName = location;
        result = await getWeatherForLocation(location, date);
      }
      
      if (result.success && result.data) {
        const weatherMessage = formatWeatherForChat(result.data, locationName);
        const cacheNote = result.fromCache ? ' (from cache)' : '';
        
        sendMessage(weatherMessage + cacheNote, {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
      } else {
        sendMessage(result.error || 'Sorry, I couldn\'t get the weather information.', {
          userID: session?.user?.id,
          hasActiveRoute: !!session?.activeRoute
        });
      }
    } catch (error) {
      console.error('Error getting weather:', error);
      sendMessage('Sorry, there was an error getting the weather information.', {
        userID: session?.user?.id,
        hasActiveRoute: !!session?.activeRoute
      });
    }
    
    setPendingAction(null);
  };

  useEffect(() => {
    if (
      ttsEnabled &&
      messages.length > 0 &&
      messages[messages.length - 1].role === 'assistant'
    ) {
      Speech.speak(messages[messages.length - 1].content, { language: 'en' });
    }
  }, [messages, ttsEnabled]);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const showIntro = messages.length === 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <Header
        label="TaraAI"
        rightButton={[
          <OptionsPopup
            key="options"
            options={[
              <TouchableOpacity
                key="tts"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 5 }}
                onPress={() => setTtsEnabled((prev) => !prev)}
              >
                <MaterialIcons
                  name="record-voice-over"
                  size={20}
                  color="#222"
                />
                <ThemedText>
                  {ttsEnabled ? 'Disable Text-to-Speech' : 'Enable Text-to-Speech'}
                </ThemedText>
              </TouchableOpacity>,
              <TouchableOpacity
                key="reset"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 5 }}
                onPress={resetChat}
              >
                <MaterialIcons
                  name="refresh"
                  size={20}
                  color="#222"
                />
                <ThemedText>Reset Chat</ThemedText>
              </TouchableOpacity>,
            ]}
          >
            <ThemedIcons
              library="MaterialCommunityIcons"
              name="dots-vertical"
              size={24}
            />
          </OptionsPopup>,
        ]}
      />
      <ThemedView style={{ flex: 1, padding: 0 }}>
        {showIntro ? (
          <ThemedView
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 16,
            }}
          >
            <Image
              source={require('@/assets/images/slide1-img.png')}
              style={{
                width: 60,
                height: 60,
                marginBottom: 10,
              }}
            />
            <ThemedText type="subtitle" style={{ marginBottom: 10 }}>
              Hello, I am Tara
            </ThemedText>
            <ThemedText style={{ textAlign: 'center', opacity: 0.5 }}>
              Your personal travel companion. Ask me anything about travel—destinations, tips, weather, and more.
            </ThemedText>
            
            {/* Travel Suggestions */}
            <AutoScrollView horizontal speed={10000} style={styles.suggestionContainer}>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress("Plan a 3-day itinerary for Cebu")}
              >
                <ThemedText style={styles.suggestionText}>Plan a 3-day itinerary for Cebu</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress("Create a route from Manila to Baguio")}
              >
                <ThemedText style={styles.suggestionText}>Create a route from Manila to Baguio</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress("What are the best beaches in Palawan?")}
              >
                <ThemedText style={styles.suggestionText}>What are the best beaches in Palawan?</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress("Best local food in Iloilo")}
              >
                <ThemedText style={styles.suggestionText}>Best local food in Iloilo</ThemedText>
              </TouchableOpacity>
            </AutoScrollView>
          </ThemedView>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(_, idx) => idx.toString()}
            contentContainerStyle={[styles.messagesContainer, { paddingBottom: 70 }]}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.messageRow,
                  item.role === 'assistant'
                    ? {justifyContent: 'flex-start'}
                    : {justifyContent: 'flex-end', alignSelf: 'flex-end'},
                ]}
              >
                {item.role === 'assistant' && (
                  <Image
                    source={require('@/assets/images/slide1-img.png')}
                    style={styles.taraProfile}
                  />
                )}
                <ThemedView
                  color={item.role === 'assistant' ? 'primary' : 'secondary'}
                  shadow
                  style={[
                    styles.messageBubble,
                    item.role === 'user'
                      ? {alignSelf: 'flex-end', borderBottomRightRadius: 5}
                      : {alignSelf: 'flex-start', borderBottomLeftRadius: 5},
                  ]}
                >
                  <ThemedText
                    style={
                      item.role === 'user'
                        ? {color: '#fff'}
                        : null
                    }
                  >
                    {item.content}
                  </ThemedText>
                  {item.showGoToRoutes && (
                    <TouchableOpacity
                      style={{
                        marginTop: 8,
                        backgroundColor: '#4300FF',
                        borderRadius: 8,
                        paddingVertical: 6,
                        paddingHorizontal: 14,
                        alignSelf: 'flex-start',
                      }}
                      onPress={() => router.push('/routes/routes')}
                    >
                      <ThemedText
                        style={{ color: '#fff', fontWeight: 'bold' }}
                      >
                        Go to Routes
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                  {item.actionRequired && (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      {item.actionRequired.type === 'confirm_itinerary' && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#00FFDE',
                              borderRadius: 8,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              flex: 1,
                            }}
                            onPress={handleConfirmItinerary}
                          >
                            <ThemedText style={{ color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
                              Yes, Create Itinerary
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#666',
                              borderRadius: 8,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              flex: 1,
                            }}
                            onPress={handleDeclineAction}
                          >
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                              No Thanks
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      )}
                      {item.actionRequired.type === 'confirm_route' && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#00FFDE',
                              borderRadius: 8,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              flex: 1,
                            }}
                            onPress={handleConfirmRoute}
                          >
                            <ThemedText style={{ color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
                              Yes, Create Route
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#666',
                              borderRadius: 8,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              flex: 1,
                            }}
                            onPress={handleDeclineAction}
                          >
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                              No Thanks
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      )}
                      {item.actionRequired.type === 'confirm_weather' && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#00FFDE',
                              borderRadius: 8,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              flex: 1,
                            }}
                            onPress={handleWeatherRequest}
                          >
                            <ThemedText style={{ color: '#000', fontWeight: 'bold', textAlign: 'center' }}>
                              Yes, Show Weather
                            </ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={{
                              backgroundColor: '#666',
                              borderRadius: 8,
                              paddingVertical: 8,
                              paddingHorizontal: 16,
                              flex: 1,
                            }}
                            onPress={handleDeclineAction}
                          >
                            <ThemedText style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                              No Thanks
                            </ThemedText>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </ThemedView>
              </View>
            )}
          />
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <Image
              source={require('@/assets/images/slide1-img.png')}
              style={styles.taraProfile}
            />
            <View style={[styles.messageBubble, { backgroundColor: '#f0f0f0', alignSelf: 'flex-start', borderBottomLeftRadius: 5 }]}>
              <ChatLoading />
            </View>
          </View>
        )}
      </ThemedView>

      <LinearGradient
        colors={['transparent',primaryColor,primaryColor]}
        style={styles.inputRowAbsolute}
      >
        {hasMessagesLeft ? (
          <>
            <TextInput
              style={[
              styles.input,
              { 
                  backgroundColor: backgroundColor,
                  color: textColor,
              }
              ]}
              placeholder="Type a message..."
              placeholderTextColor={textColor}
              
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={handleSend}
              disabled={loading || !input.trim()}
            >
              <ThemedIcons 
                library="MaterialIcons" 
                name="send" 
                size={30} 
                color={input.trim() ? accentColor : '#ccc9'} 
                />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ height: 250, paddingTop: 80 }}>
            <ThemedText style={{ textAlign: 'center', flex: 1 }}>
              You have reached the free daily credits for messages to Tara today. Upgrade to Pro for unlimited access or come back tomorrow.
            </ThemedText>
            <Button
              title="Upgrade to Pro"
              onPress={() => []}
              type="primary"
            />
            <Button
              title="Watch Ad for Additional Messages"
              onPress={() => []}
              buttonStyle={{ marginTop: 10 }}
            />
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  messagesContainer: {
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 10,
    maxWidth: '100%',
  },
  taraProfile: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    padding: 12,
    borderColor: '#ccc3',
    borderWidth: 1,
  },
  inputRowAbsolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
  },
  sendBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 14,
    marginRight: 14,
    textAlignVertical: 'top',
    fontFamily: 'Poppins',
    borderWidth: 1,
    borderColor: '#ccc4'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 10,
    maxWidth: '100%',
    paddingHorizontal: 16,
  },
  suggestionContainer: {
    maxHeight: 100
  },
  suggestionButton: {
    backgroundColor: '#00CAFF',
    borderRadius: 50,
    paddingVertical: 7,
    paddingHorizontal: 14,
    opacity: 0.8,
  },
  suggestionText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 13,
  },
});