import { BACKEND_URL } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';
import { useItinerary } from '@/context/ItineraryContext';
import { useState, useEffect } from 'react';

// New flow: Frontend → Backend → AsyncStorage
export async function saveItineraryWithNewFlow(itinerary: any, accessToken: string, saveToLocal: (backendData: any) => Promise<void>) {
  try {
    console.log('🚀 Starting itinerary save flow:', itinerary.title);
    
    // Step 1: Save to backend first
    const backendResponse = await saveItinerary(itinerary, accessToken);
    console.log('📡 Backend response:', backendResponse.success ? 'SUCCESS' : 'FAILED', backendResponse.errorMessage);
    
    if (backendResponse.success) {
      console.log('💾 Saving to AsyncStorage via context...');
      console.log('📦 Backend response data:', JSON.stringify(backendResponse.data, null, 2));
      // Step 2: Save backend response (with Firestore ID) to AsyncStorage
      await saveToLocal(backendResponse.data);
      
      return { 
        success: true, 
        errorMessage: undefined, 
        data: backendResponse.data
      };
    } else {
      return { 
        success: false, 
        errorMessage: backendResponse.errorMessage, 
        data: undefined 
      };
    }
  } catch (err: any) {
    console.error('❌ Save flow error:', err);
    return { success: false, errorMessage: err.message || 'Failed to save itinerary', data: undefined };
  }
}

export async function saveItinerary(itinerary: any, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(itinerary),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, errorMessage: undefined, data };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to save itinerary', data };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to save itinerary', data: undefined };
  }
}

// Get itineraries by user (hook version)
export function useGetItinerariesByUser() {
  const { session } = useSession();
  const userID = session?.user?.id;
  const getItineraries = async (accessToken: string) => {
    if (!userID) return { success: false, errorMessage: 'No user ID', data: undefined };
    try {
      const response = await fetch(`${BACKEND_URL}/itinerary/user/${userID}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        return { success: true, errorMessage: undefined, data: data.itineraries };
      } else {
        return { success: false, errorMessage: data.error || 'Failed to fetch itineraries', data: undefined };
      }
    } catch (err: any) {
      return { success: false, errorMessage: err.message || 'Failed to fetch itineraries', data: undefined };
    }
  };
  return getItineraries;
}

// Get itineraries by user with status filter
export async function getItinerariesByUserAndStatus(userID: string, status: string, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary/user/${userID}?status=${status}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, errorMessage: undefined, data: data.itineraries };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to fetch itineraries', data: undefined };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to fetch itineraries', data: undefined };
  }
}

// Get itinerary by ID
export async function getItinerariesById(id: string, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, errorMessage: undefined, data };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to fetch itinerary', data: undefined };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to fetch itinerary', data: undefined };
  }
}

// Delete itinerary by ID
export async function deleteItinerary(id: string, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to delete itinerary' };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to delete itinerary' };
  }
}

// Mark itinerary as completed
export async function markItineraryAsDone(id: string, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary/done/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to mark as completed' };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to mark as completed' };
  }
}

// Cancel itinerary
export async function cancelItinerary(id: string, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary/cancel/${id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to cancel itinerary' };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to cancel itinerary' };
  }
}

export async function updateItinerary(id: string, itinerary: any, accessToken: string) {
  try {
    const response = await fetch(`${BACKEND_URL}/itinerary/update/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(itinerary),
    });
    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true };
    } else {
      return { success: false, errorMessage: data.error || 'Failed to update itinerary' };
    }
  } catch (err: any) {
    return { success: false, errorMessage: err.message || 'Failed to update itinerary' };
  }
}

// Custom hook for saving itineraries with new flow: frontend → backend → AsyncStorage
export function useSaveItinerary() {
  const { session } = useSession();
  const { saveItineraryFromBackend } = useItinerary();

  const saveItineraryComplete = async (itineraryData: any) => {
    if (!session?.user?.id || !session?.accessToken) {
      return { success: false, errorMessage: 'User not authenticated' };
    }

    // Add userID to itinerary data before sending to backend
    const itineraryWithUser = {
      ...itineraryData,
      userID: session.user.id
    };

    return await saveItineraryWithNewFlow(
      itineraryWithUser,
      session.accessToken,
      saveItineraryFromBackend
    );
  };

  return { saveItineraryComplete };
}

// Hook to sync existing backend itineraries to AsyncStorage
export function useSyncItineraries() {
  const { session } = useSession();
  const { syncWithBackend } = useItinerary();

  const syncExistingItineraries = async () => {
    if (!session?.user?.id || !session?.accessToken) {
      console.log('❌ Cannot sync: User not authenticated');
      return { success: false, errorMessage: 'User not authenticated' };
    }

    try {
      console.log('🔄 Fetching existing itineraries from backend...');
      const response = await fetch(`${BACKEND_URL}/itinerary/user/${session.user.id}`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        }
      });
      
      const data = await response.json();
      if (response.ok) {
        console.log('📡 Fetched itineraries from backend:', data.itineraries?.length || 0);
        await syncWithBackend(data.itineraries || []);
        return { success: true, count: data.itineraries?.length || 0 };
      } else {
        console.error('❌ Failed to fetch itineraries:', data.error);
        return { success: false, errorMessage: data.error || 'Failed to fetch itineraries' };
      }
    } catch (err: any) {
      console.error('❌ Sync error:', err);
      return { success: false, errorMessage: err.message || 'Failed to sync itineraries' };
    }
  };

  return { syncExistingItineraries };
}

// Auto-sync hook that runs once when the app starts
export function useAutoSync() {
  const { session } = useSession();
  const { itineraries, syncWithBackend } = useItinerary();
  const [hasAutoSynced, setHasAutoSynced] = useState(false);

  useEffect(() => {
    console.log('🔍 Auto-sync effect triggered:', {
      hasSession: !!session?.user?.id,
      hasAccessToken: !!session?.accessToken,
      itinerariesCount: itineraries.length,
      hasAutoSynced,
      userID: session?.user?.id
    });

    const performAutoSync = async () => {
      // Only auto-sync if:
      // 1. User is authenticated
      // 2. No local itineraries exist
      // 3. Haven't already auto-synced this session
      if (session?.user?.id && session?.accessToken && itineraries.length === 0 && !hasAutoSynced) {
        console.log('🔄 Auto-syncing itineraries from backend...');
        setHasAutoSynced(true);
        
        try {
          const response = await fetch(`${BACKEND_URL}/itinerary/user/${session.user.id}`, {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`
            }
          });
          
          console.log('📡 Auto-sync response status:', response.status);
          const data = await response.json();
          console.log('📦 Auto-sync response data:', data);
          
          if (response.ok && data.itineraries?.length > 0) {
            console.log('📡 Auto-sync: Found', data.itineraries.length, 'itineraries');
            await syncWithBackend(data.itineraries);
          } else {
            console.log('📝 Auto-sync: No itineraries found in backend');
          }
        } catch (error) {
          console.error('❌ Auto-sync failed:', error);
        }
      } else {
        console.log('⏭️ Auto-sync skipped:', {
          reason: !session?.user?.id ? 'No user' : 
                  !session?.accessToken ? 'No token' : 
                  itineraries.length > 0 ? 'Has local itineraries' : 
                  hasAutoSynced ? 'Already synced' : 'Unknown'
        });
      }
    };

    performAutoSync();
  }, [session?.user?.id, session?.accessToken, itineraries.length, hasAutoSynced, syncWithBackend]);
}