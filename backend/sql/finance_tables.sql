-- AlexFinanceData Tables for MultibotdashboardV7
-- Run this in PostgreSQL (database: freqtrade_dashboard, user: dashboard)

-- ============================================
-- CRYPTO DATA TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS finance_crypto_prices (
    id SERIAL PRIMARY KEY,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20),
    name VARCHAR(100),
    price_usd DECIMAL(18, 8),
    price_eur DECIMAL(18, 8),
    price_btc DECIMAL(18, 8),
    market_cap BIGINT,
    volume_24h BIGINT,
    change_24h_pct DECIMAL(10, 4),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'coingecko',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crypto_prices_coin ON finance_crypto_prices(coin_id);
CREATE INDEX IF NOT EXISTS idx_crypto_prices_time ON finance_crypto_prices(timestamp DESC);

-- CRYPTO TOP MOVERS TABLE
CREATE TABLE IF NOT EXISTS finance_crypto_movers (
    id SERIAL PRIMARY KEY,
    category VARCHAR(20) NOT NULL,
    coin_id VARCHAR(50) NOT NULL,
    symbol VARCHAR(20),
    name VARCHAR(100),
    price DECIMAL(18, 8),
    change_24h_pct DECIMAL(10, 4),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STOCKS DATA TABLE
CREATE TABLE IF NOT EXISTS finance_stocks (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    price DECIMAL(12, 4),
    change DECIMAL(12, 4),
    change_percent DECIMAL(10, 4),
    volume BIGINT,
    market_cap BIGINT,
    pe_ratio DECIMAL(10, 2),
    sector VARCHAR(50),
    industry VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PORTFOLIO PERFORMANCE TABLE
CREATE TABLE IF NOT EXISTS finance_portfolio (
    id SERIAL PRIMARY KEY,
    total_trades INTEGER,
    winning_trades INTEGER,
    losing_trades INTEGER,
    win_rate DECIMAL(5, 2),
    total_profit_abs DECIMAL(18, 8),
    total_profit_pct DECIMAL(10, 4),
    profit_factor DECIMAL(10, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NEWS DATA TABLE
CREATE TABLE IF NOT EXISTS finance_news (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    source VARCHAR(100),
    url TEXT,
    symbol VARCHAR(20),
    category VARCHAR(50),
    published_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ECONOMIC INDICATORS TABLE
CREATE TABLE IF NOT EXISTS finance_economic (
    id SERIAL PRIMARY KEY,
    indicator_id VARCHAR(50) NOT NULL,
    name VARCHAR(100),
    value DECIMAL(18, 6),
    date DATE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BYBIT ORDERBOOK TABLE
CREATE TABLE IF NOT EXISTS finance_bybit_orderbook (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    best_bid DECIMAL(18, 8),
    best_ask DECIMAL(18, 8),
    mid_price DECIMAL(18, 8),
    spread_pct DECIMAL(10, 6),
    bid_depth DECIMAL(18, 2),
    ask_depth DECIMAL(18, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
