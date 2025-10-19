import LocationDisplay from '@/components/LocationDisplay';
import OptionsPopup from '@/components/OptionsPopup';
import { ThemedIcons } from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ViewItineraryProps {
  json: any;
}

const ViewItinerary: React.FC<ViewItineraryProps> = ({ json }) => {
  const itinerary = json;

  const formatDate = (dateValue: any): string => {
    if (!dateValue) return 'N/A';
    
    try {
      if (typeof dateValue === 'string') {
        return dateValue.slice(0, 10);
      }
      if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 10);
      }
      if (typeof dateValue === 'number') {
        return new Date(dateValue).toISOString().slice(0, 10);
      }
      if (dateValue.toDate && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toISOString().slice(0, 10);
      }
      return 'Invalid Date';
    } catch (error) {
      console.warn('Error formatting date:', dateValue, error);
      return 'Invalid Date';
    }
  };

  const renderDayLocations = (loc: any) => {
      return (
        <LocationDisplay
          content={loc.locations && Array.isArray(loc.locations) ? loc.locations.map((l: any, i: number) => (
            <View key={i} style={{flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginBottom: 10}}>
              <View>
                <ThemedText>{l.locationName} </ThemedText>
                <ThemedText style={{opacity: .5}}>{l.note ? `${l.note}` : ''}</ThemedText>
              </View>
              <TouchableOpacity>
                <ThemedIcons library="MaterialDesignIcons" name="weather-cloudy-clock" size={20}/>
              </TouchableOpacity>
            </View>
            
          )) : []}
        />
      );
  };

  return (
    <View style={{ flex: 1 }}>
      {itinerary && (
        <>
          <View style={styles.header}>
            <ThemedText type="subtitle" style={{ flex: 1 }}>{itinerary.title}</ThemedText>

            <View style={styles.typesContainer}>
              <ThemedIcons library="MaterialDesignIcons" name="calendar" size={15}/>
              <ThemedText>{formatDate(itinerary.startDate)}  to  {formatDate(itinerary.endDate)}</ThemedText>
            </View>

            <View style={styles.typesContainer}>
              <ThemedIcons library="MaterialIcons" name="edit-calendar" size={15}/>
              <ThemedText>{itinerary.type}</ThemedText>
            </View>

            <View style={styles.typesContainer}>
              <ThemedIcons library="MaterialIcons" name="person" size={15}/>
              <ThemedText>Created by {itinerary.username}</ThemedText>
            </View>
          </View>
          <ThemedText style={{marginVertical: 25}}>{itinerary.description}</ThemedText>
          {Array.isArray(itinerary.locations) && itinerary.locations.length > 0 && (
            itinerary.locations.map((loc: any, idx: number) => (
              <View key={idx}>
                {loc.date && <>
                  <ThemedText type='subtitle' style={{fontSize: 15}}>Day {idx + 1} </ThemedText>
                  <ThemedText style={{marginBottom: 12, opacity: .5}}>({formatDate(loc.date)})</ThemedText>
                </>
              }
                {renderDayLocations(loc)}
              </View>
            ))
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
  header:{
    borderBottomWidth: 1,
    borderBottomColor: '#ccc4',
    paddingBottom: 10
  },
  typesContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    opacity: .7,
    marginTop: 3
  }
});
export default ViewItinerary;