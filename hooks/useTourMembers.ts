import { useState, useEffect } from 'react';
import { BACKEND_URL } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';

export interface TourMemberLocation {
  userID: string;
  username: string;
  latitude: number;
  longitude: number;
  isInAnEmergency: boolean;
  emergencyType: string;
  isSharingLocation: boolean;
  lastUpdated: number;
}

interface UseTourMembersProps {
  tourId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch tour members' locations from Firebase Realtime Database
 * Polls every 5 seconds for updates
 */
export const useTourMembers = ({ tourId, enabled = true }: UseTourMembersProps) => {
  const { session } = useSession();
  const [members, setMembers] = useState<TourMemberLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!session?.accessToken || !tourId) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/tours/get-room-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ tourId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch members');
      }

      setMembers(data.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching tour members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || !tourId) {
      return;
    }

    console.log('👥 Starting to fetch tour members for:', tourId);

    // Initial fetch
    fetchMembers();

    // Poll every 5 seconds for updates
    const interval = setInterval(() => {
      fetchMembers();
    }, 5000);

    return () => {
      console.log('👥 Stopping tour members fetch for:', tourId);
      clearInterval(interval);
    };
  }, [tourId, enabled, session?.accessToken]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
};
