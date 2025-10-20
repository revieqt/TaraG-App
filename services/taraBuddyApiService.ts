import { BACKEND_URL } from '../constants/Config';
import { useSession } from '../context/SessionContext';
import { router } from 'expo-router';

export interface TaraBuddyPreference {
  gender: string;
  maxDistance: number;
  ageRange: number[];
  zodiac?: string[];
}

export interface PotentialMatch {
  id: string;
  fname: string;
  mname?: string;
  lname: string;
  username: string;
  profileImage: string;
  bio?: string;
  age: number;
  zodiac: string;
  gender: string;
}

export interface LikeResult {
  matched: boolean;
  groupId?: string;
}

export const useTaraBuddyApi = () => {
  const { session, updateSession } = useSession();
  const token = session?.accessToken;
  const userID = session?.user?.id;

  const createTaraBuddyProfile = async (): Promise<TaraBuddyPreference> => {
    if (!token || !userID) {
      throw new Error('No authenticated session found');
    }
    
    const response = await fetch(`${BACKEND_URL}/taraBuddy/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userID }),
    });
    const result = await response.json();
    const pref: TaraBuddyPreference = result.data;
    await updateSession({
      user: {
        ...(session.user as any),
        taraBuddyPreference: pref,
      },
    });
    return pref;
  };

  const updateGenderPreference = async (gender: string): Promise<TaraBuddyPreference> => {
    const response = await fetch(`${BACKEND_URL}/taraBuddy/gender`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userID, gender }),
    });
    const result = await response.json();
    const pref: TaraBuddyPreference = result.data;
    await updateSession({
      user: {
        ...(session.user as any),
        taraBuddyPreference: {
          ...(session.user!.taraBuddyPreference!),
          gender: pref.gender,
        },
      },
    });
    return pref;
  };

  const updateMaxDistancePreference = async (maxDistance: number): Promise<TaraBuddyPreference> => {
    const response = await fetch(`${BACKEND_URL}/taraBuddy/distance`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userID, maxDistance }),
    });
    const result = await response.json();
    const pref: TaraBuddyPreference = result.data;
    await updateSession({
      user: {
        ...(session.user as any),
        taraBuddyPreference: {
          ...(session.user!.taraBuddyPreference!),
          maxDistance: pref.maxDistance,
        },
      },
    });
    return pref;
  };

  const updateAgePreference = async (ageRange: [number, number]): Promise<TaraBuddyPreference> => {
    const response = await fetch(`${BACKEND_URL}/taraBuddy/age`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userID, ageRange }),
    });
    const result = await response.json();
    const pref: TaraBuddyPreference = result.data;
    await updateSession({
      user: {
        ...(session.user as any),
        taraBuddyPreference: {
          ...(session.user!.taraBuddyPreference!),
          ageRange: pref.ageRange,
        },
      },
    });
    return pref;
  };

  const updateZodiacPreference = async (zodiac: string[]): Promise<TaraBuddyPreference> => {
    const response = await fetch(`${BACKEND_URL}/taraBuddy/zodiac`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userID, zodiac }),
    });
    const result = await response.json();
    const pref: TaraBuddyPreference = result.data;
    await updateSession({
      user: {
        ...(session.user as any),
        taraBuddyPreference: {
          ...(session.user!.taraBuddyPreference!),
          zodiac: pref.zodiac,
        },
      },
    });
    return pref;
  };

  const disableTaraBuddyProfile = async (): Promise<void> => {
    const response = await fetch(`${BACKEND_URL}/taraBuddy/disable`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userID }),
    });
    if (!response.ok) {
      throw new Error('Failed to disable TaraBuddy profile');
    }
    // Remove preference locally
    await updateSession({
      user: {
        ...(session.user as any),
        taraBuddyPreference: undefined,
      },
    });
    // Redirect to home
    router.replace('/(tabs)/home');
  };

  const getPotentialMatches = async (): Promise<PotentialMatch[]> => {
    if (!token || !userID) {
      throw new Error('No authenticated session found');
    }
    
    const response = await fetch(`${BACKEND_URL}/taraBuddy/potential-matches`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch potential matches');
    }
    
    const result = await response.json();
    return result.data;
  };

  const likeUser = async (likedID: string): Promise<LikeResult> => {
    if (!token || !userID) {
      throw new Error('No authenticated session found');
    }
    
    const response = await fetch(`${BACKEND_URL}/taraBuddy/like-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ likedID }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to like user');
    }
    
    const result = await response.json();
    return {
      matched: result.matched,
      groupId: result.groupId
    };
  };

  const passUser = async (passedID: string): Promise<void> => {
    if (!token || !userID) {
      throw new Error('No authenticated session found');
    }
    
    const response = await fetch(`${BACKEND_URL}/taraBuddy/pass-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ passedID }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to pass user');
    }
  };

  return {
    createTaraBuddyProfile,
    updateGenderPreference,
    updateMaxDistancePreference,
    updateAgePreference,
    updateZodiacPreference,
    disableTaraBuddyProfile,
    getPotentialMatches,
    likeUser,
    passUser,
  };
};