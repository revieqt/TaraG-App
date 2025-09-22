import OptionsPopup from "@/components/OptionsPopup";
import { ThemedText } from "@/components/ThemedText";
import { TouchableOpacity, Image } from "react-native";
import { ThemedIcons } from "@/components/ThemedIcons";
import { StyleSheet, Alert} from "react-native";
import { useMapType } from "@/hooks/useMapType";


export const renderMapTypeSettings = () => {
  const { mapType: selectedMapType, setMapType, MAP_TYPES } = useMapType();

  const handleMapTypeSelect = async (mapType: string) => {
    try {
      await setMapType(mapType as any);
    } catch (error) {
      console.error('Error saving map type:', error);
      Alert.alert('Error', 'Failed to save map type preference');
    }
  };

  return(
    <OptionsPopup
      key="mapType"
      style={styles.optionsChild}
      options={[
        <TouchableOpacity 
          key="standard" 
          style={styles.mapType}
          onPress={() => handleMapTypeSelect(MAP_TYPES.STANDARD)}
        >
          <Image source={require('@/assets/images/map-standard.png')} style={styles.map} />
          <ThemedText>Standard</ThemedText>
          {selectedMapType === MAP_TYPES.STANDARD && (
            <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
          )}
        </TouchableOpacity>,
        <TouchableOpacity 
          key="terrain" 
          style={styles.mapType}
          onPress={() => handleMapTypeSelect(MAP_TYPES.TERRAIN)}
        >
          <Image source={require('@/assets/images/map-terrain.png')} style={styles.map} />
          <ThemedText>Terrain</ThemedText>
          {selectedMapType === MAP_TYPES.TERRAIN && (
            <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
          )}
        </TouchableOpacity>,
        <TouchableOpacity 
          key="satellite" 
          style={styles.mapType}
          onPress={() => handleMapTypeSelect(MAP_TYPES.SATELLITE)}
        >
          <Image source={require('@/assets/images/map-satellite.png')} style={styles.map} />
          <ThemedText>Satellite</ThemedText>
          {selectedMapType === MAP_TYPES.SATELLITE && (
            <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
          )}
        </TouchableOpacity>,
        <TouchableOpacity 
          key="hybrid" 
          style={styles.mapType}
          onPress={() => handleMapTypeSelect(MAP_TYPES.HYBRID)}
        >
          <Image source={require('@/assets/images/map-hybrid.png')} style={styles.map} />
          <ThemedText>Hybrid</ThemedText>
          {selectedMapType === MAP_TYPES.HYBRID && (
            <ThemedIcons library='MaterialIcons' name='check-circle' size={20} color='#007AFF' />
          )}
        </TouchableOpacity>,
      ]}
        >

          <ThemedIcons library='MaterialIcons' name='map' size={15} />
          <ThemedText>Map Type</ThemedText>
        </OptionsPopup>
  )
}

const styles = StyleSheet.create({
    optionsChild: {
        padding: 10,
        fontSize: 15,
        width: '100%',
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    mapType: {
      flexDirection: 'row',
      gap: 20,
      alignItems: 'center',
      flex: 1,
      borderRadius: 10,
  },
    map: {
        width: 50,
        height: 50,
        borderRadius: 10,
    },
  });