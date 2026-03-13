-- =============================================================================
-- MULTIBOTDASHBOARD V10 - DATABASE CREATION SCRIPT
-- =============================================================================
-- This script runs in the postgres container and creates databases:
-- 1. dashboard (main application database) - created by POSTGRES_DB env
-- 2. financial_data (for data-collector)
-- =============================================================================

-- Create financial_data database (for data-collector)
CREATE DATABASE financial_data;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE financial_data TO dashboard;
