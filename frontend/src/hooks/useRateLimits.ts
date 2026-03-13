import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '../services/api';

export interface ActiveRateLimit {
  bot_id: string;
  bot_name: string;
  exchange: string | null;
  context: string;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  age_seconds: number;
}

interface RateLimitData {
  count: number;
  has_active: boolean;
  alerts: ActiveRateLimit[];
}

export function useRateLimits() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alerts', 'rate-limits'],
    queryFn: async (): Promise<RateLimitData> => {
      const response = await api.get<RateLimitData>('/alerts/rate-limits');
      return response.data;
    },
    refetchInterval: 10000, // Check every 10 seconds for live updates
    staleTime: 5000,
  });

  // Listen for WebSocket rate limit events
  useEffect(() => {
    const handleRateLimitChange = () => {
      // Invalidate query to refresh data
      queryClient.invalidateQueries({ queryKey: ['alerts', 'rate-limits'] });
    };

    // Listen for both new alerts and cleared alerts
    window.addEventListener('rate_limit_alert' as any, handleRateLimitChange);
    window.addEventListener('rate_limit_cleared' as any, handleRateLimitChange);

    return () => {
      window.removeEventListener('rate_limit_alert' as any, handleRateLimitChange);
      window.removeEventListener('rate_limit_cleared' as any, handleRateLimitChange);
    };
  }, [queryClient]);

  return {
    rateLimits: query.data,
    activeAlerts: query.data?.alerts ?? [],
    hasActiveRateLimits: query.data?.has_active ?? false,
    rateLimitCount: query.data?.count ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
