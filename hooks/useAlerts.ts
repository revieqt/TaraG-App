import { useState, useEffect } from 'react';
import { BACKEND_URL } from '@/constants/Config';

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  startOn: string;
  endOn: string;
  locations: string[];
  target: 'traveler' | 'tourGuide' | 'everyone';
  createdOn?: string;
}

interface UserLocation {
  suburb?: string;
  city?: string;
  town?: string;
  state?: string;
  region?: string;
  country?: string;
}

interface AlertsResponse {
  success: boolean;
  alerts: Alert[];
  count: number;
}

export const useAlerts = (userLocation: UserLocation) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if we have at least one location field
      const locationFields = [
        userLocation.suburb,
        userLocation.city,
        userLocation.town,
        userLocation.state,
        userLocation.region,
        userLocation.country
      ];

      if (!locationFields.some(field => field)) {
        setError('No location data available');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/alerts/latest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userLocation),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AlertsResponse = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts);
      } else {
        setError('Failed to fetch alerts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [userLocation]);

  const refreshAlerts = () => {
    fetchAlerts();
  };

  return {
    alerts,
    loading,
    error,
    refreshAlerts,
  };
};
