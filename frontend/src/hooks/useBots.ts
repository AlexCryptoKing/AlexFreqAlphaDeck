import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Bot, BotFilters, BotUpdateRequest, BotMetrics } from '../types';

// Extended bot type with additional detail fields
export interface BotDetail extends Bot {
  container_id?: string;
  user_data_path?: string;
  discovered_at: string;
  created_at: string;
}

// Health data type
export interface HealthData {
  bot_id: string;
  health_state: string;
  source_mode: string;
  active_source: string;
  api_available: boolean;
  sqlite_available: boolean;
  api_success_rate: number;
  sqlite_success_rate: number;
  api_avg_latency_ms: number;
  sqlite_avg_latency_ms: number;
  last_check?: string;
  state_changed_at?: string;
}

// Build query string from filters
function buildQueryParams(filters?: BotFilters): string {
  if (!filters) return '';

  const params = new URLSearchParams();

  if (filters.environment) params.append('environment', filters.environment);
  if (filters.health_state) params.append('health_state', filters.health_state);
  if (filters.exchange) params.append('exchange', filters.exchange);
  if (filters.strategy) params.append('strategy', filters.strategy);
  if (filters.tags?.length) {
    filters.tags.forEach((tag) => params.append('tags', tag));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export function useBots(filters?: BotFilters) {
  return useQuery({
    queryKey: ['bots', filters],
    queryFn: async (): Promise<Bot[]> => {
      const queryParams = buildQueryParams(filters);
      const response = await api.get<Bot[]>(`/bots${queryParams}`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useBot(botId: string) {
  return useQuery({
    queryKey: ['bot', botId],
    queryFn: async (): Promise<BotDetail> => {
      const response = await api.get<BotDetail>(`/bots/${botId}`);
      return response.data;
    },
    enabled: !!botId,
  });
}

export function useBotMetrics(botId: string) {
  return useQuery({
    queryKey: ['bot', botId, 'metrics'],
    queryFn: async (): Promise<BotMetrics> => {
      const response = await api.get<BotMetrics>(`/bots/${botId}/metrics`);
      return response.data;
    },
    enabled: !!botId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useBotHealth(botId: string) {
  return useQuery({
    queryKey: ['bot', botId, 'health'],
    queryFn: async (): Promise<HealthData> => {
      const response = await api.get<HealthData>(`/bots/${botId}/health`);
      return response.data;
    },
    enabled: !!botId,
    refetchInterval: 30000,
  });
}

export function useUpdateBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      botId,
      update,
    }: {
      botId: string;
      update: BotUpdateRequest;
    }): Promise<BotDetail> => {
      const response = await api.patch<BotDetail>(`/bots/${botId}`, update);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
      queryClient.invalidateQueries({ queryKey: ['bot', variables.botId] });
    },
  });
}

export function useDeleteBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (botId: string) => {
      await api.delete(`/bots/${botId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
}

export function useTriggerHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (botId: string): Promise<HealthData> => {
      const response = await api.post<HealthData>(`/bots/${botId}/health/check`);
      return response.data;
    },
    onSuccess: (_data, botId) => {
      queryClient.invalidateQueries({ queryKey: ['bot', botId, 'health'] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
  });
}

// Bot status type from Freqtrade API
export interface BotStatus {
  state: string;  // running, stopped, etc.
  strategy?: string;
  exchange?: string;
  trading_mode?: string;
  is_dryrun: boolean;
  version?: string;
}

export function useBotStatus(botId: string, apiAvailable: boolean) {
  return useQuery({
    queryKey: ['bot', botId, 'status'],
    queryFn: async (): Promise<BotStatus> => {
      const response = await api.get<BotStatus>(`/bots/${botId}/status`);
      return response.data;
    },
    enabled: !!botId && apiAvailable,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1,
  });
}
