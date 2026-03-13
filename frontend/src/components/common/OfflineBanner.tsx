/**
 * OfflineBanner - Displays a banner when network connection is lost.
 *
 * Uses browser's online/offline events to detect connection status
 * and displays a dismissable banner with retry functionality.
 */
import { useState, useEffect, useCallback } from 'react';

interface OfflineBannerProps {
  onRetry?: () => void;
  position?: 'top' | 'bottom';
  dismissable?: boolean;
}

export function OfflineBanner({
  onRetry,
  position = 'top',
  dismissable = true,
}: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDismissed, setIsDismissed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setIsDismissed(false);
      setRetryCount(0);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    onRetry?.();
  }, [onRetry]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Don't show if online or dismissed
  if (isOnline || isDismissed) {
    return null;
  }

  const positionClass = position === 'top' ? 'top-0' : 'bottom-0';

  return (
    <div
      className={`fixed ${positionClass} left-0 right-0 z-50 bg-red-600 dark:bg-red-800 text-white shadow-lg`}
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Offline Icon */}
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>

            <div className="flex-1">
              <p className="font-medium">
                You are currently offline
              </p>
              <p className="text-sm text-red-100">
                Some features may be unavailable. Data shown may be outdated.
                {retryCount > 0 && ` (Retry attempts: ${retryCount})`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Retry Button */}
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-1.5 border border-white/30 rounded-md text-sm font-medium hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <svg
                className="w-4 h-4 mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retry
            </button>

            {/* Dismiss Button */}
            {dismissable && (
              <button
                onClick={handleDismiss}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Dismiss offline banner"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to detect online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Compact connection status indicator
 */
export function ConnectionStatus() {
  const isOnline = useOnlineStatus();

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`w-2 h-2 rounded-full ${
          isOnline
            ? 'bg-green-500 animate-pulse'
            : 'bg-red-500'
        }`}
      />
      <span className={`text-xs font-medium ${
        isOnline
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      }`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}
