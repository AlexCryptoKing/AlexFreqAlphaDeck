/**
 * Bot health panel showing connection and data source status.
 */

import { useTriggerHealthCheck } from '../../hooks/useBots';

interface HealthData {
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

interface BotHealthPanelProps {
  botId: string;
  health?: HealthData;
  isLoading: boolean;
}

function HealthIndicator({ state }: { state: string }) {
  const colors: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unreachable: 'bg-red-500',
    unknown: 'bg-gray-500',
  };

  const labels: Record<string, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unreachable: 'Unreachable',
    unknown: 'Unknown',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${colors[state] || colors.unknown} animate-pulse`}></div>
      <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
        {labels[state] || state}
      </span>
    </div>
  );
}

function SourceCard({
  name,
  available,
  successRate,
  latencyMs,
  isActive,
}: {
  name: string;
  available: boolean;
  successRate: number;
  latencyMs: number;
  isActive: boolean;
}) {
  return (
    <div className={`rounded-lg p-4 border-2 transition-colors ${
      isActive
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded">Active</span>
          )}
          <span className={`w-2.5 h-2.5 rounded-full ${
            available ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Status</span>
          <span className={available ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
            {available ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Success Rate</span>
          <span className="text-gray-900 dark:text-white">{(successRate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Avg Latency</span>
          <span className="text-gray-900 dark:text-white">{latencyMs.toFixed(0)} ms</span>
        </div>

        {/* Success rate bar */}
        <div className="mt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                successRate >= 0.9 ? 'bg-green-500' : successRate >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${successRate * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

export function BotHealthPanel({ botId, health, isLoading }: BotHealthPanelProps) {
  const triggerCheck = useTriggerHealthCheck();

  const handleRefresh = () => {
    triggerCheck.mutate(botId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
          <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Status Header */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Health Status</p>
            <HealthIndicator state={health?.health_state || 'unknown'} />
          </div>
          <button
            onClick={handleRefresh}
            disabled={triggerCheck.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {triggerCheck.isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Checking...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Source Mode</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {health?.source_mode || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active Source</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {health?.active_source || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Last Check</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(health?.last_check)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">State Changed</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(health?.state_changed_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Data Sources
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SourceCard
            name="REST API"
            available={health?.api_available || false}
            successRate={health?.api_success_rate || 0}
            latencyMs={health?.api_avg_latency_ms || 0}
            isActive={health?.active_source === 'api'}
          />
          <SourceCard
            name="SQLite Database"
            available={health?.sqlite_available || false}
            successRate={health?.sqlite_success_rate || 0}
            latencyMs={health?.sqlite_avg_latency_ms || 0}
            isActive={health?.active_source === 'sqlite'}
          />
        </div>
      </div>

      {/* Health Info */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          About Health Monitoring
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          The dashboard monitors your bot's health by tracking API and SQLite connectivity.
          When the API becomes unavailable, it automatically falls back to SQLite for read operations.
          The health state is determined by success rates and latency thresholds.
        </p>
        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <strong>Healthy:</strong> Primary source working normally
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <strong>Degraded:</strong> Using fallback source or high latency
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <strong>Unreachable:</strong> No data sources available
          </li>
        </ul>
      </div>
    </div>
  );
}
