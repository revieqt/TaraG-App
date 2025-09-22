import LocationDisplay from '@/components/LocationDisplay';
import OptionsPopup from '@/components/OptionsPopup';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ViewItineraryProps {
  json: any;
}

const ViewItinerary: React.FC<ViewItineraryProps> = ({ json }) => {
  const itinerary = json;

  const renderDayLocations = (loc: any) => {
      return (
        <LocationDisplay
          content={loc.locations && Array.isArray(loc.locations) ? loc.locations.map((l: any, i: number) => (
            <View key={i}>
              <ThemedText>{l.locationName} </ThemedText>
              <ThemedText style={{opacity: .5}}>{l.note ? `${l.note}` : ''}</ThemedText>
            </View>
            
          )) : []}
        />
      );
  };

  return (
    <View style={{ flex: 1 }}>
      {itinerary && (
        <>
          <ThemedText type="title" style={{ marginBottom: 8, flex: 1 }}>{itinerary.title}</ThemedText>

          <View style={styles.typesContainer}>
            <ThemedIcons library="MaterialIcons" name="edit-calendar" size={15}/>
            <ThemedText style={styles.type}>{itinerary.type}</ThemedText>
            <ThemedIcons library="MaterialDesignIcons" name="calendar" size={15}/>
            <ThemedText style={styles.type}>{itinerary.startDate?.slice(0,10)}  to  {itinerary.endDate?.slice(0,10)}</ThemedText>
          </View>

          <ThemedText style={{marginBottom: 25}}>{itinerary.description}</ThemedText>
          {Array.isArray(itinerary.locations) && itinerary.locations.length > 0 ? (
            itinerary.locations.map((loc: any, idx: number) => (
              <View key={idx}>
                {loc.date && <>
                  <ThemedText type='defaultSemiBold'>Day {idx + 1} </ThemedText>
                  <ThemedText style={{marginBottom: 12, opacity: .5}}>({loc.date?.slice(0,10)})</ThemedText>
                </>
              }
                {renderDayLocations(loc)}
              </View>
            ))
          ) : (
            <ThemedText style={{ marginLeft: 8 }}>No locations.</ThemedText>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  options:{
    marginLeft: 12,
  },
  type:{
    marginLeft: 4,
    marginRight: 12,
  },
  typesContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4
  }
});
export default ViewItinerary;