/**
 * Setup page (public) used by bundled mobile builds to configure backend origin.
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBackendOrigin, setBackendOrigin } from '../services/api';

function normalizeDisplay(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (!/^https?:\/\//i.test(t)) return `http://${t}`;
  return t;
}

export function Setup() {
  const navigate = useNavigate();
  const existing = getBackendOrigin() || '';
  const [origin, setOrigin] = useState(existing);
  const [error, setError] = useState<string | null>(null);

  const example = useMemo(() => 'http://192.168.0.210:5000', []);

  const save = () => {
    setError(null);
    const value = origin.trim();
    if (!value) {
      setError('Please enter your backend URL (IP:port).');
      return;
    }
    const normalized = normalizeDisplay(value).replace(/\/+$/, '');
    if (!/^https?:\/\//i.test(normalized)) {
      setError('URL must start with http:// or https://');
      return;
    }
    setBackendOrigin(normalized);
    // Force full reload so the API client picks up the new base URL.
    window.location.href = '/login';
  };

  const clear = () => {
    setBackendOrigin(null);
    setOrigin('');
    setError('Cleared saved backend. Enter a new one.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Connect Backend</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          This app bundles the dashboard UI. To load data, set the backend address of your MultiBotDashboard.
        </p>

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Backend URL (HTTP allowed)
          </label>
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder={example}
            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          {error ? (
            <div className="mt-2 text-sm text-red-500">{error}</div>
          ) : null}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={save}
            className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            Save & Continue
          </button>
          <button
            onClick={clear}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
          >
            Clear
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Tip: make sure you are on the same Wi‑Fi/VPN as your backend. Example: <span className="font-mono">{example}</span>
        </div>

        <div className="mt-4">
          <button
            onClick={() => navigate('/login')}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
