import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { OPENWEATHERMAP_API_KEY } from '@/constants/Config';

type WeatherLayer = 'clouds' | 'temp' | 'precipitation' | 'wind' | 'pressure';

interface WeatherMapProps {
  defaultLayer?: WeatherLayer;
}

const layerLabels: Record<WeatherLayer, string> = {
  clouds: '☁️ Clouds',
  temp: '🌡️ Temp',
  precipitation: '🌧️ Rain',
  wind: '💨 Wind',
  pressure: '🌀 Pressure',
};

const WeatherMap: React.FC<WeatherMapProps> = ({ defaultLayer = 'clouds' }) => {
  const [activeLayer, setActiveLayer] = useState<WeatherLayer>(defaultLayer);

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
    <View style={styles.container}>
      {/* Segmented Toggle Bar */}
      <View style={styles.toggleContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(layerLabels).map((key) => {
            const layer = key as WeatherLayer;
            const isActive = activeLayer === layer;
            return (
              <TouchableOpacity
                key={layer}
                style={[styles.toggleButton, isActive && styles.activeButton]}
                onPress={() => setActiveLayer(layer)}
              >
                <Text style={[styles.toggleText, isActive && styles.activeText]}>
                  {layerLabels[layer]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  toggleButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginHorizontal: 4,
  },
  activeButton: {
    backgroundColor: '#007bff',
  },
  toggleText: {
    color: '#ccc',
    fontWeight: '500',
  },
  activeText: {
    color: '#fff',
    fontWeight: '700',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WeatherMap;
