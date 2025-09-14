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
import ChatLoading from '@/components/ChatLoading';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

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
      
      if (!startLocation || !endLocation) {
        console.error('Missing location data for route creation');
        return;
      }

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

      // Create locations array matching routes-create.tsx format
      const locations = [
        {
          latitude: latitude,
          longitude: longitude,
          locationName: `${suburb || city || 'Current Location'}`
        },
        {
          latitude: 14.6091, // Destination default - should be geocoded from endLocation
          longitude: 121.0223,
          locationName: endLocation
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
              paddingHorizontal: 32,
            }}
          >
            <Image
              source={require('@/assets/images/slide1-img.png')}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                marginBottom: 10,
              }}
            />
            <ThemedText type="subtitle" style={{ marginBottom: 10 }}>
              Hello, I am Tara
            </ThemedText>
            <ThemedText style={{ textAlign: 'center', color: '#888' }}>
              Your personal travel companion. Ask me anything about travel—destinations, tips, weather, and more.
            </ThemedText>
            
            {/* Travel Suggestions */}
            <View style={{ marginTop: 20, width: '100%' }}>
              <ThemedText style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
                Try asking me:
              </ThemedText>
              <View style={{ gap: 8 }}>
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
              </View>
            </View>
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
                      onPress={() => router.push('/home/routes/routes')}
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
      <ThemedView color="primary" style={styles.inputRowAbsolute}>
        {hasMessagesLeft ? (
          <>
            <TextField
              value={input}
              onChangeText={setInput}
              placeholder="Type your message..."
              onSubmitEditing={handleSend}
              style={{ flex: 1, marginBottom: 0 }}
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
                color="#00FFDE"
              />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ height: 180 }}>
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
      </ThemedView>
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
  },
  inputRowAbsolute: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  sendBtn: {
    paddingVertical: 10,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 10,
    maxWidth: '100%',
    paddingHorizontal: 16,
  },
  suggestionButton: {
    backgroundColor: 'rgba(67, 0, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(67, 0, 255, 0.3)',
  },
  suggestionText: {
    color: '#4300FF',
    textAlign: 'center',
    fontSize: 14,
  },
});