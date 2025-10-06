import RoundedButton from '@/components/RoundedButton';
import Header from '@/components/Header';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import LocationDisplay from '@/components/LocationDisplay';
import { router } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useSession } from '@/context/SessionContext';
import EndRouteModal from '@/components/modals/EndRouteModal';
import { useDistanceTracker } from '@/hooks/useDistanceTracker';
import { useRouteTimer } from '@/hooks/useTimer';
import EmptyMessage from '@/components/EmptyMessage';
import GradientHeader from '@/components/GradientHeader';
import OptionsPopup from '@/components/OptionsPopup';
import { 
  getRouteHistory, 
  deleteRouteFromHistory, 
  clearAllRouteHistory,
  formatDistance,
  formatTime,
  formatDate,
  formatRouteStops,
  formatMode,
  RouteHistoryItem 
} from '@/utils/routeHistory';

export default function RoutesScreen() {
  const { session, updateSession } = useSession();
  const distance = useDistanceTracker();
  const elapsed = useRouteTimer(session?.activeRoute !== undefined);
  const [showEndRouteModal, setShowEndRouteModal] = useState(false);
  const [completedRouteStops, setCompletedRouteStops] = useState<{ latitude: number; longitude: number; locationName: string }[]>([]);
  const [completedDistance, setCompletedDistance] = useState(0);
  const [completedTime, setCompletedTime] = useState(0);
  const [routeHistory, setRouteHistory] = useState<RouteHistoryItem[]>([]);

  // Load route history on component mount
  useEffect(() => {
    loadRouteHistory();
  }, []);

  // Refresh route history when modal is closed
  useEffect(() => {
    if (!showEndRouteModal) {
      loadRouteHistory();
    }
  }, [showEndRouteModal]);

  const loadRouteHistory = async () => {
    try {
      const history = await getRouteHistory();
      setRouteHistory(history);
    } catch (error) {
      console.error('Error loading route history:', error);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this route from history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRouteFromHistory(id);
              await loadRouteHistory(); // Refresh the list
            } catch (error) {
              console.error('Error deleting route:', error);
            }
          }
        }
      ]
    );
  };

  const handleClearAllHistory = async () => {
    Alert.alert(
      "Clear All History",
      "Are you sure you want to delete all route history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear All", 
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllRouteHistory();
              await loadRouteHistory(); // Refresh the list
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          }
        }
      ]
    );
  };

  const handleRedoRoute = async (historyItem: RouteHistoryItem) => {
    try {
      // Create a new ActiveRoute from the history item
      const newActiveRoute = {
        ...historyItem.activeRoute,
        routeID: Date.now().toString(), // Generate new route ID
        createdOn: new Date(), // Update creation time
        status: 'active' // Set status to active
      };

      await updateSession({ activeRoute: newActiveRoute });
      router.push('/(tabs)/maps');
    } catch (error) {
      console.error('Error redoing route:', error);
      Alert.alert(
        "Error", 
        "Failed to restore route. Please try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  const handleAddRoute = () => {
    if (session?.activeRoute) {
      Alert.alert(
        "Active Route Detected",
        "You must end the active route before creating a new one.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    router.push('/routes/routes-create');
  };

  const handleEndRoute = async () => {
    Alert.alert(
      "End Route",
      "Are you sure you want to end the current route?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "End Route", 
          style: "destructive",
          onPress: async () => {
            try {
              // Capture route data before clearing active route
              if (session?.activeRoute?.location) {
                setCompletedRouteStops(session.activeRoute.location);
              }
              
              // Capture current distance and time
              setCompletedDistance(distance);
              setCompletedTime(elapsed);
              
              // Show end route modal
              setShowEndRouteModal(true);
              
              await updateSession({ activeRoute: undefined });
              console.log('Route ended successfully');
            } catch (error) {
              console.error('Error ending route:', error);
            }
          }
        }
      ]
    );
  };

  const handleGoToMaps = () => {
    router.push('/(tabs)/maps');
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <Header 
        label="Routes"
        rightButton={
          <OptionsPopup options={[
            <TouchableOpacity onPress={handleClearAllHistory} style={{flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <ThemedIcons library="MaterialIcons" name="delete" size={20}/>
              <ThemedText>Clear History</ThemedText>
            </TouchableOpacity>
          ]}> 
            <ThemedIcons library="MaterialCommunityIcons" name="dots-vertical" size={22} />
          </OptionsPopup>
        }
      />

      <View style={{zIndex: 100, flex: 1}}>
        <ScrollView style={{zIndex: 100, padding: 16, gap: 16}}>
          {!session?.activeRoute ? (
            <ThemedView color='primary' shadow style={styles.emptyActiveRoute}>
              <EmptyMessage
                iconLibrary="MaterialDesignIcons"
                iconName="map-search"
                title="No Active Route"
                description="Start a new route to begin tracking your journey."
                buttonLabel="Create a Route"
                buttonAction={handleAddRoute}
              />
            </ThemedView>
            
          ) : (
            <ThemedView color='primary' shadow style={styles.activeRoute}>
              <LocationDisplay 
                content={session.activeRoute.location.map((loc, index) => (
                  <View key={index}>
                    <ThemedText>
                      {loc.locationName}
                    </ThemedText>
                    <ThemedText style={{opacity: .5}}>
                      {index === 0 ? 'Start' : 
                      index === session.activeRoute!.location.length - 1 ? 'Destination' : 
                      `Waypoint ${index}`}
                    </ThemedText>
                    
                  </View>
                ))}
              />
              {session.activeRoute.routeData && (
                <View style={styles.routeSummary}>
                  <View style={styles.routeStats}>
                    <View style={styles.statItem}>
                      <ThemedIcons library="MaterialIcons" name="schedule" size={20} color="#666" />
                        <ThemedText style={{opacity: 0.7, marginTop: 5}}>Duration</ThemedText>
                        <ThemedText type="defaultSemiBold">
                          {Math.round(session.activeRoute.routeData.duration / 60)} min
                        </ThemedText>
                    </View>
                    
                    <View style={styles.statItem}>
                      <ThemedIcons library="MaterialIcons" name="straighten" size={20} color="#666" />
                        <ThemedText style={{opacity: 0.7, marginTop: 5}}>Distance</ThemedText>
                        <ThemedText type="defaultSemiBold">
                          {(session.activeRoute.routeData.distance / 1000).toFixed(2)} km
                        </ThemedText>
                    </View>
                    
                    <View style={styles.statItem}>
                      <ThemedIcons library="MaterialCommunityIcons" name="elevation-rise" size={20} color="#666" />
                        <ThemedText style={{opacity: 0.7, marginTop: 5}}>Elevation</ThemedText>
                        <ThemedText type="defaultSemiBold">
                          {session.activeRoute.routeData.geometry.coordinates.some(coord => coord[2] !== undefined) 
                            ? `${Math.round(Math.max(...session.activeRoute.routeData.geometry.coordinates.map(coord => coord[2] || 0)) - Math.min(...session.activeRoute.routeData.geometry.coordinates.map(coord => coord[2] || 0)))}m gain`
                            : 'N/A'
                          }
                        </ThemedText>
                    </View>
                  </View>
                </View>
              )}
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, {borderColor: '#ccc', borderWidth: 1}]} 
                  onPress={handleGoToMaps}
                >
                  <ThemedIcons library="MaterialIcons" name="map" size={20}/>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, {backgroundColor: '#dc3545',}]} 
                  onPress={handleEndRoute}
                >
                  <ThemedIcons library="MaterialIcons" name="stop" size={20} color="#fff"/>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}
          {/* Route History Display */}
          {routeHistory.length > 0 ? (
            routeHistory.map((historyItem) => (
              <ThemedView key={historyItem.id} color='primary' shadow style={styles.historyItem}>
                <View style={styles.historyContent}>
                  <View>
                    <ThemedText type="defaultSemiBold" style={{marginBottom: 4}}>
                      {formatRouteStops(historyItem.activeRoute.location)}
                    </ThemedText>

                    <ThemedText style={styles.routeDate}>
                      {formatDate(historyItem.date)} • {formatMode(historyItem.activeRoute.mode)}
                    </ThemedText>

                    <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8}}>
                      <View style={styles.historyStat}>
                        <ThemedIcons library="MaterialIcons" name="straighten" size={16} color="#666" />
                        <ThemedText style={styles.statText}>
                          {formatDistance(historyItem.distance)} km
                        </ThemedText>
                      </View>
                      
                      <View style={styles.historyStat}>
                        <ThemedIcons library="MaterialIcons" name="schedule" size={16} color="#666" />
                        <ThemedText style={styles.statText}>
                          {formatTime(historyItem.time)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.historyButtons}>

                    {!session?.activeRoute && (
                      <TouchableOpacity 
                        style={[styles.button, {borderColor: '#ccc', borderWidth: 1}]} 
                        onPress={() => handleRedoRoute(historyItem)}
                      >
                        <ThemedIcons library="MaterialIcons" name="replay" size={20}/>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity 
                      style={[styles.button, {backgroundColor: '#dc3545',}]} 
                      onPress={() => handleDeleteRoute(historyItem.id)}
                    >
                      <ThemedIcons library="MaterialIcons" name="delete" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </ThemedView>
            ))
          ) : (
            <EmptyMessage
              title="No Route History"
              description="Complete a route to see your history here."
            />
          )}
        </ScrollView>
      </View>
      
      
      {!session?.activeRoute && (
        <RoundedButton
          size={60}
          iconName="add"
          iconColor="#fff"
          onPress={handleAddRoute}
          style={{position: 'absolute', bottom: 20, right: 20}}
        />
      )}
      
      <EndRouteModal
        visible={showEndRouteModal}
        onClose={() => setShowEndRouteModal(false)}
        distance={completedDistance}
        timeElapsed={completedTime}
        routeStops={completedRouteStops}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  emptyActiveRoute: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  activeRoute: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 30,
  },
  routeSummary: {
    marginVertical: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#ccc4',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    marginTop: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  historyTitle: {
    margin: 16,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc4',
    opacity: .7
  },
  historyItem: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  historyStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.5,
  },
  historyButtons: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    right: 0,
    gap: 8,
  },
});