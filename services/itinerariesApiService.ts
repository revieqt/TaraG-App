import { BACKEND_URL } from '@/constants/Config';
import { useSession } from '@/context/SessionContext';

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