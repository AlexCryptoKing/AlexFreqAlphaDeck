/**
 * Mini sparkline chart for bot cards.
 * Shows cumulative profit over recent closed trades.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Trade } from '../../types';

interface SparklineChartProps {
  botId: string;
  data?: number[];
  color?: 'green' | 'red' | 'blue' | 'auto';
}

export function SparklineChart({
  botId,
  data,
  color = 'auto',
}: SparklineChartProps) {
  // Fetch recent closed trades for this bot
  const { data: trades, isLoading } = useQuery({
    queryKey: ['bot', botId, 'trades', 'sparkline'],
    queryFn: async (): Promise<Trade[]> => {
      const response = await api.get<Trade[]>(`/bots/${botId}/trades?is_open=false&limit=30`);
      return response.data;
    },
    enabled: !data, // Only fetch if no data provided
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 60000,
  });

  // Calculate cumulative profit data from trades
  const chartData = useMemo(() => {
    // If data is provided externally, use it
    if (data) return data;

    // If no trades, return empty
    if (!trades || trades.length === 0) return [];

    // Sort trades by close date and calculate cumulative profit
    const sortedTrades = [...trades]
      .filter(t => !t.is_open && t.close_date && t.close_profit_abs !== undefined)
      .sort((a, b) => new Date(a.close_date!).getTime() - new Date(b.close_date!).getTime());

    if (sortedTrades.length === 0) return [];

    // Build cumulative profit array
    let cumulative = 0;
    const cumulativeData: number[] = [0]; // Start at 0

    sortedTrades.forEach(trade => {
      cumulative += trade.close_profit_abs || 0;
      cumulativeData.push(cumulative);
    });

    return cumulativeData;
  }, [data, trades]);

  // Show loading state
  if (isLoading && !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-xs">
        <span className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          No closed trades yet
        </span>
      </div>
    );
  }

  // Need at least 2 points to draw a line
  if (chartData.length === 1) {
    const value = chartData[0];
    return (
      <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs">
        <span className={`font-medium ${value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)} USDT
        </span>
        <span className="ml-1 text-gray-400">(1 trade)</span>
      </div>
    );
  }

  const min = Math.min(...chartData);
  const max = Math.max(...chartData);
  const range = max - min || 1;
  const currentValue = chartData[chartData.length - 1];

  // Determine color based on trend
  const trend = chartData[chartData.length - 1] - chartData[0];
  let strokeColor = 'stroke-blue-500';

  if (color === 'auto') {
    strokeColor = trend >= 0 ? 'stroke-green-500' : 'stroke-red-500';
  } else if (color === 'green') {
    strokeColor = 'stroke-green-500';
  } else if (color === 'red') {
    strokeColor = 'stroke-red-500';
  }

  // Build SVG path
  const width = 200;
  const height = 40;
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = chartData.map((value, index) => {
    const x = padding + (index / (chartData.length - 1)) * chartWidth;
    const y = padding + (1 - (value - min) / range) * chartHeight;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;

  // Create gradient fill path
  const fillPoints = [
    `${padding},${height - padding}`,
    ...points,
    `${width - padding},${height - padding}`,
  ];
  const fillPath = `M ${fillPoints.join(' L ')} Z`;

  // Format tooltip text
  const tooltipText = `Cumulative: ${currentValue >= 0 ? '+' : ''}${currentValue.toFixed(2)} USDT (${chartData.length - 1} trades)`;

  return (
    <div className="relative h-full group" title={tooltipText}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`gradient-${botId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop
            offset="0%"
            className={
              trend >= 0 ? 'stop-color-green-500' : 'stop-color-red-500'
            }
            style={{
              stopColor:
                trend >= 0
                  ? 'rgb(34, 197, 94)'
                  : 'rgb(239, 68, 68)',
              stopOpacity: 0.3,
            }}
          />
          <stop
            offset="100%"
            className={
              trend >= 0 ? 'stop-color-green-500' : 'stop-color-red-500'
            }
            style={{
              stopColor:
                trend >= 0
                  ? 'rgb(34, 197, 94)'
                  : 'rgb(239, 68, 68)',
              stopOpacity: 0,
            }}
          />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path d={fillPath} fill={`url(#gradient-${botId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        className={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="3"
          className={trend >= 0 ? 'fill-green-500' : 'fill-red-500'}
        />
      )}
      </svg>
      {/* Hover tooltip showing current value */}
      <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`text-xs font-medium px-1 rounded ${
          currentValue >= 0
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        }`}>
          {currentValue >= 0 ? '+' : ''}{currentValue.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
