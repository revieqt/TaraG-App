import { BACKEND_URL } from '../constants/Config';
import { useSession } from '../context/SessionContext';
import { router } from 'expo-router';

export interface TaraBuddyPreference {
  gender: string;
  maxDistance: number;
  ageRange: number[];
  zodiac?: string[];
  likedUsers?: string[];
}

export const useTaraBuddyApi = () => {
  const { session, updateSession } = useSession();
  const token = session?.accessToken;
  const userID = session?.user?.id;

  if (!token || !userID) {
    throw new Error('No authenticated session found');
  }

  const createTaraBuddyProfile = async (): Promise<TaraBuddyPreference> => {
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

  return {
    createTaraBuddyProfile,
    updateGenderPreference,
    updateMaxDistancePreference,
    updateAgePreference,
    updateZodiacPreference,
    disableTaraBuddyProfile,
  };
};