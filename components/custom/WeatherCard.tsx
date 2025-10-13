import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherImage } from '@/utils/weatherUtils';
import { BACKEND_URL } from '@/constants/Config';
import LoadingContainerAnimation from '../LoadingContainerAnimation';

interface WeatherCardProps {
  current?: boolean;
  latitude?: number;
  longitude?: number;
  date?: string;
}

interface LocationData {
  suburb?: string;
  city?: string;
  state?: string;
  country?: string;
}

export default function WeatherCard({ current, latitude, longitude, date }: WeatherCardProps) {
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const currentLocation = useLocation();
  
  const finalLatitude = current ? currentLocation.latitude : latitude;
  const finalLongitude = current ? currentLocation.longitude : longitude;
  
  const { weatherData, loading: weatherLoading, error: weatherError } = useWeather(
    finalLatitude || 0, 
    finalLongitude || 0, 
    date
  );

  useEffect(() => {
    const reverseGeocode = async () => {
      if (current || !latitude || !longitude) return;

      setLocationLoading(true);
      setLocationError(null);

      try {
        const response = await fetch(
          `${BACKEND_URL}/location/reverse-geocode?latitude=${latitude}&longitude=${longitude}`
        );

        if (!response.ok) {
          throw new Error('Failed to reverse geocode location');
        }

        const data = await response.json();
        setLocationData(data);
      } catch (error: any) {
        console.error('Reverse geocoding error:', error);
        setLocationError(error.message);
      } finally {
        setLocationLoading(false);
      }
    };

    reverseGeocode();
  }, [current, latitude, longitude]);

  const getLocationText = () => {
    if (current) {
      if (currentLocation.error) return 'Location unavailable';
      if (currentLocation.suburb && currentLocation.city) {
        return `${currentLocation.suburb}, ${currentLocation.city}`;
      }
      if (currentLocation.city) return currentLocation.city;
      if (currentLocation.suburb) return currentLocation.suburb;
      return 'Location unavailable';
    } else {
      if (locationError) return 'Location unavailable';
      if (locationData?.suburb && locationData?.city) {
        return `${locationData.suburb}, ${locationData.city}`;
      }
      if (locationData?.city) return locationData.city;
      if (locationData?.suburb) return locationData.suburb;
      return 'Unknown location';
    }
  };
  const shouldShowLoading = (!current && (!latitude || !longitude)) || 
                           (current && (!currentLocation.latitude || !currentLocation.longitude)) ||
                           weatherLoading || 
                           locationLoading ||
                           currentLocation.loading;

  if (shouldShowLoading) {
    return (
      <ThemedView shadow color='primary' style={[styles.locationContent, { height: 202 }]}>
        <View style={styles.descLoading}><LoadingContainerAnimation /></View>
        <View style={styles.locationLoading}><LoadingContainerAnimation /></View>
        <View style={styles.weatherTypeLoading}><LoadingContainerAnimation /></View>
        
        <View style={styles.weatherDetailsContainer}>
          <View style={styles.weather}>
            <View style={styles.weatherIconLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherValueLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherLabelLoading}><LoadingContainerAnimation /></View>
          </View>
          <View style={styles.weather}>
            <View style={styles.weatherIconLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherValueLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherLabelLoading}><LoadingContainerAnimation /></View>
          </View>
          <View style={styles.weather}>
            <View style={styles.weatherIconLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherValueLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherLabelLoading}><LoadingContainerAnimation /></View>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView shadow color='primary' style={styles.locationContent}>
      {weatherData && (
        <Image 
          source={getWeatherImage(weatherData.weatherCode)} 
          style={styles.weatherImage}
        />
      )}
      
      <ThemedText style={{ opacity: 0.5, fontSize: 12 }}>
        {current ? "You're currently at" : "Weather for"}
      </ThemedText>
      <ThemedText type='subtitle' style={{fontSize: 16}}>{getLocationText()}</ThemedText>
      
      {weatherData && (
        <ThemedText style={{ opacity: 0.7, fontSize: 12 }}>
          {weatherData.weatherType}
        </ThemedText>
      )}
      
      <View style={styles.weatherDetailsContainer}>
        <View style={styles.weather}>
          <ThemedIcons library='MaterialDesignIcons' name='thermometer' size={20} color='#B36B6B'/>
          <ThemedText type='defaultSemiBold' style={{marginTop: 5}}>
            {weatherData ? `${Math.round(weatherData.temperature)}°C` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Temperature</ThemedText>
        </View>
        <View style={styles.weather}>
          <ThemedIcons library='MaterialDesignIcons' name='cloud' size={20} color='#6B8BA4'/>
          <ThemedText type='defaultSemiBold' style={{marginTop: 5}}>
            {weatherData ? `${weatherData.precipitation}mm` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Precipitation</ThemedText>
        </View>
        <View style={styles.weather}>
          <ThemedIcons library='MaterialDesignIcons' name='water' size={20} color='#5A7D9A'/>
          <ThemedText type='defaultSemiBold' style={{marginTop: 5}}>
            {weatherData ? `${weatherData.humidity}%` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Air Humidity</ThemedText>
        </View>
      </View>
      
      {!weatherData && weatherError && (
        <ThemedText style={{ opacity: 0.5, marginTop: 10, textAlign: 'center', fontSize: 12 }}>
          Weather data not available
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  locationContent: {
    width: '100%',
    padding: 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  weatherDetailsContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
  },
  weather: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '30%',
  },
  weatherLabel: {
    fontSize: 12,
    opacity: 0.5,
  },
  weatherImage: {
    position: 'absolute',
    right: 0,
    width: 150,
    height: 150,
    marginRight: -50,
    marginTop: -17,
  },
  weatherTypeContainer: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  weatherValueLoading: {
    width: 50,
    height: 20,
    borderRadius: 100,
    marginVertical: 5,
    overflow: 'hidden',
  },
  weatherLabelLoading: {
    width: 70,
    height: 15,
    borderRadius: 100,
    marginVertical: 1,
    overflow: 'hidden',
  },
  weatherIconLoading: {
    width: 30,
    height: 20,
    borderRadius: 100,
    marginVertical: 1,
    overflow: 'hidden',
  },
  weatherTypeLoading: {
    width: 70,
    height: 15,
    borderRadius: 100,
    marginVertical: 5,
    overflow: 'hidden',
  },
  descLoading: {
    width: 70,
    height: 15,
    borderRadius: 100,
    marginBottom: 5,
    overflow: 'hidden',
  },
  locationLoading: {
    width: 200,
    height: 20,
    marginVertical:3,
    borderRadius: 100,
    overflow: 'hidden',
  },
});
