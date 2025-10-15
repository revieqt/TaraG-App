import React from 'react';
import { TouchableOpacity, StyleSheet, View , Image, ScrollView} from 'react-native';
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
  return (
    <ThemedView
      style={styles.container}
    >
      <ThemedView color='secondary' style={[styles.header, {backgroundColor: severityColor}]}>
        <LinearGradient
          colors={['transparent', backgroundColor]}
          style={styles.titleContainer}
        >
          <ThemedText type="subtitle" style={{paddingRight: 80, color: '#fff'}}>
            {alert.title}
          </ThemedText>
          <ThemedText style={{color: '#fff'}}>
            {alert.startOn ? new Date(alert.startOn).toDateString() : 'No start date'}
            {alert.endOn && (' - ' + new Date(alert.endOn).toDateString())}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{marginRight: 80}}
          contentContainerStyle={styles.locationsContainer}>
            {alert.locations.map((location, index) => (
              <ThemedView shadow color='primary' key={index} style={styles.locationBox}>
                <ThemedText style={styles.locationBoxText}>
                  {location.charAt(0).toUpperCase() + location.slice(1).toLowerCase()}
                </ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </LinearGradient>

        <LinearGradient
          colors={[backgroundColor, backgroundColor, 'transparent']}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={styles.circle}
        >

          <LinearGradient
            colors={[backgroundColor, backgroundColor, 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.innerCirlce}
          />
        </LinearGradient>

        <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
      </ThemedView>

      <LinearGradient
        colors={['transparent',backgroundColor, backgroundColor]}
        style={styles.overlay}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.descriptionContainer}>
        <ThemedText>
          {alert.description}
        </ThemedText>
      </ScrollView>
      {/* <GradientHeader color={severityColor}/> */}
      {/* <View style={styles.header}>
        <View style={styles.titleContainer}>
          <ThemedText type="subtitle" style={{paddingRight: 80}}>
            {alert.title}
          </ThemedText>
          <ThemedText>
            {alert.startOn ? new Date(alert.startOn).toDateString() : 'No start date'}
            {alert.endOn && (' - ' + new Date(alert.endOn).toDateString())}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{marginRight: 80}}
          contentContainerStyle={styles.locationsContainer}>
            {alert.locations.map((location, index) => (
              <ThemedView shadow color='primary' key={index} style={styles.locationBox}>
                <ThemedText style={styles.locationBoxText}>
                  {location.charAt(0).toUpperCase() + location.slice(1).toLowerCase()}
                </ThemedText>
              </ThemedView>
            ))}
          </ScrollView>
        </View>

        <Image source={require('@/assets/images/tara-worried.png')} style={styles.taraImage} />
      </View>
      <ThemedView color='primary' shadow style={styles.descriptionContainer}>
        
      </ThemedView> */}
      {/* <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
          <ThemedText type="subtitle" style={{paddingRight: 80}}>
            {alert.title}
          </ThemedText>
          <ThemedText>
            {alert.startOn ? new Date(alert.startOn).toDateString() : 'No start date'}
            {alert.endOn && (' - ' + new Date(alert.endOn).toDateString())}
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.locationsContainer}>
            {alert.locations.map((location, index) => (
              <ThemedView shadow color='primary' key={index} style={styles.locationBox}>
                <ThemedText style={styles.locationBoxText}>
                  {location.charAt(0).toUpperCase() + location.slice(1).toLowerCase()}
                </ThemedText>
              </ThemedView>
            ))}

            <ThemedView shadow color='primary' style={styles.locationBox}>
                <ThemedText style={styles.locationBoxText}>
                  test
                </ThemedText>
              </ThemedView>
          </ScrollView>

        <ThemedText style={{marginTop: 30, paddingBottom: 120}}>
          {alert.description}
        </ThemedText>
      </ScrollView>
      

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
      </View> */}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden'
  },
  header: {
    width: '100%',
    height: 220,
  },
  titleContainer:{
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  descriptionContainer: {
    padding: 16,
    flex: 1,
    zIndex: 100
  },
  locationsContainer: {
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 35,
    marginTop: 10
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
  circle: {
    position: 'absolute',
    top: 10,
    right: '-50%',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 1000,
    overflow: 'hidden',
    opacity: .4,
    padding: 30,
  },
  innerCirlce:{
    flex: 1,
    borderRadius: 1000,
    overflow: 'hidden',
    opacity: .5,
    padding: 30,
  },
  taraImage: {
    position: 'absolute',
    bottom: -110,
    right: -30,
    width: '35%',
    height: 300,
    resizeMode: 'contain',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 180,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 2
  },
});
