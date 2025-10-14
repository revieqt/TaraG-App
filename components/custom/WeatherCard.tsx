import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Image, TouchableOpacity, ScrollView, Dimensions, Animated } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ThemedIcons } from '@/components/ThemedIcons';
import { useLocation } from '@/hooks/useLocation';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherImage } from '@/utils/weatherUtils';
import { BACKEND_URL } from '@/constants/Config';
import LoadingContainerAnimation from '../LoadingContainerAnimation';
import Svg, { Polyline, Circle, Text as SvgText, Line } from 'react-native-svg';
import { useThemeColor } from '@/hooks/useThemeColor';

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
  const [chosenWeatherType, setChosenWeatherType] = useState<string | null>(null);
  const backgroundColor = useThemeColor({}, 'background');

  const currentLocation = useLocation();
  
  const finalLatitude = current ? currentLocation.latitude : latitude;
  const finalLongitude = current ? currentLocation.longitude : longitude;
  
  const { weatherData, loading: weatherLoading, error: weatherError } = useWeather(
    finalLatitude || 0, 
    finalLongitude || 0, 
    date
  );

  // Get current hour's weather data
  const getCurrentHourWeather = () => {
    if (!weatherData?.hourlyData) return null;
    
    // If a specific date was requested, just return the first hour of that date
    if (date) {
      return weatherData.hourlyData[0];
    }
    
    const currentHour = new Date().getHours();
    const today = new Date().toISOString().split('T')[0];
    
    // Find the data for the current hour
    const currentHourData = weatherData.hourlyData.find(item => {
      const itemDate = new Date(item.time);
      const itemHour = itemDate.getHours();
      const itemDay = item.time.split('T')[0];
      
      return itemDay === today && itemHour === currentHour;
    });
    
    // If no exact match, find the closest hour or get the first available
    if (!currentHourData) {
      // Find the closest hour to current time
      const now = new Date();
      let closestItem = weatherData.hourlyData[0];
      let closestDiff = Math.abs(new Date(closestItem.time).getTime() - now.getTime());
      
      for (const item of weatherData.hourlyData) {
        const diff = Math.abs(new Date(item.time).getTime() - now.getTime());
        if (diff < closestDiff) {
          closestDiff = diff;
          closestItem = item;
        }
      }
      
      return closestItem;
    }
    
    return currentHourData;
  };

  const currentHourWeather = getCurrentHourWeather();

  // Animation for container height expansion
  const containerHeight = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(0)).current;

  // Handle container animations when chosenWeatherType changes
  useEffect(() => {
    if (chosenWeatherType) {
      // Animate in - expand height and fade in
      Animated.parallel([
        Animated.timing(containerHeight, {
          toValue: 1,
          duration: 400,
          useNativeDriver: false, // Height animations can't use native driver
        }),
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      // Animate out - collapse height and fade out
      Animated.parallel([
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(containerHeight, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [chosenWeatherType]);

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
  const renderGraph = (type: string) => {
    if (!weatherData?.hourlyData) return null;

    let data: number[] = [];
    let unit = '';
    let color = '#5A7D9A';

    switch (type) {
      case 'temperature':
        data = weatherData.hourlyData.map(item => item.temperature);
        unit = '°C';
        color = '#B36B6B';
        break;
      case 'precipitation':
        data = weatherData.hourlyData.map(item => item.precipitation);
        unit = 'mm';
        color = '#5A7D9A';
        break;
      case 'humidity':
        data = weatherData.hourlyData.map(item => item.humidity);
        unit = '%';
        color = '#5A7D9A';
        break;
      case 'wind':
        data = weatherData.hourlyData.map(item => item.windSpeed);
        unit = 'km/h';
        color = '#5A7D9A';
        break;
    }

    if (data.length === 0) return null;

    const screenWidth = Dimensions.get('window').width - 60;
    const graphHeight = 150;
    const padding = 20; // Increased padding for labels
    const bottomPadding = 30; // Extra space for X-axis labels

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    // No animations for the graph itself - just display it

    // Calculate points for the line
    const points = data.map((value, index) => {
      const x = padding + (index * (screenWidth - 2 * padding)) / (data.length - 1);
      const y = graphHeight - bottomPadding - ((value - minValue) / range) * (graphHeight - padding - bottomPadding);
      return { x, y, value };
    });

    const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

    // Create labels for full 24-hour cycle: 12am, 6am, 12pm, 6pm, 12am
    const timeLabels: { label: string; x: number }[] = [];
    const labelData = [
      { label: '12am', hourIndex: 0 },
      { label: '6am', hourIndex: 6 },
      { label: '12pm', hourIndex: 12 },
      { label: '6pm', hourIndex: 18 },
      { label: '12am', hourIndex: 24 }, // End of cycle (next day)
    ];
    
    labelData.forEach((labelInfo, labelIndex) => {
      // Spread labels evenly across the graph width
      const x = padding + (labelIndex * (screenWidth - 2 * padding)) / (labelData.length - 1);
      
      timeLabels.push({
        label: labelInfo.label,
        x: x,
      });
    });

    return (
      <View style={styles.graphContainer}>
        <Svg height={graphHeight} width={screenWidth}>
          {/* Grid lines */}
          <Line x1={padding} y1={padding} x2={padding} y2={graphHeight - bottomPadding} stroke="#E0E0E0" strokeWidth="1" />
          <Line x1={padding} y1={graphHeight - bottomPadding} x2={screenWidth - padding} y2={graphHeight - bottomPadding} stroke="#E0E0E0" strokeWidth="1" />
          
          {/* Vertical grid lines every 6 hours */}
          {timeLabels.map((label, index) => (
            <Line
              key={index}
              x1={label.x}
              y1={padding}
              x2={label.x}
              y2={graphHeight - bottomPadding}
              stroke="#F0F0F0"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          ))}
          
          {/* Data line */}
          <Polyline
            points={pointsString}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              opacity={0.8}
            />
          ))}
          
          {/* Y-axis labels */}
          <SvgText x="5" y={padding + 5} fontSize="10" fill="#666" fontFamily='Poppins'>
            {maxValue.toFixed(1)}{unit}
          </SvgText>
          <SvgText x="5" y={graphHeight - bottomPadding + 5} fontSize="10" fill="#666" fontFamily='Poppins'>
            {minValue.toFixed(1)}{unit}
          </SvgText>
          
          {/* X-axis time labels */}
          {timeLabels.map((label, index) => (
            <SvgText
              key={index}
              x={label.x}
              y={graphHeight - 5}
              fontSize="9"
              fill="#666"
              textAnchor="middle"
              fontFamily='Poppins'
            >
              {label.label}
            </SvgText>
          ))}
        </Svg>
        <View style={styles.graphLabels}>
          <ThemedText>
            Hourly {chosenWeatherType?.charAt(0).toUpperCase()}{chosenWeatherType?.slice(1)}
          </ThemedText>
          <ThemedText>
            {Math.min(...data).toFixed(1)}{unit} - {Math.max(...data).toFixed(1)}{unit}
          </ThemedText>
        </View>
      </View>
    );
  };
  const shouldShowLoading = (!current && (!latitude || !longitude)) || 
                           (current && (!currentLocation.latitude || !currentLocation.longitude)) ||
                           weatherLoading || 
                           locationLoading ||
                           !weatherData ||
                           !currentLocation ||
                           currentLocation.loading;

  if (shouldShowLoading) {
    return (
      <ThemedView shadow color='primary' style={[styles.locationContent, { height: 193 }]}>
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
          <View style={styles.weather}>
            <View style={styles.weatherIconLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherValueLoading}><LoadingContainerAnimation /></View>
            <View style={styles.weatherLabelLoading}><LoadingContainerAnimation /></View>
          </View>
        </View>
      </ThemedView>
    );
  }

  // Graph component using animated SVG
  

  return (
    <ThemedView shadow color='primary' style={styles.locationContent}>
      {currentHourWeather && (
        <Image 
          source={getWeatherImage(currentHourWeather.weatherCode)} 
          style={styles.weatherImage}
        />
      )}
      
      <ThemedText style={{ opacity: 0.5, fontSize: 12 }}>
        {current ? "You're currently at" : "Weather for"}
      </ThemedText>
      <ThemedText type='subtitle' style={{fontSize: 16}}>{getLocationText()}</ThemedText>
      
      {currentHourWeather && (
        <ThemedText style={{ opacity: 0.5, fontSize: 12 }}>
          {currentHourWeather.weatherType}
        </ThemedText>
      )}
      
      <View style={styles.weatherDetailsContainer}>
        <TouchableOpacity style={styles.weather} onPress={() => setChosenWeatherType(chosenWeatherType === 'temperature' ? null : 'temperature')}>
          <ThemedIcons library='MaterialDesignIcons' name='thermometer' size={20} color='#B36B6B'/>
          <ThemedText style={{marginTop: 5}}>
            {currentHourWeather ? `${Math.round(currentHourWeather.temperature)}°C` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Temperature</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.weather} onPress={() => setChosenWeatherType(chosenWeatherType === 'precipitation' ? null : 'precipitation')}>
          <ThemedIcons library='MaterialDesignIcons' name='cloud' size={20} color='#5A7D9A'/>
          <ThemedText style={{marginTop: 5}}>
            {currentHourWeather ? `${currentHourWeather.precipitation}mm` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Rainfall</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.weather} onPress={() => setChosenWeatherType(chosenWeatherType === 'humidity' ? null : 'humidity')}>
          <ThemedIcons library='MaterialDesignIcons' name='water' size={20} color='#5A7D9A'/>
          <ThemedText style={{marginTop: 5}}>
            {currentHourWeather ? `${currentHourWeather.humidity}%` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Humidity</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.weather} onPress={() => setChosenWeatherType(chosenWeatherType === 'wind' ? null : 'wind')}>
          <ThemedIcons library='MaterialDesignIcons' name='fan' size={20} color='#5A7D9A'/>
          <ThemedText style={{marginTop: 5}}>
            {currentHourWeather ? `${Math.round(currentHourWeather.windSpeed)}km/h` : 'N/A'}
          </ThemedText>
          <ThemedText style={styles.weatherLabel}>Wind</ThemedText>
        </TouchableOpacity>
      </View>
      
      {!currentHourWeather && weatherError && (
        <ThemedText style={{ opacity: 0.5, marginTop: 10, textAlign: 'center', fontSize: 12 }}>
          Weather data not available
        </ThemedText>
      )}

      {chosenWeatherType && (
        <Animated.View 
          style={[
            styles.specificWeatherContainer,
            {
              opacity: containerOpacity,
              height: containerHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200], // Expand from 0 to full height (graph + padding)
              }),
              overflow: 'hidden',
              backgroundColor: backgroundColor,
            }
          ]}
        >
          {renderGraph(chosenWeatherType)}
        </Animated.View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  locationContent: {
    width: '100%',
    padding: 14,
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
    gap: 7,
    marginTop: 35,
  },
  weather: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '23%',
  },
  weatherLabel: {
    fontSize: 9,
    opacity: 0.5,
  },
  weatherImage: {
    position: 'absolute',
    right: 0,
    width: 150,
    height: 150,
    marginRight: -50,
    marginTop: -17,
    zIndex: 1000,
  },
  weatherValueLoading: {
    width: 50,
    height: 15,
    borderRadius: 100,
    marginVertical: 5,
    overflow: 'hidden',
  },
  weatherLabelLoading: {
    width: 50,
    height: 10,
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
  specificWeatherContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  graphContainer: {
    alignItems: 'center',
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
});
