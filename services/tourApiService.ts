import { BACKEND_URL } from "@/constants/Config";

export interface Tour {
  tourID: string;
  name: string;
  description: string;
  images: string[];
  agencyID: string;
  createdOn: any;
  updatedOn: any;
  tags: string[];
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  itineraryID?: string;
  itineraryData?: {
    itineraryID: string;
    startDate: any;
    endDate: any;
    planDaily: boolean;
    locations: any[];
  };
  pricing: {
    currency: string;
    price: number;
    inclusions: string[];
    exclusions: string[];
  };
  participants: {
    maxCapacity: number;
    members: any[];
    tourGuides: any[];
  };
}

export interface CategorizedTours {
  ongoing: Tour[];
  upcoming: Tour[];
  history: Tour[];
}

/**
 * Get tours for a specific tour guide with itinerary data
 */
export const getToursByTourGuide = async (
  agencyID: string,
  userID: string,
  accessToken: string
): Promise<Tour[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${BACKEND_URL}/tours/tour-guide/${agencyID}/${userID}`,
      {
        method: 'GET',
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch tours');
    }

    const data = await response.json();
    return data.tours || [];
  } catch (error) {
    console.error('Error fetching tours for tour guide:', error);
    throw error;
  }
};

/**
 * Categorize tours based on status and dates
 */
export const categorizeTours = (tours: Tour[]): CategorizedTours => {
  const now = new Date();
  console.log('🔍 Categorizing tours. Current date:', now);
  console.log('🔍 Total tours to categorize:', tours.length);
  
  const categorized: CategorizedTours = {
    ongoing: [],
    upcoming: [],
    history: [],
  };

  tours.forEach((tour, index) => {
    console.log(`\n🔍 Tour ${index + 1}:`, {
      tourID: tour.tourID,
      name: tour.name,
      status: tour.status,
      hasItineraryData: !!tour.itineraryData
    });
    
    // History: completed or cancelled status
    if (tour.status === 'completed' || tour.status === 'cancelled') {
      console.log(`  ➡️ Categorized as HISTORY (status: ${tour.status})`);
      categorized.history.push(tour);
      return;
    }

    // Check itinerary dates if available
    if (tour.itineraryData) {
      console.log('  📅 Has itinerary data:', {
        startDate: tour.itineraryData.startDate,
        endDate: tour.itineraryData.endDate
      });
      
      const startDate = tour.itineraryData.startDate?.toDate 
        ? tour.itineraryData.startDate.toDate() 
        : new Date(tour.itineraryData.startDate);
      const endDate = tour.itineraryData.endDate?.toDate 
        ? tour.itineraryData.endDate.toDate() 
        : new Date(tour.itineraryData.endDate);

      console.log('  📅 Parsed dates:', {
        startDate,
        endDate,
        now
      });

      // Ongoing: current date is between start and end date
      if (now >= startDate && now <= endDate) {
        console.log('  ➡️ Categorized as ONGOING');
        categorized.ongoing.push(tour);
      }
      // Upcoming: start date is in the future
      else if (now < startDate) {
        console.log('  ➡️ Categorized as UPCOMING');
        categorized.upcoming.push(tour);
      }
      // Past: end date has passed
      else {
        console.log('  ➡️ Categorized as HISTORY (past end date)');
        categorized.history.push(tour);
      }
    } else {
      console.log('  ⚠️ No itinerary data, using status-based categorization');
      // If no itinerary data, categorize based on status
      if (tour.status === 'active') {
        console.log('  ➡️ Categorized as ONGOING (active status)');
        categorized.ongoing.push(tour);
      } else if (tour.status === 'draft' || tour.status === 'paused') {
        console.log('  ➡️ Categorized as UPCOMING (draft/paused status)');
        categorized.upcoming.push(tour);
      }
    }
  });

  console.log('\n✅ Categorization complete:', {
    ongoing: categorized.ongoing.length,
    upcoming: categorized.upcoming.length,
    history: categorized.history.length
  });

  return categorized;
};

/**
 * Get all active tours (for travelers)
 */
export const getAllActiveTours = async (accessToken: string): Promise<Tour[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/tours/active`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch active tours');
    }

    const data = await response.json();
    return data.tours || [];
  } catch (error) {
    console.error('Error fetching active tours:', error);
    throw error;
  }
};

/**
 * Join a tour as a member
 */
export const joinTour = async (
  tourID: string,
  userID: string,
  userName: string,
  username: string,
  profileImage: string,
  accessToken: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/tours/join/${tourID}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        userID,
        userName,
        username,
        profileImage,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to join tour');
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error('Error joining tour:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join tour',
    };
  }
};

/**
 * Get tours where user is a member
 */
export const getUserTours = async (
  userID: string,
  accessToken: string
): Promise<Tour[]> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/tours/user/${userID}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user tours');
    }

    const data = await response.json();
    return data.tours || [];
  } catch (error) {
    console.error('Error fetching user tours:', error);
    throw error;
  }
};
