import { useState, useCallback } from 'react';
import { BACKEND_URL } from "@/constants/Config";

export type DocumentSection = {
  subtitle: string;
  description: string;
};

export type DocumentData = {
  title: string;
  description: string;
  updatedOn: string;
  sections: DocumentSection[];
};

export function useDocument() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocument = useCallback(async (docName: any): Promise<DocumentData> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/public/${docName}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${docName} document`);
      }
      const data: DocumentData = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${docName}`;
      setError(errorMessage);
      console.error(`[useDocument] Error fetching ${docName}:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchDocument,
    loading,
    error,
  };
}
