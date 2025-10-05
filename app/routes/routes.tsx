import RoundedButton from '@/components/RoundedButton';
import Header from '@/components/Header';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import LocationDisplay from '@/components/LocationDisplay';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { useSession } from '@/context/SessionContext';
import EndRouteModal from '@/components/modals/EndRouteModal';
import { useDistanceTracker } from '@/hooks/useDistanceTracker';
import { useRouteTimer } from '@/hooks/useTimer';

export default function RoutesScreen() {
  const { session, updateSession } = useSession();
  const distance = useDistanceTracker();
  const elapsed = useRouteTimer(session?.activeRoute !== undefined);
  const [showEndRouteModal, setShowEndRouteModal] = useState(false);
  const [completedRouteStops, setCompletedRouteStops] = useState<{ latitude: number; longitude: number; locationName: string }[]>([]);
  const [completedDistance, setCompletedDistance] = useState(0);
  const [completedTime, setCompletedTime] = useState(0);

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
      />
      
      <View style={{padding: 16}}>
        {(session?.activeRoute && (
          <ThemedView color='primary' shadow style={{padding: 16, borderRadius: 10}}>
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
                <ThemedIcons library="MaterialIcons" name="map" size={25}/>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, {backgroundColor: '#dc3545',}]} 
                onPress={handleEndRoute}
              >
                <ThemedIcons library="MaterialIcons" name="stop" size={25} color="#fff"/>
              </TouchableOpacity>
            </View>
          </ThemedView>
        ))}
      </View>

      <RoundedButton
        size={60}
        iconName="add"
        iconColor="#fff"
        onPress={handleAddRoute}
        style={{position: 'absolute', bottom: 20, right: 20}}
      />
      
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 30,
    gap: 8,
  },
  routeSummary: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
});