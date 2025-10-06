import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { ThemedText } from "../ThemedText";

type RiskMapModalProps = {
  visible: boolean;
  onClose: () => void;
  mapType: "flood" | "landslide" | "storm_surge";
  creditText?: string;
};

const RiskMapModal: React.FC<RiskMapModalProps> = ({ visible, onClose, mapType, creditText }) => {
  // Define WMS layer URLs from Project NOAH
  const mapLayers: Record<string, string> = {
    flood: "noah:flood_hazard",
    landslide: "noah:landslide_hazard",
    storm_surge: "noah:storm_surge_hazard",
  };

  // Base URL for WMS GetMap (EPSG:4326 works globally)
  const baseURL = "https://noah.up.edu.ph/geoserver/noah/wms";
  const bbox = "116,4,127,21"; // Philippines approximate bounding box
  const wmsURL = `${baseURL}?service=WMS&request=GetMap&layers=${mapLayers[mapType]}&bbox=${bbox}&width=600&height=600&srs=EPSG:4326&format=image/png&transparent=true`;

  // Use OpenStreetMap as background
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map').setView([12.8797, 121.7740], 6);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors, © UP Resilience Institute – Project NOAH'
          }).addTo(map);

          const hazardLayer = L.tileLayer.wms('${baseURL}', {
            layers: '${mapLayers[mapType]}',
            format: 'image/png',
            transparent: true,
            attribution: 'Project NOAH Hazard Map'
          }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.container}>
        <LinearGradient
          colors={["#000", "transparent"]}
          style={styles.header}
        >
            <ThemedText type='title' style={{color: '#fff'}}>{mapType.charAt(0).toUpperCase() + mapType.slice(1)} Hazard Map</ThemedText>
            <ThemedText style={{color: '#fff'}}>{creditText}</ThemedText>
        </LinearGradient>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <WebView
          source={{ html: htmlContent }}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
          )}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingBottom: 40,
  },
  closeButton: {
    padding: 5,
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
  },
  closeText: {
    color: "#fff",
    fontSize: 20,
  },
});

export default RiskMapModal;
