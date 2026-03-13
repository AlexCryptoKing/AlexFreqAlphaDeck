/**
 * Theme configuration for MultibotdashboardV7 with AlexFinanceData colors.
 */

export type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'freqtrade-dashboard-theme';

// AlexFinanceData color palette
export const afColors = {
  // Background colors
  bg: {
    primary: '#0f1419',
    secondary: '#161b22',
    tertiary: '#1a2332',
  },
  // Text colors
  text: {
    primary: '#e6edf3',
    secondary: '#8b949e',
    muted: '#6e7681',
  },
  // Accent colors
  accent: {
    blue: '#58a6ff',
    green: '#3fb950',
    red: '#f85149',
    yellow: '#d29922',
    purple: '#a371f7',
  },
  // Border colors
  border: {
    default: '#30363d',
    hover: '#58a6ff',
  },
  // Status colors
  status: {
    healthy: '#3fb950',
    degraded: '#d29922',
    unreachable: '#f85149',
    unknown: '#8b949e',
  },
} as const;

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'; // Default to dark

  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored;
  }
  return 'dark'; // Default to dark (AlexFinanceData style)
}

export function setStoredTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}

export function getSystemPreference(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'dark'; // Always prefer dark for this dashboard
}

export function getEffectiveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return getSystemPreference();
  }
  return theme === 'light' ? 'dark' : 'dark'; // Force dark mode
}

export function applyTheme(theme: Theme): void {
  // Always use dark mode (AlexFinanceData style)
  document.documentElement.classList.add('dark');
  document.documentElement.style.setProperty('--bg-primary', afColors.bg.primary);
  document.documentElement.style.setProperty('--bg-secondary', afColors.bg.secondary);
  document.documentElement.style.setProperty('--text-primary', afColors.text.primary);
  document.documentElement.style.setProperty('--accent-blue', afColors.accent.blue);
  document.documentElement.style.setProperty('--accent-green', afColors.accent.green);

  setStoredTheme(theme);
}

export function initTheme(): void {
  // Always initialize with dark theme
  document.documentElement.classList.add('dark');
  setStoredTheme('dark');

  // Apply AlexFinanceData colors
  applyTheme('dark');
}

export function toggleTheme(): void {
  // For AlexFinanceData theme, we keep it always dark
  // This function exists for compatibility with keyboard shortcuts
  // but doesn't actually toggle (dark theme is enforced)
  const currentTheme = getStoredTheme();
  if (currentTheme === 'dark') {
    // Stay dark (no toggle)
    applyTheme('dark');
  } else {
    applyTheme('dark');
  }
}

// Health state colors using AlexFinanceData palette
export const colors = {
  healthy: {
    bg: 'bg-[#161b22] border-[#3fb950]',
    text: 'text-[#3fb950]',
    dot: 'bg-[#3fb950]',
    border: 'border-[#3fb950]',
  },
  degraded: {
    bg: 'bg-[#161b22] border-[#d29922]',
    text: 'text-[#d29922]',
    dot: 'bg-[#d29922]',
    border: 'border-[#d29922]',
  },
  unreachable: {
    bg: 'bg-[#161b22] border-[#f85149]',
    text: 'text-[#f85149]',
    dot: 'bg-[#f85149]',
    border: 'border-[#f85149]',
  },
  unknown: {
    bg: 'bg-[#161b22] border-[#8b949e]',
    text: 'text-[#8b949e]',
    dot: 'bg-[#8b949e]',
    border: 'border-[#8b949e]',
  },

  // Profit colors
  profit: {
    positive: 'text-[#3fb950]',
    negative: 'text-[#f85149]',
    neutral: 'text-[#8b949e]',
  },

  // Environment colors
  docker: 'bg-[#161b22] text-[#58a6ff] border-[#58a6ff]',
  baremetal: 'bg-[#161b22] text-[#a371f7] border-[#a371f7]',
  k8s: 'bg-[#161b22] text-[#3fb950] border-[#3fb950]',
  manual: 'bg-[#161b22] text-[#d29922] border-[#d29922]',
} as const;

export function getHealthColor(state: string) {
  switch (state) {
    case 'healthy':
      return colors.healthy;
    case 'degraded':
      return colors.degraded;
    case 'unreachable':
      return colors.unreachable;
    default:
      return colors.unknown;
  }
}

export function getProfitColor(profit: number): string {
  if (profit > 0) return colors.profit.positive;
  if (profit < 0) return colors.profit.negative;
  return colors.profit.neutral;
}

export function getEnvironmentColor(env: string): string {
  switch (env) {
    case 'docker':
      return colors.docker;
    case 'baremetal':
      return colors.baremetal;
    case 'k8s':
      return colors.k8s;
    case 'manual':
      return colors.manual;
    default:
      return colors.manual;
  }
}

// FinanceData specific colors
export const financeColors = {
  crypto: '#58a6ff',
  stocks: '#a371f7',
  portfolio: '#3fb950',
  news: '#d29922',
  economic: '#f778ba',
  bybit: '#00d4aa',
} as const;
