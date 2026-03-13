import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BotFilters } from '../types';

interface BotStore {
  // Filter state
  filters: BotFilters;
  setFilter: <K extends keyof BotFilters>(key: K, value: BotFilters[K]) => void;
  setFilters: (filters: Partial<BotFilters>) => void;
  clearFilters: () => void;

  // View state
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;

  // Sort state
  sortBy: 'name' | 'profit' | 'health' | 'exchange' | 'strategy';
  sortOrder: 'asc' | 'desc';
  setSortBy: (sortBy: BotStore['sortBy']) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;

  // Selected bot state
  selectedBotId: string | null;
  setSelectedBotId: (id: string | null) => void;

  // Expanded card state (for mobile)
  expandedCards: Set<string>;
  toggleCardExpanded: (id: string) => void;
}

const defaultFilters: BotFilters = {
  environment: undefined,
  health_state: undefined,
  exchange: undefined,
  strategy: undefined,
  tags: undefined,
  search: undefined,
};

export const useBotStore = create<BotStore>()(
  persist(
    (set) => ({
      // Filter state
      filters: defaultFilters,

      setFilter: (key, value) =>
        set((state) => ({
          filters: {
            ...state.filters,
            [key]: value,
          },
        })),

      setFilters: (filters) =>
        set((state) => ({
          filters: {
            ...state.filters,
            ...filters,
          },
        })),

      clearFilters: () => set({ filters: defaultFilters }),

      // View state
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),

      // Sort state
      sortBy: 'name',
      sortOrder: 'asc',
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),

      // Selected bot state
      selectedBotId: null,
      setSelectedBotId: (id) => set({ selectedBotId: id }),

      // Expanded cards
      expandedCards: new Set(),
      toggleCardExpanded: (id) =>
        set((state) => {
          const newExpanded = new Set(state.expandedCards);
          if (newExpanded.has(id)) {
            newExpanded.delete(id);
          } else {
            newExpanded.add(id);
          }
          return { expandedCards: newExpanded };
        }),
    }),
    {
      name: 'freqtrade-bot-store',
      partialize: (state) => ({
        filters: state.filters,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);

// Selector hooks for specific state slices
export const useBotFilters = () => useBotStore((state) => state.filters);
export const useViewMode = () => useBotStore((state) => state.viewMode);
export const useSortConfig = () =>
  useBotStore((state) => ({ sortBy: state.sortBy, sortOrder: state.sortOrder }));

// Filter helper functions
export function getActiveFilterCount(filters: BotFilters): number {
  let count = 0;
  if (filters.environment) count++;
  if (filters.health_state) count++;
  if (filters.exchange) count++;
  if (filters.strategy) count++;
  if (filters.tags?.length) count++;
  if (filters.search) count++;
  return count;
}

export function filterBots<T extends { name: string }>(
  bots: T[],
  search?: string
): T[] {
  if (!search) return bots;

  const lowerSearch = search.toLowerCase();
  return bots.filter((bot) => bot.name.toLowerCase().includes(lowerSearch));
}
