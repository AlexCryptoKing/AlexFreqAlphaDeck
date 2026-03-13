/**
 * TypeScript type definitions matching backend Pydantic models.
 */

// Enums
export type UserRole = 'admin' | 'operator' | 'readonly';
export type BotEnvironment = 'docker' | 'baremetal' | 'k8s' | 'manual';
export type HealthState = 'healthy' | 'degraded' | 'unreachable' | 'unknown';
export type SourceMode = 'api' | 'sqlite' | 'mixed' | 'auto';
export type TradingMode = 'spot' | 'futures' | 'margin';

// User types
export interface User {
  id: string;
  username: string;
  role: UserRole;
  preferences: Record<string, unknown>;
}

export interface UserCreateRequest {
  username: string;
  password: string;
  role: UserRole;
}

// Bot types
export interface Bot {
  id: string;
  name: string;
  environment: BotEnvironment;
  host?: string;
  api_url?: string;
  health_state: HealthState;
  source_mode: SourceMode;
  exchange?: string;
  strategy?: string;
  trading_mode?: TradingMode;
  is_dryrun: boolean;
  tags: string[];
  last_seen?: string;
}

export interface BotUpdateRequest {
  name?: string;
  tags?: string[];
  source_mode?: SourceMode;
}

// Bot Metrics types
export interface BotMetrics {
  bot_id: string;
  timestamp: string;
  equity?: number;
  profit_abs?: number;
  profit_pct?: number;
  profit_realized?: number;
  profit_unrealized?: number;
  open_positions: number;
  closed_trades: number;
  win_rate?: number;
  balance?: number;
  drawdown?: number;
  data_source: SourceMode;
  health_state?: string;
}

// Trade types
export interface Trade {
  id: number;
  pair: string;
  is_open: boolean;
  open_date: string;
  close_date?: string;
  open_rate: number;
  close_rate?: number;
  amount: number;
  stake_amount: number;
  close_profit?: number;
  close_profit_abs?: number;
  enter_tag?: string;
  exit_reason?: string;
  leverage: number;
  is_short: boolean;
  data_source: SourceMode;
}

// Portfolio types
export interface PortfolioSummary {
  timestamp: string;
  // Bot counts (all registered bots)
  total_bots: number;
  healthy_bots: number;
  degraded_bots: number;
  unreachable_bots: number;
  // Excluded bots (not counted in portfolio totals)
  hyperopt_bots: number;
  backtest_bots: number;
  // Portfolio totals (only healthy trading bots)
  portfolio_bots: number;
  total_profit_abs: number;
  total_profit_pct: number;
  total_balance: number;
  total_open_positions: number;
  total_closed_trades: number;
  avg_win_rate?: number;
  best_performer?: string;
  worst_performer?: string;
}

export interface ExchangeBreakdown {
  exchange: string;
  bot_count: number;
  profit_abs: number;
  profit_pct: number;
  balance: number;
  open_positions: number;
}

export interface StrategyBreakdown {
  strategy: string;
  bot_count: number;
  profit_abs: number;
  profit_pct: number;
  open_positions: number;
  closed_trades: number;
  win_rate?: number;
}

// Discovery types
export interface DiscoveryStatus {
  docker_enabled: boolean;
  filesystem_enabled: boolean;
  last_scan?: string;
  scan_interval_seconds: number;
  next_scan?: string;
}

export interface DiscoveryResult {
  discovered: number;
  new: number;
  updated: number;
  removed: number;
  bots: Bot[];
}

// Auth types
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  status: 'success';
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActionResponse {
  status: 'success' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

// WebSocket message types
export type WSMessageType =
  | 'connection'
  | 'bot_status'
  | 'bot_metrics'
  | 'trade_open'
  | 'trade_close'
  | 'trade_update'
  | 'discovery'
  | 'error'
  | 'ping'
  | 'pong';

export interface WSMessage<T = unknown> {
  type: WSMessageType;
  timestamp: string;
  bot_id?: string;
  data: T;
}

// Filter types for UI
export interface BotFilters {
  environment?: BotEnvironment;
  health_state?: HealthState;
  exchange?: string;
  strategy?: string;
  tags?: string[];
  search?: string;
}

export interface TradeFilters {
  is_open?: boolean;
  pair?: string;
  from?: string;
  to?: string;
}
