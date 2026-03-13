/**
 * Top Performers Bar Chart component.
 */

import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api } from '../../services/api';

interface BotPerformance {
  bot_id: string;
  bot_name: string;
  exchange: string;
  strategy: string;
  profit_abs: number;
  profit_pct: number;
  closed_trades: number;
  win_rate: number;
}

interface TopPerformersData {
  top_performers: BotPerformance[];
  worst_performers: BotPerformance[];
  total_bots_analyzed: number;
}

export function TopPerformersChart() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio', 'top-performers'],
    queryFn: async (): Promise<TopPerformersData> => {
      const response = await api.get<TopPerformersData>('/portfolio/top-performers?limit=10');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top & Bottom Performers
        </h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top & Bottom Performers
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Unable to load performance data
        </div>
      </div>
    );
  }

  // Avoid duplicates between top and bottom lists (can happen with small bot counts or API overlap).
  const top5 = data.top_performers.slice(0, 5);
  const topIds = new Set(top5.map((b) => b.bot_id));
  const worst5 = data.worst_performers.filter((b) => !topIds.has(b.bot_id)).slice(0, 5);

  // Combine top and worst performers for chart
  const chartData = [
    ...top5.map((bot) => ({
      // Keep the full name so the user can see the complete strategy/bot identifier.
      name: bot.bot_name,
      profit_pct: bot.profit_pct,
      profit_abs: bot.profit_abs,
      win_rate: bot.win_rate * 100,
      type: 'top',
    })),
    ...worst5.map((bot) => ({
      name: bot.bot_name,
      profit_pct: bot.profit_pct,
      profit_abs: bot.profit_abs,
      win_rate: bot.win_rate * 100,
      type: 'worst',
    })),
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className={`text-sm ${Number(data.profit_pct) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Profit: {Number(data.profit_pct)?.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Win Rate: {Number(data.win_rate)?.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Top & Bottom Performers
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {data.total_bots_analyzed} bots analyzed
        </span>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            // Keep labels readable without pushing the plot too far to the right.
            margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={160}
              stroke="#9CA3AF"
              fontSize={11}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="profit_pct" name="Profit %">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={Number(entry.profit_pct) >= 0 ? '#10B981' : '#EF4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top performers list */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
            Top 5 Performers
          </h4>
          <div className="space-y-1">
            {top5.map((bot, index) => (
              <div
                key={bot.bot_id}
                className="flex items-start justify-between gap-2 text-xs"
              >
                <span className="text-gray-600 dark:text-gray-400 flex-1 min-w-0 break-words">
                  {index + 1}. {bot.bot_name}
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                  +{Number(bot.profit_pct).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
            Bottom 5 Performers
          </h4>
          <div className="space-y-1">
            {worst5.map((bot, index) => (
              <div
                key={bot.bot_id}
                className="flex items-start justify-between gap-2 text-xs"
              >
                <span className="text-gray-600 dark:text-gray-400 flex-1 min-w-0 break-words">
                  {index + 1}. {bot.bot_name}
                </span>
                <span className="text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                  {Number(bot.profit_pct).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
