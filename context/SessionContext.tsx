import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// 🧑‍💻 User type
export type User = {
  id: string;
  fname: string;
  mname?: string;
  lname: string;
  username: string;
  email: string;
  bdate: Date;
  gender: string;
  contactNumber: string;
  profileImage: string;
  isProUser: boolean;
  bio?: string;
  status: string;
  type: string;
  createdOn: Date;
  groups: string[];
  isFirstLogin: boolean;
  likes: string[];
  safetyState: {
    isInAnEmergency: boolean;
    emergencyType: string;
  };
  publicSettings: {
    isProfilePublic: boolean;
    isTravelInfoPublic: boolean;
    isPersonalInfoPublic: boolean;
  };
};

// 🛣️ Route Data
export type RouteStep = {
  distance: number;        // meters for this step
  duration: number;        // seconds for this step
  instruction: string;     // "Turn left onto Main St"
  name?: string;           // street/POI name if available
  way_points: [number, number]; // indices in geometry polyline
};

export type RouteSegment = {
  distance: number;        // meters between two stops
  duration: number;        // seconds between two stops
  steps?: RouteStep[];     // turn-by-turn steps if requested
};

export type RouteData = {
  geometry: {
    coordinates: [number, number, number?][]; // [lon, lat, ele?] if elevation enabled
    type: string; // "LineString"
  };
  distance: number;   // total meters
  duration: number;   // total seconds
  bbox?: number[];
  segments: RouteSegment[]; // per-stop breakdown
};

// 📍 ActiveRoute type
export type ActiveRoute = {
  routeID: string;
  userID: string;
  location: { latitude: number; longitude: number; locationName: string }[];
  mode: string;
  status: string;
  createdOn: Date;
  routeData?: RouteData; // ✅ ORS data
};

// 🧠 SessionData
export type SessionData = {
  user?: User;
  activeRoute?: ActiveRoute;
  accessToken?: string;
  refreshToken?: string;
};

// 💡 Context shape
type SessionContextType = {
  session: SessionData | null;
  updateSession: (newData: Partial<SessionData>) => Promise<void>;
  clearSession: () => Promise<void>;
  loading: boolean;
};

// 🔗 Context init
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// 🔐 Provider
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        console.log('🚀 SessionContext: Starting session initialization');
        const stored = await AsyncStorage.getItem('session');
        console.log('🔍 SessionContext: Raw stored data:', stored);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          console.log('🔍 SessionContext: Parsed session data:', parsed);
          console.log('🔍 SessionContext: Has user:', !!parsed.user);
          console.log('🔍 SessionContext: Has accessToken:', !!parsed.accessToken);

          if (parsed.user) {
            parsed.user.bdate = new Date(parsed.user.bdate);
            parsed.user.createdOn = new Date(parsed.user.createdOn);
          }

          if (parsed.activeRoute) {
            parsed.activeRoute.createdOn = new Date(parsed.activeRoute.createdOn);
            // routeData is left as-is (geometry/distance/duration)
          }

          setSession(parsed);
          console.log('✅ SessionContext: Session loaded successfully', parsed);
        } else {
          console.log('❌ SessionContext: No stored session found - AsyncStorage is empty');
          setSession(null);
        }
      } catch (err) {
        console.error('❌ SessionContext: Failed to load session:', err);
        setSession(null);
      } finally {
        setLoading(false);
        console.log('🏁 SessionContext: Loading complete, session state:', session);
      }
    })();
  }, []);

  const updateSession = async (newData: Partial<SessionData>) => {
    try {
      const updated = { ...session, ...newData };
      setSession(updated);
      await AsyncStorage.setItem('session', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  };

  const clearSession = async () => {
    try {
      console.log('🧹 SessionContext: Clearing session...');
      setSession(null);
      await AsyncStorage.removeItem('session');
      console.log('✅ SessionContext: Session cleared successfully');
      
      // Verify session was cleared
      const verification = await AsyncStorage.getItem('session');
      console.log('🔍 SessionContext: Post-clear verification:', verification);
    } catch (err) {
      console.error('❌ SessionContext: Failed to clear session:', err);
    }
  };

  return (
    <SessionContext.Provider value={{ session, updateSession, clearSession, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

// 🎯 Hook
export const useSession = (): SessionContextType => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
