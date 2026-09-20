'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchLeads, type Lead } from '../api';

export interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

export function useLeads(pollIntervalMs: number = 5000): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isInitialLoad = useRef(true);

  const refresh = useCallback(async () => {
    try {
      if (isInitialLoad.current) {
        setLoading(true);
      }
      setError(null);
      const data = await fetchLeads();
      setLeads(data.leads);
      setLastUpdated(new Date());
    } catch {
      if (isInitialLoad.current) {
        setError('Unable to connect to CRM backend.');
      }
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();

    if (pollIntervalMs > 0) {
      const interval = setInterval(() => {
        void refresh();
      }, pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [refresh, pollIntervalMs]);

  return { leads, loading, error, refresh, lastUpdated };
}
