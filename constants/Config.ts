import AsyncStorage from '@react-native-async-storage/async-storage';

export const BACKEND_URL = "http://192.168.1.58:5000/api";
export const SUPPORT_FORM_URL = "https://forms.gle/PPqT7Sy2JNY5NH2c6";
export const MAX_FREE_MESSAGES_PER_DAY = 5;
export const TRAVELLER_PRO_PRICE = 4.99;

// Map type configuration
export type MapTypeOption = 'standard' | 'satellite' | 'hybrid' | 'terrain';

const MAP_TYPE_STORAGE_KEY = '@tara_map_type';
const DEFAULT_MAP_TYPE: MapTypeOption = 'standard';

// Get map type from storage
export const getMapType = async (): Promise<MapTypeOption> => {
  try {
    const storedMapType = await AsyncStorage.getItem(MAP_TYPE_STORAGE_KEY);
    return (storedMapType as MapTypeOption) || DEFAULT_MAP_TYPE;
  } catch (error) {
    console.warn('Failed to get map type from storage:', error);
    return DEFAULT_MAP_TYPE;
  }
};

// Set map type in storage
export const setMapType = async (mapType: MapTypeOption): Promise<void> => {
  try {
    await AsyncStorage.setItem(MAP_TYPE_STORAGE_KEY, mapType);
  } catch (error) {
    console.warn('Failed to save map type to storage:', error);
  }
};

// Available map type options for settings UI
export const MAP_TYPE_OPTIONS: { label: string; value: MapTypeOption }[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Satellite', value: 'satellite' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Terrain', value: 'terrain' },
];

// Default export for backward compatibility
export let mapType: MapTypeOption = DEFAULT_MAP_TYPE;

export const DEFAULT_AREA_CODES = [
    { label: '+63', value: '63+' },
    { label: '+1', value: '1+' },
    { label: '+44', value: '44+' },
    { label: '+91', value: '91+' },
  ];