import type { HealthState } from '../../types';
import { getHealthColor } from '../../styles/theme';

interface StatusIndicatorProps {
  status: HealthState;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
}

const sizeClasses = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3',
  lg: 'w-4 h-4',
};

const labelSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  pulse = false,
}: StatusIndicatorProps) {
  const colors = getHealthColor(status);

  const statusLabels: Record<HealthState, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unreachable: 'Unreachable',
    unknown: 'Unknown',
  };

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex">
        <span
          className={`${sizeClasses[size]} ${colors.dot} rounded-full ${
            pulse && status === 'healthy' ? 'animate-pulse' : ''
          }`}
        />
        {pulse && status !== 'unreachable' && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75 animate-ping`}
          />
        )}
      </span>
      {showLabel && (
        <span className={`${labelSizeClasses[size]} ${colors.text} font-medium`}>
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: HealthState;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = getHealthColor(status);

  const labels: Record<HealthState, string> = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    unreachable: 'Unreachable',
    unknown: 'Unknown',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${colors.dot}`} />
      {labels[status]}
    </span>
  );
}
