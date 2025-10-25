import { BACKEND_URL } from "@/constants/Config";

export interface Agency {
  id?: string;
  name: string;
  type?: string;
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

    const response = await fetch(`${BACKEND_URL}/agency-auth/agency/${request.agencyID}`, {
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

/**
 * Check if agency ID exists
 */
export const checkAgencyIdExists = async (
  agencyID: string,
  accessToken: string
): Promise<{ exists: boolean; agency?: any }> => {
  try {
    console.log('🌐 Calling API:', `${BACKEND_URL}/agency-auth/check-agency/${agencyID}`);
    console.log('🔑 Using token:', accessToken ? 'Present' : 'Missing');
    
    const response = await fetch(`${BACKEND_URL}/agency-auth/check-agency/${agencyID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', response.headers);

    // Get response text first to see what we're actually receiving
    const responseText = await response.text();
    console.log('📄 Response text (first 200 chars):', responseText.substring(0, 200));

    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      console.error('📄 Full response text:', responseText);
      throw new Error('Server returned invalid JSON response');
    }

    if (!response.ok) {
      if (response.status === 404) {
        return { exists: false };
      }
      throw new Error(data.error || 'Failed to check agency ID');
    }

    return {
      exists: data.exists,
      agency: data.agency,
    };
  } catch (error: any) {
    console.error('Error checking agency ID:', error);
    throw error;
  }
};

/**
 * Apply as tour guide to an existing agency
 */
export const applyAsTourGuide = async (
  agencyID: string,
  businessContactNumber: string,
  businessEmail: string,
  documents: Array<{ uri: string; name: string; type?: string }>,
  accessToken: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('agencyID', agencyID);
    formData.append('businessContactNumber', businessContactNumber);
    formData.append('businessEmail', businessEmail);

    // Append documents
    for (const doc of documents) {
      const file: any = {
        uri: doc.uri,
        name: doc.name,
        type: doc.type || 'application/octet-stream',
      };
      formData.append('documents', file);
    }

    const response = await fetch(`${BACKEND_URL}/agency-auth/apply-tour-guide`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit tour guide application');
    }

    return {
      success: data.success,
      message: data.message,
    };
  } catch (error: any) {
    console.error('Error applying as tour guide:', error);
    throw error;
  }
};
