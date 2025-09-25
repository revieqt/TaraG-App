import React from 'react';
import { TouchableOpacity, StyleSheet, View , Image} from 'react-native';
import { ThemedText } from '../ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';
import { AlertItem } from '@/context/AlertsContext';
import { ThemedView } from '../ThemedView';
import GradientHeader from '../GradientHeader';
import { LinearGradient } from 'expo-linear-gradient';

interface AlertCardProps {
  alert: AlertItem;
  onPress: (alert: AlertItem) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onPress }) => {
  const backgroundColor = useThemeColor({}, 'background');
  const severityColor = (() => {
    switch (alert.severity.toLowerCase()) {
      case 'high': return '#FF4444';
      case 'medium': return '#FF8800';
      case 'low': return '#44AA44';
      default: return '#888888';
    }
  })();

  const severityText = (() => {
    switch (alert.severity.toLowerCase()) {
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return 'Unknown';
    }
  })();

  return (
    <ThemedView
      style={styles.container}
    >
      <GradientHeader color={severityColor}/>
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={{paddingRight: 80}}>
            {alert.title}
          </ThemedText>
          <ThemedText>
            {alert.startOn ? new Date(alert.startOn).toDateString() : 'No start date'} - 
            {alert.endOn ? new Date(alert.endOn).toDateString() : 'No end date'}
          </ThemedText>
          <View style={styles.locationsContainer}>
            {alert.locations.map((location, index) => (
              <ThemedView shadow color='primary' key={index} style={styles.locationBox}>
                <ThemedText style={styles.locationBoxText}>
                  {location.charAt(0).toUpperCase() + location.slice(1).toLowerCase()}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          

        </View>

        <ThemedText style={{marginTop: 30}}>
          {alert.description}
        </ThemedText>
      </View>
      

      <View style={styles.overlay}>
        <View style={styles.gradientOverlay}>
          <LinearGradient
          colors={['transparent', backgroundColor]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
        <View style={{width: '100%', height: 50, position: 'absolute', bottom: -50, backgroundColor: backgroundColor}}/>
        </View>
        
        <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
      </View>
      
      <View style={styles.content}>
        

      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  header: {
    gap: 8
  },
  content: {
    padding: 20,
    zIndex: 1000,
    marginTop: 80
  },
  locationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8
  },
  locationBox: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
  },
  locationBoxText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationText: {
    marginTop: 30,
    marginBottom: 10,
    opacity: .5
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
  taraImage: {
    position: 'absolute',
    bottom: -95,
    right: -50,
    width: 170,
    height: 300,
    resizeMode: 'contain',
    zIndex: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 250,
    zIndex: 1,
  },
});
