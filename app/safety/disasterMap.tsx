import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import RiskMapModal from '@/components/modals/RiskMapModal';
import FadedHeader from '@/components/custom/FadedHeader';

type MapType = "flood" | "landslide" | "storm_surge";
type WeatherLayer = 'clouds' | 'temp' | 'precipitation' | 'wind' | 'pressure';

export default function DisasterMapSection(){
  const [mapType, setMapType] = useState<MapType | null>(null);
  const iconColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={{flex: 1}}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <FadedHeader 
         title='Disaster Maps' 
         subtitle='View hazard maps to understand risk levels' 
         iconName='alert-rhombus'
        />
        
        <View style={{padding: 16, marginTop: 20}}>
          <TouchableOpacity 
            onPress={() => router.push('/safety/disasterMap-weather')}
            activeOpacity={0.7}
          >
            <ThemedView color='primary' shadow style={styles.cardContainer}>
              <Image source={require('@/assets/images/disasterMap-weather.jpg')} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View>
                  <ThemedText type="subtitle" style={{fontSize: 15}}>Weather Map</ThemedText>
                  <ThemedText style={{opacity: .7}}>View real-time weather conditions and forecasts</ThemedText>
                </View>
                <ThemedIcons
                  library="MaterialIcons"
                  name="arrow-forward-ios"
                  size={16}
                  color={iconColor}
                />
              </View>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setMapType('flood')}
            activeOpacity={0.7}
          >
            <ThemedView color='primary' shadow style={styles.cardContainer}>
              <Image source={require('@/assets/images/disasterMap-weather.jpg')} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View>
                  <ThemedText type="subtitle" style={{fontSize: 15}}>Flood Hazard Map</ThemedText>
                  <ThemedText style={{opacity: .7}}>View flood-prone areas and risk levels</ThemedText>
                </View>
                <ThemedIcons
                  library="MaterialIcons"
                  name="arrow-forward-ios"
                  size={16}
                  color={iconColor}
                />
              </View>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setMapType('landslide')}
            activeOpacity={0.7}
          >
            <ThemedView color='primary' shadow style={styles.cardContainer}>
              <Image source={require('@/assets/images/disasterMap-weather.jpg')} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View>
                  <ThemedText type="subtitle" style={{fontSize: 15}}>Landslide Hazard Map</ThemedText>
                  <ThemedText style={{opacity: .7}}>View landslide-prone areas and risk levels</ThemedText>
                </View>
                <ThemedIcons
                  library="MaterialIcons"
                  name="arrow-forward-ios"
                  size={16}
                  color={iconColor}
                />
              </View>
            </ThemedView>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => setMapType('storm_surge')}
            activeOpacity={0.7}
          >
            <ThemedView color='primary' shadow style={styles.cardContainer}>
              <Image source={require('@/assets/images/disasterMap-weather.jpg')} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <View>
                  <ThemedText type="subtitle" style={{fontSize: 15}}>Storm Surge Map</ThemedText>
                  <ThemedText style={{opacity: .7}}>View storm surge risk areas</ThemedText>
                </View>
                <ThemedIcons
                  library="MaterialIcons"
                  name="arrow-forward-ios"
                  size={16}
                  color={iconColor}
                />
              </View>
            </ThemedView>
          </TouchableOpacity>
        </View>
        
      </ScrollView>
      

      <RiskMapModal
        visible={mapType !== null}
        onClose={() => setMapType(null)}
        mapType={mapType || "flood"}
        creditText="Base Map © OpenStreetMap contributors, Hazard Data © UP Resilience Institute – Project NOAH"
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  cardContainer:{
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  cardImage:{
    width: '100%',
    height: 150,
  },
  cardContent:{
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
});
