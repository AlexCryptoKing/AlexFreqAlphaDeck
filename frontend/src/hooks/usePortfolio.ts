import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  PortfolioSummary,
  ExchangeBreakdown,
  StrategyBreakdown,
} from '../types';

// Top performer bot with profit data
export interface TopPerformerBot {
  bot_id: string;
  bot_name: string;
  exchange?: string;
  strategy?: string;
  profit_abs: number;
  profit_pct: number;
  closed_trades: number;
  win_rate: number;
  data_source: string;
}

interface TopPerformersResponse {
  top_performers: TopPerformerBot[];
  worst_performers: TopPerformerBot[];
  total_bots_analyzed: number;
}

// Note: api.get<T>() returns Promise<{status: string, data: T}>
// So we use response.data to get the actual data

export function usePortfolioSummary() {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: async (): Promise<PortfolioSummary> => {
      const response = await api.get<PortfolioSummary>('/portfolio/summary');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useExchangeBreakdown() {
  return useQuery({
    queryKey: ['portfolio', 'by-exchange'],
    queryFn: async (): Promise<ExchangeBreakdown[]> => {
      const response = await api.get<ExchangeBreakdown[]>('/portfolio/by-exchange');
      return response.data;
    },
    refetchInterval: 30000,
  });
}

export function useStrategyBreakdown() {
  return useQuery({
    queryKey: ['portfolio', 'by-strategy'],
    queryFn: async (): Promise<StrategyBreakdown[]> => {
      const response = await api.get<StrategyBreakdown[]>('/portfolio/by-strategy');
      return response.data;
    },
    refetchInterval: 30000,
  });
}

export function useTopPerformers(sortBy: 'profit_pct' | 'profit_abs' | 'win_rate' = 'profit_pct', limit: number = 50) {
  return useQuery({
    queryKey: ['portfolio', 'top-performers', sortBy, limit],
    queryFn: async (): Promise<TopPerformersResponse> => {
      const response = await api.get<TopPerformersResponse>(
        `/portfolio/top-performers?sort_by=${sortBy}&limit=${limit}`
      );
      return response.data;
    },
    refetchInterval: 30000,
  });
}

export function usePortfolio() {
  const summary = usePortfolioSummary();
  const exchanges = useExchangeBreakdown();
  const strategies = useStrategyBreakdown();

  return {
    summary,
    exchanges,
    strategies,
    isLoading: summary.isLoading || exchanges.isLoading || strategies.isLoading,
    isError: summary.isError || exchanges.isError || strategies.isError,
    refetch: () => {
      summary.refetch();
      exchanges.refetch();
      strategies.refetch();
    },
  };
}
