import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from '../components/common/Toast';

interface MessageResponse {
  status: string;
  message: string;
}

export function useBotStart(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<MessageResponse>(`/bots/${botId}/start`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Bot started successfully');
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to start bot');
    },
  });
}

export function useBotStop(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<MessageResponse>(`/bots/${botId}/stop`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Bot stopped successfully');
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
      queryClient.invalidateQueries({ queryKey: ['bots'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to stop bot');
    },
  });
}

export function useBotReload(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<MessageResponse>(`/bots/${botId}/reload`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Configuration reloaded');
      queryClient.invalidateQueries({ queryKey: ['bot', botId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to reload config');
    },
  });
}

export function useBotForceExit(botId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await api.post<MessageResponse>(`/bots/${botId}/forceexit`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Force exit initiated');
      queryClient.invalidateQueries({ queryKey: ['bot', botId, 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['bot', botId, 'trades'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to force exit');
    },
  });
}

export function useBotControl(botId: string) {
  return {
    start: useBotStart(botId),
    stop: useBotStop(botId),
    reload: useBotReload(botId),
    forceExit: useBotForceExit(botId),
  };
}
