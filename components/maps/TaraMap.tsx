import { useSession } from '@/context/SessionContext';
import { useLocation } from '@/hooks/useLocation';
import React, { ReactNode, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useMapType, MapType } from '@/hooks/useMapType';
import MapView, { Camera, MAP_TYPES, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import TaraMarker from './TaraMarker';

type CameraProps = {
  center: { latitude: number; longitude: number };
  pitch?: number;
  heading?: number;
  zoom?: number;
  altitude?: number;
  animationDuration?: number;
};

type TaraMapProps = {
  region?: Region;
  initialRegion?: Region;
  showMarker?: boolean;
  markerTitle?: string;
  markerDescription?: string;
  mapStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
  cameraProps?: CameraProps;
};

const TaraMap = forwardRef<MapView, TaraMapProps>((
  {
    region,
    initialRegion,
    showMarker = true,
    markerTitle = 'You are here',
    markerDescription = 'Current Location',
    mapStyle,
    children,
    cameraProps,
  },
  ref
) => {
  const { session } = useSession();
  const { latitude, longitude, loading } = useLocation();
  const mapRef = useRef<MapView>(null);
  
  // Expose map methods to parent component
  useImperativeHandle(ref, () => mapRef.current!, []);
  const { mapType: currentMapType } = useMapType();

  // Philippines bounding box
  const PHILIPPINES_REGION: Region = {
    latitude: 12.8797,
    longitude: 121.7740,
    latitudeDelta: 12.0,
    longitudeDelta: 12.0,
  };

  // Convert string map type to MAP_TYPES enum
  const getMapTypeEnum = (mapType: MapType) => {
    switch (mapType) {
      case 'satellite':
        return MAP_TYPES.SATELLITE;
      case 'hybrid':
        return MAP_TYPES.HYBRID;
      case 'terrain':
        return MAP_TYPES.TERRAIN;
      case 'standard':
      default:
        return MAP_TYPES.STANDARD;
    }
  };

  // Animate to user location if no cameraProps
  useEffect(() => {
    if (
      !cameraProps &&
      latitude !== 0 &&
      longitude !== 0 &&
      mapRef.current &&
      !loading
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: latitude as number,
          longitude: longitude as number,
          latitudeDelta: region?.latitudeDelta ?? 0.01,
          longitudeDelta: region?.longitudeDelta ?? 0.01,
        },
        500
      );
    }
  }, [latitude, longitude, loading, cameraProps, region]);

  // Animate camera if cameraProps provided
  useEffect(() => {
    if (cameraProps && mapRef.current) {
      const camera: Partial<Camera> = {
        center: cameraProps.center,
        pitch: cameraProps.pitch ?? 0,
        heading: cameraProps.heading ?? 0,
        zoom: cameraProps.zoom ?? 16,
        altitude: cameraProps.altitude,
      };
      mapRef.current.animateCamera(camera, {
        duration: cameraProps.animationDuration ?? 500,
      });
    }
  }, [cameraProps]);

  const defaultRegion: Region = initialRegion ?? region ?? {
    latitude: latitude || 14.5995,
    longitude: longitude || 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        mapType={getMapTypeEnum(currentMapType)}
        ref={mapRef}
        style={[styles.map, mapStyle]}
        provider={PROVIDER_DEFAULT}
        initialRegion={defaultRegion}
      >
        {showMarker &&
          session &&
          latitude !== 0 &&
          longitude !== 0 &&
          !loading && (
            <TaraMarker
              key="user-marker"
              coordinate={{ latitude: latitude as number, longitude: longitude as number }}
              color="#0065F8"
              icon={session.user?.profileImage}
            />
          )}

        {React.Children.map(children, (child, index) =>
          child ? React.cloneElement(child as React.ReactElement, { key: index }) : null
        )}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

export default TaraMap;
