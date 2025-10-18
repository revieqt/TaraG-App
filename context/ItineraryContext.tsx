import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LocationItem {
  latitude: number;
  longitude: number;
  locationName: string;
  note: string;
}

interface DailyLocation {
  date: Date;
  locations: LocationItem[];
}

export interface Itinerary {
  id: string;
  title: string;
  description: string;
  type: string;
  startDate: Date;
  endDate: Date;
  userID: string;
  username: string;
  createdOn: Date;
  updatedOn: Date;
  status: 'pending' | 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  planDaily: boolean;
  locations: LocationItem[] | DailyLocation[]; // Array structure depends on planDaily
}

interface ItineraryContextType {
  itineraries: Itinerary[];
  addItinerary: (itinerary: Omit<Itinerary, 'id' | 'createdOn' | 'updatedOn' | 'status'>) => Promise<string>;
  saveItineraryFromBackend: (backendItinerary: any) => Promise<void>;
  updateItinerary: (id: string, updates: Partial<Itinerary>) => Promise<void>;
  deleteItinerary: (id: string) => Promise<void>;
  getItineraryById: (id: string) => Itinerary | undefined;
  refreshItineraries: () => Promise<void>;
  syncWithBackend: (userItineraries: any[]) => Promise<void>;
  clearAllItineraries: () => Promise<void>; // For debugging
}

const ItineraryContext = createContext<ItineraryContextType | undefined>(undefined);

const STORAGE_KEY = '@itineraries';

export const ItineraryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);

  // Load itineraries from AsyncStorage on mount
  useEffect(() => {
    loadItineraries();
  }, []);

  // Debug: Track itineraries state changes
  useEffect(() => {
    console.log('🔄 ItineraryContext state changed:', {
      count: itineraries.length,
      itineraries: itineraries.map((it: Itinerary) => ({
        id: it.id,
        title: it.title,
        userID: it.userID,
        status: it.status,
        startDate: it.startDate.toISOString(),
        endDate: it.endDate.toISOString()
      }))
    });
  }, [itineraries]);

  const loadItineraries = async () => {
    try {
      console.log('🔍 Loading itineraries from AsyncStorage...');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      console.log('📦 Raw AsyncStorage data:', stored ? 'EXISTS' : 'NULL');
      
      if (stored) {
        const rawData = JSON.parse(stored);
        console.log('📊 Parsed raw data:', rawData.length, 'items');
        console.log('📋 Raw itineraries:', JSON.stringify(rawData, null, 2));
        
        const parsedItineraries = rawData.map((item: any, index: number) => {
          console.log(`🔄 Processing item ${index}:`, {
            id: item.id,
            title: item.title,
            userID: item.userID,
            status: item.status,
            startDate: item.startDate,
            endDate: item.endDate,
            planDaily: item.planDaily
          });
          
          return {
            ...item,
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            createdOn: new Date(item.createdOn),
            updatedOn: new Date(item.updatedOn),
            locations: item.planDaily 
              ? item.locations.map((dailyLoc: any) => ({
                  date: new Date(dailyLoc.date),
                  locations: dailyLoc.locations
                }))
              : item.locations
          };
        });
        
        setItineraries(parsedItineraries);
        console.log('✅ Loaded and processed itineraries:', parsedItineraries.length);
        console.log('📝 Final processed itineraries:', parsedItineraries.map((it: Itinerary) => ({
          id: it.id,
          title: it.title,
          userID: it.userID,
          status: it.status,
          startDate: it.startDate.toISOString(),
          endDate: it.endDate.toISOString()
        })));
      } else {
        console.log('📝 No itineraries found in AsyncStorage');
        setItineraries([]);
      }
    } catch (error) {
      console.error('❌ Failed to load itineraries from AsyncStorage:', error);
      setItineraries([]);
    }
  };

  const saveItineraries = async (newItineraries: Itinerary[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItineraries));
      setItineraries(newItineraries);
      console.log('✅ Saved itineraries to AsyncStorage:', newItineraries.length);
    } catch (error) {
      console.error('❌ Failed to save itineraries to AsyncStorage:', error);
    }
  };

  const addItinerary = async (itineraryData: Omit<Itinerary, 'id' | 'createdOn' | 'updatedOn' | 'status'>): Promise<string> => {
    const now = new Date();
    const id = `itinerary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newItinerary: Itinerary = {
      ...itineraryData,
      id,
      createdOn: now,
      updatedOn: now,
      status: 'pending',
    };

    const updatedItineraries = [...itineraries, newItinerary];
    await saveItineraries(updatedItineraries);
    return id;
  };

  const saveItineraryFromBackend = async (backendItinerary: any) => {
    console.log('🔄 Saving itinerary from backend:', backendItinerary.title);
    console.log('📊 Raw backend data:', JSON.stringify(backendItinerary, null, 2));
    
    // Helper function to safely convert dates
    const safeConvertDate = (dateValue: any, fieldName: string): Date => {
      try {
        if (!dateValue) {
          console.warn(`⚠️ ${fieldName} is null/undefined, using current date`);
          return new Date();
        }
        
        // If it's a Firestore timestamp with toDate method
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate();
        }
        
        // If it's already a Date object
        if (dateValue instanceof Date) {
          return dateValue;
        }
        
        // If it's a string or number, try to parse it
        const parsed = new Date(dateValue);
        if (isNaN(parsed.getTime())) {
          console.warn(`⚠️ Invalid date for ${fieldName}:`, dateValue, 'using current date');
          return new Date();
        }
        
        return parsed;
      } catch (error) {
        console.error(`❌ Error converting ${fieldName}:`, error, 'using current date');
        return new Date();
      }
    };
    
    // Convert backend response to local format
    const itinerary: Itinerary = {
      id: backendItinerary.id,
      title: backendItinerary.title || 'Untitled',
      description: backendItinerary.description || '',
      type: backendItinerary.type || 'Solo',
      startDate: safeConvertDate(backendItinerary.startDate, 'startDate'),
      endDate: safeConvertDate(backendItinerary.endDate, 'endDate'),
      userID: backendItinerary.userID,
      username: backendItinerary.username,
      createdOn: safeConvertDate(backendItinerary.createdOn, 'createdOn'),
      updatedOn: safeConvertDate(backendItinerary.updatedOn, 'updatedOn'),
      status: backendItinerary.status || 'pending',
      planDaily: backendItinerary.planDaily || false,
      locations: backendItinerary.planDaily 
        ? (backendItinerary.locations || []).map((dailyLoc: any) => ({
            date: safeConvertDate(dailyLoc.date, 'dailyLocation.date'),
            locations: dailyLoc.locations || []
          }))
        : backendItinerary.locations || []
    };

    const updatedItineraries = [...itineraries, itinerary];
    await saveItineraries(updatedItineraries);
  };

  const updateItinerary = async (id: string, updates: Partial<Itinerary>) => {
    const updatedItineraries = itineraries.map(itinerary =>
      itinerary.id === id
        ? { ...itinerary, ...updates, updatedOn: new Date() }
        : itinerary
    );
    await saveItineraries(updatedItineraries);
  };

  const deleteItinerary = async (id: string) => {
    const updatedItineraries = itineraries.filter(itinerary => itinerary.id !== id);
    await saveItineraries(updatedItineraries);
  };

  const getItineraryById = (id: string): Itinerary | undefined => {
    return itineraries.find(itinerary => itinerary.id === id);
  };

  const refreshItineraries = async () => {
    await loadItineraries();
  };

  const clearAllItineraries = async () => {
    console.log('🗑️ Clearing all itineraries from AsyncStorage...');
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setItineraries([]);
      console.log('✅ All itineraries cleared');
    } catch (error) {
      console.error('❌ Failed to clear itineraries:', error);
    }
  };

  const syncWithBackend = async (userItineraries: any[]) => {
    console.log('🔄 Syncing with backend itineraries:', userItineraries.length);
    
    // Helper function to safely convert dates (reuse from saveItineraryFromBackend)
    const safeConvertDate = (dateValue: any, fieldName: string): Date => {
      try {
        if (!dateValue) {
          console.warn(`⚠️ ${fieldName} is null/undefined, using current date`);
          return new Date();
        }
        
        if (dateValue.toDate && typeof dateValue.toDate === 'function') {
          return dateValue.toDate();
        }
        
        if (dateValue instanceof Date) {
          return dateValue;
        }
        
        const parsed = new Date(dateValue);
        if (isNaN(parsed.getTime())) {
          console.warn(`⚠️ Invalid date for ${fieldName}:`, dateValue, 'using current date');
          return new Date();
        }
        
        return parsed;
      } catch (error) {
        console.error(`❌ Error converting ${fieldName}:`, error, 'using current date');
        return new Date();
      }
    };
    
    // Clear existing itineraries and replace with backend data
    const convertedItineraries = userItineraries.map((backendItinerary: any) => ({
      id: backendItinerary.id,
      title: backendItinerary.title || 'Untitled',
      description: backendItinerary.description || '',
      type: backendItinerary.type || 'Solo',
      startDate: safeConvertDate(backendItinerary.startDate, 'startDate'),
      endDate: safeConvertDate(backendItinerary.endDate, 'endDate'),
      userID: backendItinerary.userID,
      username: backendItinerary.username,
      createdOn: safeConvertDate(backendItinerary.createdOn, 'createdOn'),
      updatedOn: safeConvertDate(backendItinerary.updatedOn, 'updatedOn'),
      status: backendItinerary.status || 'pending',
      planDaily: backendItinerary.planDaily || false,
      locations: backendItinerary.planDaily 
        ? (backendItinerary.locations || []).map((dailyLoc: any) => ({
            date: safeConvertDate(dailyLoc.date, 'dailyLocation.date'),
            locations: dailyLoc.locations || []
          }))
        : backendItinerary.locations || []
    }));

    await saveItineraries(convertedItineraries);
  };

  const value: ItineraryContextType = {
    itineraries,
    addItinerary,
    saveItineraryFromBackend,
    updateItinerary,
    deleteItinerary,
    getItineraryById,
    refreshItineraries,
    syncWithBackend,
    clearAllItineraries,
  };

  return (
    <ItineraryContext.Provider value={value}>
      {children}
    </ItineraryContext.Provider>
  );
};

export const useItinerary = (): ItineraryContextType => {
  const context = useContext(ItineraryContext);
  if (!context) {
    throw new Error('useItinerary must be used within an ItineraryProvider');
  }
  return context;
};
