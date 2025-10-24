import { useState, useEffect } from 'react';
import { BACKEND_URL } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';

export interface GroupMemberLocation {
  userID: string;
  username: string;
  latitude: number;
  longitude: number;
  isInAnEmergency: boolean;
  emergencyType: string;
  isSharingLocation: boolean;
  lastUpdated: number;
}

interface UseGroupMembersProps {
  groupId: string;
  enabled?: boolean;
}

/**
 * Hook to fetch group members' locations from Firebase Realtime Database
 * Polls every 5 seconds for updates
 */
export const useGroupMembers = ({ groupId, enabled = true }: UseGroupMembersProps) => {
  const { session } = useSession();
  const [members, setMembers] = useState<GroupMemberLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!session?.accessToken || !groupId) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/groups/get-room-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ groupId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch members');
      }

      setMembers(data.data || []);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching group members:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled || !groupId) {
      return;
    }

    console.log('👥 Starting to fetch group members for:', groupId);

    // Initial fetch
    fetchMembers();

    // Poll every 5 seconds for updates
    const interval = setInterval(() => {
      fetchMembers();
    }, 5000);

    return () => {
      console.log('👥 Stopping group members fetch for:', groupId);
      clearInterval(interval);
    };
  }, [groupId, enabled, session?.accessToken]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers,
  };
};
