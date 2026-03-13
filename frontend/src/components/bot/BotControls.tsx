/**
 * Bot control actions component (Start/Stop/Reload/Force Exit).
 */

import { useState } from 'react';
import { useBotControl } from '../../hooks/useBotControl';

interface BotControlsProps {
  botId: string;
  botState?: string;
  hasOpenTrades?: boolean;
  apiAvailable?: boolean;
}

export function BotControls({ botId, botState, hasOpenTrades, apiAvailable = false }: BotControlsProps) {
  const { start, stop, reload, forceExit } = useBotControl(botId);
  const [showConfirm, setShowConfirm] = useState<'stop' | 'forceExit' | null>(null);

  const isRunning = botState === 'running';
  const isStopped = botState === 'stopped';

  // If API is not available, show a message
  if (!apiAvailable) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        Bot control requires API connection
      </div>
    );
  }

  const handleStart = () => {
    start.mutate();
  };

  const handleStop = () => {
    if (hasOpenTrades) {
      setShowConfirm('stop');
    } else {
      stop.mutate();
    }
  };

  const confirmStop = () => {
    stop.mutate(undefined, {
      onSettled: () => setShowConfirm(null),
    });
  };

  const handleReload = () => {
    reload.mutate();
  };

  const handleForceExit = () => {
    setShowConfirm('forceExit');
  };

  const confirmForceExit = () => {
    forceExit.mutate(undefined, {
      onSettled: () => setShowConfirm(null),
    });
  };

  const isConfirmLoading = (showConfirm === 'stop' && stop.isPending) ||
                           (showConfirm === 'forceExit' && forceExit.isPending);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Bot State Badge */}
        {botState && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
            isRunning
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
            {botState.charAt(0).toUpperCase() + botState.slice(1)}
          </span>
        )}

        {/* Start Button */}
        {(isStopped || !botState) && (
          <button
            onClick={handleStart}
            disabled={start.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {start.isPending ? (
              <LoadingSpinner />
            ) : (
              <PlayIcon />
            )}
            Start
          </button>
        )}

        {/* Stop Button */}
        {isRunning && (
          <button
            onClick={handleStop}
            disabled={stop.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {stop.isPending ? (
              <LoadingSpinner />
            ) : (
              <StopIcon />
            )}
            Stop
          </button>
        )}

        {/* Reload Button */}
        <button
          onClick={handleReload}
          disabled={reload.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {reload.isPending ? (
            <LoadingSpinner />
          ) : (
            <ReloadIcon />
          )}
          Reload
        </button>

        {/* Force Exit Button */}
        {hasOpenTrades && (
          <button
            onClick={handleForceExit}
            disabled={forceExit.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {forceExit.isPending ? (
              <LoadingSpinner />
            ) : (
              <ExitIcon />
            )}
            Force Exit
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative">
            {/* Loading overlay */}
            {isConfirmLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 rounded-lg flex items-center justify-center z-10">
                <div className="flex flex-col items-center gap-3">
                  <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {showConfirm === 'stop' ? 'Stopping bot...' : 'Closing trades...'}
                  </span>
                </div>
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {showConfirm === 'stop' ? 'Stop Bot?' : 'Force Exit All Trades?'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {showConfirm === 'stop'
                ? 'This bot has open trades. Stopping it will prevent new trades but existing trades will remain open.'
                : 'This will immediately close all open trades at current market prices. This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={isConfirmLoading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={showConfirm === 'stop' ? confirmStop : confirmForceExit}
                disabled={isConfirmLoading}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  showConfirm === 'stop'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {showConfirm === 'stop' ? 'Stop Bot' : 'Force Exit All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Icons
function PlayIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function ExitIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
