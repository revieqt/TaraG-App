import React from 'react';
import { View , StyleSheet} from 'react-native';
import { useSession } from '@/context/SessionContext';
import DefaultMap from '@/app/maps/maps-default';
import ActiveRouteMap from '@/app/maps/maps-activeRoute';

export default function MapScreen() {
  const { session } = useSession();

  return (
    <View style={{ flex: 1 }}>
      {session?.activeRoute && (
        <ActiveRouteMap />
      )}
      <View
        style={{
          flex: session?.activeRoute ? 0 : 1
        }}>
        <DefaultMap />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
