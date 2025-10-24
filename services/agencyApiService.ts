import { BACKEND_URL } from "@/constants/Config";

export interface Agency {
  id?: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  createdOn?: any;
  updatedOn?: any;
}

export interface GetAgencyByIdRequest {
  agencyID: string;
}

/**
 * Get agency details by ID
 */
export const getAgencyById = async (request: GetAgencyByIdRequest, accessToken?: string): Promise<Agency> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${BACKEND_URL}/agencyAuth/agency/${request.agencyID}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      let errorMessage = 'Failed to fetch agency details';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        console.error('Non-JSON error response:', responseText.substring(0, 200));
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    // Backend returns { success: true, agency: {...} }
    return data.agency || data;
  } catch (error: any) {
    console.error('Error fetching agency:', error);
    throw error;
  }
};

/**
 * Get all agencies
 */
export const getAllAgencies = async (): Promise<Agency[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/agency`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      let errorMessage = 'Failed to fetch agencies';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        console.error('Non-JSON error response:', responseText.substring(0, 200));
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error fetching agencies:', error);
    throw error;
  }
};

/**
 * Search agencies by name or location
 */
export const searchAgencies = async (query: string): Promise<Agency[]> => {
  try {
    const response = await fetch(`${BACKEND_URL}/agency/search?q=${encodeURIComponent(query)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Get response text first, then try to parse as JSON
      const responseText = await response.text();
      let errorMessage = 'Failed to search agencies';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        console.error('Non-JSON error response:', responseText.substring(0, 200));
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Error searching agencies:', error);
    throw error;
  }
};
