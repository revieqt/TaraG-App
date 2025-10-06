import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

const EarthquakeMap: React.FC = () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; }
          .pulse {
            background: rgba(255,0,0,0.3);
            border-radius: 50%;
            height: 30px;
            width: 30px;
            position: absolute;
            animation: pulse 1.5s ease-out infinite;
          }
          @keyframes pulse {
            0% { transform: scale(0.5); opacity: 0.6; }
            70% { transform: scale(2.5); opacity: 0; }
            100% { opacity: 0; }
          }
          .info-box {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(255,255,255,0.95);
            padding: 10px;
            border-radius: 8px;
            font-family: sans-serif;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            max-width: 90%;
            max-height: 35%;
            overflow-y: auto;
          }
          .info-box h3 {
            margin: 0 0 6px 0;
            font-size: 14px;
          }
          .info-item {
            margin-bottom: 6px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="info-box" id="info">
          <h3>Philippine Earthquakes (Last 24h)</h3>
          <div id="eq-list">Loading...</div>
        </div>

        <script>
          const map = L.map('map').setView([12.8797, 121.7740], 5);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 12,
            attribution: '© OpenStreetMap | PHIVOLCS & USGS'
          }).addTo(map);

          const philippinesBbox = { latMin: 4, latMax: 22, lonMin: 116, lonMax: 127 };

          const now = new Date();
          const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

          let latestTime = 0;
          let latestCoords = null;

          async function loadEarthquakes() {
            const listDiv = document.getElementById('eq-list');
            listDiv.innerHTML = '';

            // --- PHIVOLCS latest earthquake ---
            try {
              const res = await fetch('https://earthquake.phivolcs.dost.gov.ph/EQLatest.json');
              const data = await res.json();
              const eqTime = new Date(data.DateTime);
              if (eqTime > dayAgo) {
                const lat = parseFloat(data.Latitude);
                const lon = parseFloat(data.Longitude);
                const mag = parseFloat(data.Magnitude);
                const place = data["Location Name"];

                L.circleMarker([lat, lon], {
                  radius: mag * 2,
                  color: 'red',
                  fillColor: 'red',
                  fillOpacity: 0.7
                }).addTo(map)
                  .bindPopup("<b>PHIVOLCS</b><br>Magnitude: " + mag + "<br>" + place + "<br>" + data.DateTime);

                listDiv.innerHTML += '<div class="info-item"><b>PHIVOLCS</b>: ' + place + '<br>Magnitude: ' + mag + '<br><small>' + data.DateTime + '</small></div>';

                if (eqTime.getTime() > latestTime) {
                  latestTime = eqTime.getTime();
                  latestCoords = [lat, lon];
                }
              }
            } catch (err) {
              listDiv.innerHTML += '<div>PHIVOLCS data unavailable.</div>';
            }

            // --- USGS (last 24 hours, filtered to Philippines region) ---
            try {
              const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson');
              const json = await res.json();

              json.features.forEach(eq => {
                const coords = eq.geometry.coordinates;
                const time = new Date(eq.properties.time);
                const mag = eq.properties.mag || 0;
                const place = eq.properties.place;

                if (
                  coords[1] >= philippinesBbox.latMin &&
                  coords[1] <= philippinesBbox.latMax &&
                  coords[0] >= philippinesBbox.lonMin &&
                  coords[0] <= philippinesBbox.lonMax &&
                  time > dayAgo
                ) {
                  L.circleMarker([coords[1], coords[0]], {
                    radius: mag * 2,
                    color: 'orange',
                    fillColor: 'orange',
                    fillOpacity: 0.6
                  }).addTo(map)
                    .bindPopup("<b>USGS</b><br>Magnitude: " + mag + "<br>" + place + "<br>" + time.toLocaleString());

                  listDiv.innerHTML += '<div class="info-item"><b>USGS</b>: ' + place + '<br>Magnitude: ' + mag + '<br><small>' + time.toLocaleString() + '</small></div>';

                  if (time.getTime() > latestTime) {
                    latestTime = time.getTime();
                    latestCoords = [coords[1], coords[0]];
                  }
                }
              });
            } catch (err) {
              listDiv.innerHTML += '<div>USGS data unavailable.</div>';
            }

            // Highlight latest quake with pulsing marker
            if (latestCoords) {
              const [lat, lon] = latestCoords;
              const pulseDiv = L.divIcon({
                className: 'pulse',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });
              L.marker([lat, lon], { icon: pulseDiv }).addTo(map);
              map.setView([lat, lon], 6);
            }
          }

          loadEarthquakes();
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        startInLoadingState
        renderLoading={() => (
          <ActivityIndicator size="large" color="#007AFF" style={{ flex: 1 }} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default EarthquakeMap;
