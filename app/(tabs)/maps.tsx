import React from 'react';
import { View } from 'react-native';
import { useSession } from '@/context/SessionContext';
import DefaultMap from '@/app/maps/maps-default';
import ActiveRouteMap from '@/app/maps/maps-activeRoute';

export default function MapScreen() {
  const { session } = useSession();

  return (
    <View style={{ flex: 1 }}>
      {session?.activeRoute ? (
        <ActiveRouteMap />
      ) : (
        <DefaultMap />
      )}
    </View>
  );
}
