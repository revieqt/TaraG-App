import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState, useRef } from 'react';
import { refreshAccessToken } from '@/services/authApiService';

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
  lastKnownLocation: {
    latitude: number | null;
    longitude: number | null;
    updatedAt: Date | null;
  };
  safetyState: {
    isInAnEmergency: boolean;
    emergencyType: string;
    logID?: string;
  };
  publicSettings: {
    isProfilePublic: boolean;
    isTravelInfoPublic: boolean;
    isPersonalInfoPublic: boolean;
  };
/** 🍐 TaraBuddy preferences */
  taraBuddyPreference?: {
    gender: string;
    maxDistance: number;
    ageRange: number[];
    zodiac?: string[];
    likedUsers?: string[];
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
  location: { latitude: number; longitude: number; locationName: string }[];//start point, waypoints, and endpoint
  mode: string;//transport mode
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
  refreshToken: () => Promise<boolean>;
};

// 🔧 Helper functions for JWT handling
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

const isTokenExpired = (token: string): boolean => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const bufferTime = 300; // 5 minutes buffer before expiration
  
  return decoded.exp < (currentTime + bufferTime);
};

// 🔗 Context init
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// 🔐 Provider
export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('session');
        
        if (stored) {
          const parsed = JSON.parse(stored);

          if (parsed.user) {
            parsed.user.bdate = new Date(parsed.user.bdate);
            parsed.user.createdOn = new Date(parsed.user.createdOn);
            if (parsed.user.lastKnownLocation?.updatedAt) {
              parsed.user.lastKnownLocation.updatedAt = new Date(parsed.user.lastKnownLocation.updatedAt);
            }
          }

          if (parsed.activeRoute) {
            parsed.activeRoute.createdOn = new Date(parsed.activeRoute.createdOn);
            // routeData is left as-is (geometry/distance/duration)
          }

          setSession(parsed);
        } else {
          setSession(null);
        }
      } catch (err) {
        setSession(null);
      } finally {
        setLoading(false);
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
      // Clear any pending refresh timeout
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      
      setSession(null);
      await AsyncStorage.removeItem('session');
      
      // Verify session was cleared
      const verification = await AsyncStorage.getItem('session');
    } catch (err) {
    }
  };

  const handleTokenRefresh = async (): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log('🔄 Token refresh already in progress, skipping...');
      return false;
    }

    if (!session?.refreshToken) {
      console.log('❌ No refresh token available');
      await clearSession();
      return false;
    }

    try {
      isRefreshingRef.current = true;
      console.log('🔄 Refreshing access token...');
      
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = 
        await refreshAccessToken(session.refreshToken);
      
      const updatedSession = {
        ...session,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
      
      setSession(updatedSession);
      await AsyncStorage.setItem('session', JSON.stringify(updatedSession));
      
      console.log('✅ Token refreshed successfully');
      scheduleTokenRefresh(newAccessToken);
      
      return true;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      await clearSession();
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const scheduleTokenRefresh = (accessToken: string) => {
    if (!accessToken) return;
    
    const decoded = decodeJWT(accessToken);
    if (!decoded || !decoded.exp) return;
    
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = decoded.exp;
    const refreshTime = expirationTime - 600; // Refresh 10 minutes before expiration
    const timeUntilRefresh = Math.max(0, (refreshTime - currentTime) * 1000);
    
    // Clear existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    console.log(`⏰ Scheduling token refresh in ${Math.floor(timeUntilRefresh / 1000 / 60)} minutes`);
    
    refreshTimeoutRef.current = setTimeout(() => {
      handleTokenRefresh();
    }, timeUntilRefresh);
  };

  // Add useEffect to schedule token refresh when session loads
  useEffect(() => {
    if (session?.accessToken && !loading) {
      // Check if token is already expired
      if (isTokenExpired(session.accessToken)) {
        console.log('🔄 Access token expired on load, refreshing...');
        handleTokenRefresh();
      } else {
        // Schedule refresh for later
        scheduleTokenRefresh(session.accessToken);
      }
    }
  }, [session?.accessToken, loading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SessionContext.Provider value={{ 
      session, 
      updateSession, 
      clearSession, 
      loading, 
      refreshToken: handleTokenRefresh 
    }}>
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
