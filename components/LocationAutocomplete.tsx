// import TextField from '@/components/TextField';
// import ThemedIcons from '@/components/ThemedIcons';
// import { ThemedText } from '@/components/ThemedText';
// import { usePlacesApi } from '@/services/placesApiService';
// import React, { useEffect, useRef, useState } from 'react';
// import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
// import { ThemedView } from './ThemedView';

// export interface LocationItem {
//   locationName: string;
//   latitude: number | null;
//   longitude: number | null;
//   note: string;
// }

// interface LocationAutocompleteProps {
//   value: string;
//   onSelect: (loc: LocationItem) => void;
//   placeholder: string;
//   style?: any;
// }

// const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onSelect, placeholder, style }) => {
//   const [input, setInput] = useState<string>(value || '');
//   const [suggestions, setSuggestions] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const { searchAutocomplete, getPlaceDetails } = usePlacesApi();
//   const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   // Debounce search to avoid too many API calls
//   useEffect(() => {
//     if (input.trim() === '') {
//       setSuggestions([]);
//       setShowDropdown(false);
//       return;
//     }

//     // Clear previous timer
//     if (debounceTimer.current !== null) {
//       clearTimeout(debounceTimer.current);
//       debounceTimer.current = null;
//     }

//     // Set a new timer
//     debounceTimer.current = setTimeout(() => {
//       fetchSuggestions();
//     }, 300); // 300ms delay

//     // Cleanup function to clear the timer if the component unmounts
//     return () => {
//       if (debounceTimer.current !== null) {
//         clearTimeout(debounceTimer.current);
//         debounceTimer.current = null;
//       }
//     };
//   }, [input]);

//   const fetchSuggestions = async () => {
//     if (!input.trim()) {
//       setSuggestions([]);
//       setShowDropdown(false);
//       return;
//     }
    
//     setLoading(true);
//     try {
//       const results = await searchAutocomplete(input.trim());
//       setSuggestions(results);
//       setShowDropdown(results.length > 0);
//     } catch (error) {
//       console.error('Error fetching place suggestions:', error);
//       setSuggestions([]);
//       setShowDropdown(false);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (text: string) => {
//     setInput(text);
//     if (!text) {
//       setSuggestions([]);
//       setShowDropdown(false);
//     }
//   };

//   const handleSelect = async (suggestion: any) => {
//     setInput(suggestion.description);
//     setShowDropdown(false);
    
//     // Get the exact coordinates for the selected place
//     try {
//       setLoading(true);
//       const details = await getPlaceDetails(suggestion.placeId);
//       onSelect({
//         locationName: suggestion.description,
//         latitude: details.location.lat,
//         longitude: details.location.lng,
//         note: '',
//       });
//     } catch (error) {
//       console.error('Error getting place details:', error);
//       // Fallback to suggestion without coordinates if place details fail
//       onSelect({
//         locationName: suggestion.description,
//         latitude: null,
//         longitude: null,
//         note: '',
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={[{ zIndex: 10 }, style]}>
//       <View style={styles.inputContainer}>
//         <TextField
//           placeholder={placeholder}
//           value={input}
//           onChangeText={handleInputChange}
//           onFocus={() => setShowDropdown(!!input && suggestions.length > 0)}
//           onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
//           style={styles.textField}
//         />
//         <TouchableOpacity
//           onPress={fetchSuggestions}
//           style={styles.searchButton}
//           disabled={loading}
//         >
//           {loading ? (
//             <ActivityIndicator size="small"/>
//           ) : (
//             <ThemedIcons library="MaterialIcons" name="search" size={20}/>
//           )}
//         </TouchableOpacity>
//       </View>
//       {showDropdown && (
//         <ThemedView shadow style={styles.dropdown}>
//           <ScrollView
//             style={styles.scrollView}
//             showsVerticalScrollIndicator={false}
//             nestedScrollEnabled={true}
//           >
//             {suggestions.length === 0 ? (
//               <ThemedText style={styles.dropdownItem}>No results</ThemedText>
//             ) : (
//               suggestions.map((suggestion, index) => (
//                 <TouchableOpacity
//                   key={`${suggestion.placeId || index}`}
//                   style={styles.suggestionItem}
//                   onPress={() => handleSelect(suggestion)}
//                 >
//                   <ThemedText>
//                     {suggestion.mainText}
//                   </ThemedText>
//                   <ThemedText style={styles.suggestionAddress}>
//                     {suggestion.secondaryText}
//                   </ThemedText>
//                 </TouchableOpacity>
//               ))
//             )}
//           </ScrollView>
//         </ThemedView>
//       )}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   inputContainer: {
//     position: 'relative',
//   },
//   textField: {
//     paddingRight: 50, // Make space for the search button
//   },
//   searchButton: {
//     position: 'absolute',
//     right: 8,
//     top: 8,
//     width: 32,
//     height: 32,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   dropdown: {
//     position: 'absolute',
//     top: 50,
//     left: 0,
//     right: 0,
//     borderRadius: 10,
//     zIndex: 100000,
//     maxHeight: 250,
//   },
//   scrollView: {
//     flex: 1,
//     maxHeight: 250,
//   },
//   dropdownItem: {
//     fontSize: 15,
//     color: '#222',
//     padding: 10,
//   },
//   suggestionItem: {
//     paddingHorizontal: 10,
//     paddingVertical: 7,
//   },
//   suggestionAddress: {
//     opacity: 0.5,
//   },
// });

// export default LocationAutocomplete; 

import TextField from '@/components/TextField';
import ThemedIcons from '@/components/ThemedIcons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React, { useState, useRef, useEffect } from 'react';
import { ActivityIndicator, Keyboard, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export interface LocationItem {
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  note: string;
}

interface LocationAutocompleteProps {
  value: string;
  onSelect: (loc: LocationItem) => void;
  placeholder: string;
  style?: any;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({ value, onSelect, placeholder, style }) => {
  const [input, setInput] = useState<string>(value || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync internal input state with value prop
  useEffect(() => {
    setInput(value || '');
  }, [value]);

  const fetchSuggestions = async () => {
    if (!input.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(input.trim())}&limit=10`
      );
      const data = await res.json();
      setSuggestions(data.features || []);
      setShowDropdown(true);
    } catch (e) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInput(text);
    if (!text) {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  const handleSelect = async (item: any) => {
    const locationName = item.properties?.display_name || item.properties?.name || 'Unknown location';
    setInput(locationName);
    setShowDropdown(false);
    
    // Extract coordinates from the Photon API response
    const coordinates = item.geometry?.coordinates;
    const longitude = coordinates?.[0] || null;
    const latitude = coordinates?.[1] || null;
    
    onSelect({
      locationName: locationName,
      latitude: latitude,
      longitude: longitude,
      note: '',
    });
  };

  return (
    <View style={{ zIndex: 10 }}>
      <View style={styles.inputContainer}>
        <TextField
          placeholder={placeholder}
          value={input}
          onChangeText={handleInputChange}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            setIsInputFocused(true);
            setShowDropdown(!!input && suggestions.length > 0);
          }}
          onBlur={() => {
            setIsInputFocused(false);
            // Only hide dropdown if no suggestions or after longer delay
            blurTimeoutRef.current = setTimeout(() => {
              if (!showDropdown) return;
              setShowDropdown(false);
            }, 500);
          }}
          style={[styles.textField, style]}
        />
        <TouchableOpacity
          onPress={() => {
            if (showDropdown && suggestions.length > 0) {
              // If dropdown is showing, dismiss keyboard but keep dropdown
              Keyboard.dismiss();
            } else {
              // If no dropdown, fetch suggestions
              fetchSuggestions();
            }
          }}
          style={styles.searchButton}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small"/>
          ) : (
            <ThemedIcons 
              library="MaterialIcons" 
              name={showDropdown && suggestions.length > 0 ? "keyboard-hide" : "search"} 
              size={20}
            />
          )}
        </TouchableOpacity>
      </View>
      {showDropdown && suggestions.length > 0 && (
        <ThemedView color='primary' shadow style={styles.dropdown}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {suggestions.length === 0 ? (
              <ThemedText>No results</ThemedText>
            ) : (
              suggestions.map((item, index) => (
                <TouchableOpacity
                  key={`${item.properties?.osm_id || item.properties?.place_id || index}-${index}`}
                  onPress={() => {
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                      blurTimeoutRef.current = null;
                    }
                    Keyboard.dismiss();
                    handleSelect(item);
                  }}
                  style={styles.dropdownItemBtn}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <ThemedText>
                      {item.properties?.display_name || item.properties?.name || 'Unknown location'}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </ThemedView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
  },
  textField: {
    paddingRight: 50, // Make space for the search button
  },
  searchButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    borderRadius: 10,
    zIndex: 1000,
    maxHeight: 180,
  },
  scrollView: {
    flex: 1,
    maxHeight: 180,
  },
  dropdownItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
});

export default LocationAutocomplete; 