import { useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBots } from '../../hooks/useBots';
import { useTopPerformers } from '../../hooks/usePortfolio';
import { useBotStore, filterBots, getActiveFilterCount } from '../../store/botStore';
import { BotCard } from '../BotCard/BotCard';
import { BotGridSkeleton } from '../common/Skeleton';
import type { Bot, HealthState } from '../../types';

// Threshold for enabling virtual scrolling
const VIRTUAL_SCROLL_THRESHOLD = 50;

// Sorting functions
function sortBots(
  bots: Bot[],
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  profitData?: Map<string, number>
): Bot[] {
  const sorted = [...bots].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'profit':
        if (profitData) {
          const profitA = profitData.get(a.id) ?? 0;
          const profitB = profitData.get(b.id) ?? 0;
          comparison = profitA - profitB;
        } else {
          comparison = 0;
        }
        break;
      case 'health':
        const healthOrder: Record<HealthState, number> = {
          healthy: 0,
          degraded: 1,
          unreachable: 2,
          unknown: 3,
        };
        comparison = healthOrder[a.health_state] - healthOrder[b.health_state];
        break;
      case 'exchange':
        comparison = (a.exchange || '').localeCompare(b.exchange || '');
        break;
      case 'strategy':
        comparison = (a.strategy || '').localeCompare(b.strategy || '');
        break;
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

export function BotGrid() {
  const { filters, viewMode, sortBy, sortOrder, expandedCards, toggleCardExpanded } =
    useBotStore();
  const { data: bots, isLoading, isError, error } = useBots(filters);

  // Fetch top performers for profit sorting (backend max is 50)
  const { data: topPerformers } = useTopPerformers('profit_abs', 50);

  // Create profit data map from top performers
  const profitData = useMemo(() => {
    if (!topPerformers) return undefined;
    const map = new Map<string, number>();
    [...topPerformers.top_performers, ...topPerformers.worst_performers].forEach(bot => {
      map.set(bot.bot_id, bot.profit_abs);
    });
    return map;
  }, [topPerformers]);

  // Apply search filter and sorting
  const filteredBots = useMemo(() => {
    if (!bots) return [];
    const searched = filterBots(bots, filters.search);
    return sortBots(searched, sortBy, sortOrder, sortBy === 'profit' ? profitData : undefined);
  }, [bots, filters.search, sortBy, sortOrder, profitData]);

  if (isLoading) {
    return <BotGridSkeleton count={6} />;
  }

  if (isError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">
          Failed to load bots: {(error as Error)?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!filteredBots.length) {
    const hasFilters = getActiveFilterCount(filters) > 0;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          No bots found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {hasFilters
            ? 'Try adjusting your filters'
            : 'No bots have been discovered yet. Trigger a discovery scan or wait for the next automatic scan.'}
        </p>
      </div>
    );
  }

  // Use virtual scrolling for large lists
  const useVirtual = filteredBots.length >= VIRTUAL_SCROLL_THRESHOLD;

  // List view
  if (viewMode === 'list') {
    if (useVirtual) {
      return (
        <VirtualList
          bots={filteredBots}
        />
      );
    }

    return (
      <div className="space-y-4">
        {filteredBots.map((bot) => (
          <BotCard
            key={bot.id}
            bot={bot}
            isExpanded={true}
          />
        ))}
      </div>
    );
  }

  // Grid view (default)
  if (useVirtual) {
    return (
      <VirtualGrid
        bots={filteredBots}
        expandedCards={expandedCards}
        onToggleExpand={toggleCardExpanded}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {filteredBots.map((bot) => (
        <BotCard
          key={bot.id}
          bot={bot}
          isExpanded={expandedCards.has(bot.id)}
          onToggleExpand={() => toggleCardExpanded(bot.id)}
        />
      ))}
    </div>
  );
}

/**
 * Virtual scrolling grid for large bot lists (50+)
 */
interface VirtualGridProps {
  bots: Bot[];
  expandedCards: Set<string>;
  onToggleExpand: (id: string) => void;
}

function VirtualGrid({ bots, expandedCards, onToggleExpand }: VirtualGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate columns based on viewport width
  const getColumnCount = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1280) return 2;
    return 3;
  }, []);

  const columnCount = getColumnCount();
  const rowCount = Math.ceil(bots.length / columnCount);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280, // Estimated card height
    overscan: 2,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columnCount;
          const rowBots = bots.slice(startIndex, startIndex + columnCount);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 px-1"
            >
              {rowBots.map((bot) => (
                <BotCard
                  key={bot.id}
                  bot={bot}
                  isExpanded={expandedCards.has(bot.id)}
                  onToggleExpand={() => onToggleExpand(bot.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Virtual scrolling list for large bot lists (50+)
 */
interface VirtualListProps {
  bots: Bot[];
}

function VirtualList({ bots }: VirtualListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: bots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Estimated list item height
    overscan: 5,
  });

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const bot = bots[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="pb-4"
            >
              <BotCard
                bot={bot}
                isExpanded={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
