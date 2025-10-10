import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from "react-native";
import { router } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import { useThemeColor } from '@/hooks/useThemeColor';
import RiskMapModal from '@/components/modals/RiskMapModal';
import GradientHeader from "@/components/GradientHeader";

type MapType = "flood" | "landslide" | "storm_surge";
type WeatherLayer = 'clouds' | 'temp' | 'precipitation' | 'wind' | 'pressure';

export default function DisasterMapSection(){
  const [mapType, setMapType] = useState<MapType | null>(null);
  const accentColor = useThemeColor({}, 'accent');
  const primaryColor = useThemeColor({}, 'primary');
  const iconColor = useThemeColor({}, 'icon');

  const mapOptions = [
    {
      type: 'flood' as MapType,
      title: 'Flood Hazard Map',
      description: 'View flood-prone areas and risk levels',
      icon: 'water',
      color: '#4A90E2'
    },
    {
      type: 'landslide' as MapType,
      title: 'Landslide Hazard Map',
      description: 'View landslide-prone areas and risk levels',
      icon: 'landslide',
      color: '#D4A574'
    },
    {
      type: 'storm_surge' as MapType,
      title: 'Storm Surge Map',
      description: 'View storm surge risk areas',
      icon: 'weather-hurricane',
      color: '#7B68EE'
    }
  ];

  const weatherOptions = [
    {
      layer: 'clouds' as WeatherLayer,
      title: 'Cloud Coverage',
      description: 'View current cloud formations',
      icon: 'weather-cloudy',
      color: '#9E9E9E'
    },
    {
      layer: 'temp' as WeatherLayer,
      title: 'Temperature Map',
      description: 'View temperature distribution',
      icon: 'thermometer',
      color: '#FF5722'
    },
    {
      layer: 'precipitation' as WeatherLayer,
      title: 'Precipitation Map',
      description: 'View rainfall and precipitation',
      icon: 'weather-rainy',
      color: '#2196F3'
    },
    {
      layer: 'wind' as WeatherLayer,
      title: 'Wind Patterns',
      description: 'View wind speed and direction',
      icon: 'weather-windy',
      color: '#4CAF50'
    },
    {
      layer: 'pressure' as WeatherLayer,
      title: 'Atmospheric Pressure',
      description: 'View pressure systems',
      icon: 'gauge',
      color: '#9C27B0'
    }
  ];

  return (
    <ThemedView style={{flex: 1}}>
      <GradientHeader/>
      <ScrollView showsVerticalScrollIndicator={false} style={{padding: 16, zIndex: 100, paddingTop: 40, paddingBottom: 80}}>
        <View style={styles.header}>
          <ThemedText type="title">Risk Maps</ThemedText>
          <ThemedText>
            View hazard maps to understand risk levels in different areas
          </ThemedText>
        </View>

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
      

        {/* <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Weather Maps</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            Choose a weather layer to view real-time conditions
          </ThemedText>
        </View>

        <View style={styles.weatherGrid}>
          {weatherOptions.map((option) => (
            <TouchableOpacity
              key={option.layer}
              style={[styles.weatherCard, { borderColor: option.color }]}
              onPress={() => handleWeatherMapPress(option.layer)}
              activeOpacity={0.7}
            >
              <View style={[styles.weatherIconContainer, { backgroundColor: option.color + '20' }]}>
                <ThemedIcons
                  library="MaterialCommunityIcons"
                  name={option.icon}
                  size={24}
                  color={option.color}
                />
              </View>
              <View style={styles.weatherCardContent}>
                <ThemedText type="defaultSemiBold" style={styles.weatherCardTitle}>
                  {option.title}
                </ThemedText>
                <ThemedText style={styles.weatherCardDescription}>
                  {option.description}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Hazard Maps</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            View natural disaster risk assessments
          </ThemedText>
        </View>

        <View style={styles.mapGrid}>
          {mapOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[styles.mapCard, { borderColor: option.color }]}
              onPress={() => setMapType(option.type)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: option.color + '20' }]}>
                <ThemedIcons
                  library="MaterialCommunityIcons"
                  name={option.icon}
                  size={32}
                  color={option.color}
                />
              </View>
              <View style={styles.cardContent}>
                <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
                  {option.title}
                </ThemedText>
                <ThemedText style={styles.cardDescription}>
                  {option.description}
                </ThemedText>
              </View>
              <View style={styles.arrowIcon}>
                <ThemedIcons
                  library="MaterialIcons"
                  name="arrow-forward-ios"
                  size={16}
                  color={iconColor}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View> */}
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
    marginBottom: 10,
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
  header: {
    marginBottom: 24,
    gap: 5
  },
  // sectionHeader: {
  //   marginBottom: 16,
  //   marginTop: 8,
  // },
  // sectionTitle: {
  //   marginBottom: 4,
  // },
  // sectionSubtitle: {
  //   opacity: 0.7,
  //   fontSize: 14,
  //   lineHeight: 18,
  // },
  // weatherGrid: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  //   gap: 12,
  //   marginBottom: 24,
  // },
  // weatherCard: {
  //   width: '48%',
  //   padding: 12,
  //   borderRadius: 12,
  //   borderWidth: 1,
  //   backgroundColor: 'transparent',
  // },
  // weatherIconContainer: {
  //   width: 40,
  //   height: 40,
  //   borderRadius: 20,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginBottom: 8,
  // },
  // weatherCardContent: {
  //   flex: 1,
  // },
  // weatherCardTitle: {
  //   fontSize: 13,
  //   marginBottom: 2,
  // },
  // weatherCardDescription: {
  //   fontSize: 11,
  //   opacity: 0.7,
  //   lineHeight: 14,
  // },
  // mapGrid: {
  //   gap: 16,
  // },
  // mapCard: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   padding: 16,
  //   borderRadius: 12,
  //   borderWidth: 1,
  //   backgroundColor: 'transparent',
  // },
  // iconContainer: {
  //   width: 56,
  //   height: 56,
  //   borderRadius: 28,
  //   alignItems: 'center',
  //   justifyContent: 'center',
  //   marginRight: 16,
  // },
});
