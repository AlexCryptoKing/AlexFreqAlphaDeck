-- ============================================================================
-- MULTIBOTDASHBOARD V10 - COMPLETE DASHBOARD SCHEMA
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
        CREATE TYPE userrole AS ENUM ('admin', 'operator', 'readonly');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'botenvironment') THEN
        CREATE TYPE botenvironment AS ENUM ('docker', 'baremetal', 'k8s', 'manual');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'healthstate') THEN
        CREATE TYPE healthstate AS ENUM ('healthy', 'degraded', 'unreachable', 'unknown');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sourcemode') THEN
        CREATE TYPE sourcemode AS ENUM ('api', 'sqlite', 'mixed', 'auto');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tradingmode') THEN
        CREATE TYPE tradingmode AS ENUM ('spot', 'futures', 'margin');
    END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role userrole NOT NULL DEFAULT 'readonly',
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_users_username ON users(username);

-- Bots table
CREATE TABLE IF NOT EXISTS bots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    environment botenvironment NOT NULL,
    host VARCHAR(255),
    container_id VARCHAR(64),
    user_data_path VARCHAR(500),
    api_url VARCHAR(255),
    api_port INTEGER,
    credentials_enc TEXT,
    source_mode sourcemode NOT NULL DEFAULT 'auto',
    health_state healthstate NOT NULL DEFAULT 'unknown',
    exchange VARCHAR(50),
    strategy VARCHAR(100),
    trading_mode tradingmode,
    is_dryrun BOOLEAN NOT NULL DEFAULT true,
    tags VARCHAR[] NOT NULL DEFAULT '{}',
    last_seen TIMESTAMP,
    discovered_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bot_environment ON bots(environment);
CREATE INDEX IF NOT EXISTS idx_bot_health_state ON bots(health_state);
CREATE INDEX IF NOT EXISTS idx_bot_exchange ON bots(exchange);
CREATE INDEX IF NOT EXISTS idx_bot_strategy ON bots(strategy);
CREATE INDEX IF NOT EXISTS idx_bot_last_seen ON bots(last_seen);

-- Bot metrics table
CREATE TABLE IF NOT EXISTS bot_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    equity NUMERIC(18, 8),
    profit_abs NUMERIC(18, 8),
    profit_pct NUMERIC(8, 4),
    profit_realized NUMERIC(18, 8),
    profit_unrealized NUMERIC(18, 8),
    balance NUMERIC(18, 8),
    drawdown NUMERIC(8, 4),
    open_positions INTEGER NOT NULL DEFAULT 0,
    closed_trades INTEGER NOT NULL DEFAULT 0,
    win_rate NUMERIC(5, 2),
    data_source sourcemode NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metrics_bot_id ON bot_metrics(bot_id);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON bot_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_bot_timestamp ON bot_metrics(bot_id, timestamp DESC);

-- Bot snapshots table
CREATE TABLE IF NOT EXISTS bot_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    total_balance NUMERIC(18, 8),
    available_balance NUMERIC(18, 8),
    stake_amount NUMERIC(18, 8),
    profit_all_time NUMERIC(18, 8),
    profit_all_time_pct NUMERIC(10, 4),
    profit_today NUMERIC(18, 8),
    profit_today_pct NUMERIC(10, 4),
    trade_count INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    open_trades INTEGER DEFAULT 0,
    current_pairs TEXT[],
    cpu_percent NUMERIC(5, 2),
    memory_mb INTEGER,
    latency_ms INTEGER,
    raw_data JSONB
);
CREATE INDEX IF NOT EXISTS idx_bot_snapshots_bot_id ON bot_snapshots(bot_id);
CREATE INDEX IF NOT EXISTS idx_bot_snapshots_timestamp ON bot_snapshots(timestamp DESC);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    trade_id VARCHAR(100) NOT NULL,
    pair VARCHAR(50) NOT NULL,
    is_short BOOLEAN DEFAULT FALSE,
    open_date TIMESTAMP,
    open_rate NUMERIC(18, 8),
    amount NUMERIC(18, 8),
    stake_amount NUMERIC(18, 8),
    close_date TIMESTAMP,
    close_rate NUMERIC(18, 8),
    profit_abs NUMERIC(18, 8),
    profit_pct NUMERIC(10, 4),
    strategy VARCHAR(100),
    buy_tag VARCHAR(100),
    sell_reason VARCHAR(100),
    stop_loss_pct NUMERIC(8, 4),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(bot_id, trade_id)
);
CREATE INDEX IF NOT EXISTS idx_trades_bot_id ON trades(bot_id);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(pair);
CREATE INDEX IF NOT EXISTS idx_trades_open_date ON trades(open_date DESC);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alerts_bot_id ON alerts(bot_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at DESC);

-- Settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    value_type VARCHAR(20) DEFAULT 'string' CHECK (value_type IN ('string', 'integer', 'float', 'boolean', 'json')),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_settings_key ON system_settings(key);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- Optimization runs table
CREATE TABLE IF NOT EXISTS optimization_runs (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    strategy_name VARCHAR(100) NOT NULL,
    run_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    profit_pct FLOAT,
    winrate_pct FLOAT,
    max_drawdown_pct FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_opt_runs_bot ON optimization_runs(bot_id);

-- Backtest results table
CREATE TABLE IF NOT EXISTS backtest_results (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    strategy_name VARCHAR(100),
    timeframe VARCHAR(10),
    timerange VARCHAR(50),
    profit_pct FLOAT,
    winrate_pct FLOAT,
    max_drawdown_pct FLOAT,
    profit_factor FLOAT,
    sharpe_ratio FLOAT,
    total_trades INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_backtest_bot ON backtest_results(bot_id);

-- Hyperopt epochs table
CREATE TABLE IF NOT EXISTS hyperopt_epochs (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    epoch INTEGER NOT NULL,
    params JSONB,
    profit_pct FLOAT,
    winrate_pct FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_hyperopt_bot ON hyperopt_epochs(bot_id);

-- Daily performance table
CREATE TABLE IF NOT EXISTS daily_performance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    bot_name VARCHAR(100),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate NUMERIC(5, 2),
    profit_abs NUMERIC(18, 8),
    profit_pct NUMERIC(10, 4),
    cumulative_profit NUMERIC(18, 8),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(date, bot_name)
);
CREATE INDEX IF NOT EXISTS idx_daily_perf_date ON daily_performance(date DESC);

-- Workflow schedules table
CREATE TABLE IF NOT EXISTS workflow_schedules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    workflow_type VARCHAR(50) NOT NULL,
    schedule VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pairlist jobs table
CREATE TABLE IF NOT EXISTS pairlist_jobs (
    id SERIAL PRIMARY KEY,
    bot_id VARCHAR(36) NOT NULL,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    result JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pairlist results table
CREATE TABLE IF NOT EXISTS pairlist_results (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES pairlist_jobs(id),
    pair VARCHAR(50) NOT NULL,
    score FLOAT,
    rank INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Default admin user (password: admin)
-- bcrypt hash for "admin": $2b$12$tlwk2.zLWZLdIVDzwnJLwuv3B.XxJBCx38m9kMQpHHxq.idIpLute
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$12$tlwk2.zLWZLdIVDzwnJLwuv3B.XxJBCx38m9kMQpHHxq.idIpLute', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Default settings
INSERT INTO system_settings (key, value, value_type, description) VALUES
    ('discovery_interval_seconds', '60', 'integer', 'Bot discovery scan interval'),
    ('health_check_interval_seconds', '10', 'integer', 'Health check interval'),
    ('theme', 'dark', 'string', 'Default UI theme')
ON CONFLICT (key) DO NOTHING;
