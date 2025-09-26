import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { StyleSheet, Dimensions, View, ScrollView} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import BackButton from '@/components/custom/BackButton';
import SOSButton from '@/components/custom/SOSButton';

const {width, height} = Dimensions.get('window');
export default function SafetyScreen() {
  const primaryColor = useThemeColor({}, 'primary');

  return (
    <ScrollView>
      <ThemedView color='secondary' style={styles.container}>
        <BackButton type='floating'/>
        <View style={styles.titleContainer}>
          <ThemedText type='title'>
            Traveler Safety
          </ThemedText>
          <ThemedText>
            Emergency support, always within reach
          </ThemedText>
        </View>
        <ThemedView style={[styles.circle, {marginTop: height * .25 }]}>
          <ThemedView style={styles.circle}>
            <ThemedView style={[styles.circle, {padding: 0}]}>
              
            </ThemedView>
          </ThemedView>
        </ThemedView>

        <View style={styles.bottomContainer}>
          <SOSButton style={styles.sosButton}/>
          <LinearGradient
            colors={['transparent', primaryColor]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientOverlay}
            pointerEvents="none"
          />
          <ThemedView color='primary' style={{flex: 1, height: height * .5}}>
            <ThemedText>Emergency</ThemedText>
          </ThemedView>
        </View>
        
      </ThemedView>
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
  },
  titleContainer:{
    position: 'absolute',
    top: height * .1,
    left: 20,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle:{
    width: '100%',
    aspectRatio: 1,
    borderRadius: 500,
    padding: 50,
    opacity: .5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContainer:{
    flex: 1,
    position: 'absolute',
    width: '100%',
    marginTop: height * .4,

  },
  gradientOverlay: {
    width: '100%',
    height: 100
  },
  sosButton:{
    position: 'absolute',
    zIndex: 1000,
  },
});