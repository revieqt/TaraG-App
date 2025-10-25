import { BACKEND_URL } from "@/constants/Config";

export interface ModerationLog {
  id: string;
  userID: string;
  type: 'warning' | 'ban';
  reason: string;
  message: string;
  createdOn: Date;
  endsOn: Date;
  updatedOn: Date;
  adminID: string;
}

/**
 * Get moderation log by ID
 */
export const getModerationLog = async (
  logID: string,
  accessToken: string
): Promise<ModerationLog> => {
  try {
    const response = await fetch(`${BACKEND_URL}/moderation/log/${logID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to fetch moderation log');
    }

    const data = await response.json();
    const log = data.log;

    // Parse dates
    return {
      ...log,
      createdOn: new Date(log.createdOn._seconds * 1000),
      endsOn: new Date(log.endsOn._seconds * 1000),
      updatedOn: new Date(log.updatedOn._seconds * 1000),
    };
  } catch (error: any) {
    console.error('Error fetching moderation log:', error);
    throw error;
  }
};
