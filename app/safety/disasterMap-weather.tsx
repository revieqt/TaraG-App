import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { OPENWEATHERMAP_API_KEY } from '@/constants/Config';
import BackButton from '@/components/custom/BackButton';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColor } from '@/hooks/useThemeColor';
import ThemedIcons from '@/components/ThemedIcons';
import { useRouter } from 'expo-router';

type WeatherLayer = 'clouds' | 'temp' | 'precipitation' | 'wind' | 'pressure';

const layerLabels: Record<WeatherLayer, string> = {
  precipitation: 'Precipitation',
  temp: 'Temperature',
  wind: 'Wind',
  clouds: 'Clouds',
  pressure: 'Pressure',
};

export default function WeatherMapScreen() {
  const validLayers: WeatherLayer[] = ['clouds', 'temp', 'precipitation', 'wind', 'pressure'];
  const initialLayer = 'precipitation'
  const accentColor = useThemeColor({}, 'accent');
  const [activeLayer, setActiveLayer] = useState<WeatherLayer>(initialLayer);
  const router = useRouter();

  const htmlContent = useMemo(() => {
    const tileLayer = `${activeLayer}_new`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            html, body, #map {
              height: 100%;
              margin: 0;
              padding: 0;
            }
          </style>
          <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        </head>
        <body>
          <div id="map"></div>
          <script>
            const map = L.map('map').setView([12.8797, 121.7740], 6);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: 'Base Map © OpenStreetMap contributors'
            }).addTo(map);

            const weatherLayer = L.tileLayer('https://tile.openweathermap.org/map/${tileLayer}/{z}/{x}/{y}.png?appid=${OPENWEATHERMAP_API_KEY}', {
              attribution: 'Weather Data © OpenWeatherMap'
            }).addTo(map);
          </script>
        </body>
      </html>
    `;
  }, [activeLayer]);

  return (
    <ThemedView style={{flex: 1}}>
      <LinearGradient
        colors={['#000', 'transparent']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={{position: 'absolute', top: 30, right: 16, pointerEvents: 'box-none', zIndex: 100000}}>
          <ThemedIcons
            library="MaterialIcons"
            name="close"
            size={30}
            color="#fff"
          />
        </TouchableOpacity>
        <ThemedText type="title" style={{color: '#fff'}}>Weather Map</ThemedText>
        <ThemedText style={{color: '#fff'}}>
          Real-time weather conditions and forecasts
        </ThemedText>
        <View style={styles.toggleContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.keys(layerLabels).map((key) => {
              const layer = key as WeatherLayer;
              const isActive = activeLayer === layer;
              return (
                <TouchableOpacity
                  key={layer}
                  style={[styles.toggleButton, {backgroundColor: isActive ? accentColor : 'rgba(0,0,0,.5)'}]}
                  onPress={() => setActiveLayer(layer)}
                >
                  <ThemedText style={[styles.toggleText, isActive && styles.activeText]}>
                    {layerLabels[layer]}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </LinearGradient>
      
      <View style={styles.mapContainer}>
        {/* Segmented Toggle Bar */}
        

        {/* WebView Map */}
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007bff" />
            </View>
          )}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 30,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  mapContainer: {
    flex: 1,
    marginTop: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 7,
    marginTop: 10,
  },
  toggleButton: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 5
  },
  activeButton: {
    backgroundColor: '#007bff',
  },
  toggleText: {
    color: '#fff',
  },
  activeText: {
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
