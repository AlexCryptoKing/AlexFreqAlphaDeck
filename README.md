# 🤖 Multibotdashboard V10 - Complete Installation Guide

[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://react.dev)

> **Complete Docker-based deployment package for the Freqtrade Multi-Bot Dashboard**

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Quick Start](#quick-start)
- [Installation Methods](#installation-methods)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Security](#security)
- [Upgrading](#upgrading)

---

## 🎯 Overview

Multibotdashboard V10 is a modern, real-time dashboard for monitoring and controlling multiple [Freqtrade](https://www.freqtrade.io/) trading bots from a single interface.

### ✨ Features

- **Multi-Bot Management** - Monitor unlimited Freqtrade bots from one dashboard
- **Real-Time Updates** - Live WebSocket data streaming
- **Auto-Discovery** - Automatically detects bots via Docker or filesystem
- **Portfolio Analytics** - Aggregated performance metrics
- **Trade History** - Detailed logs with filtering and export
- **Health Monitoring** - Track uptime, latency, and errors
- **Dark/Light Mode** - Beautiful responsive UI
- **Mobile Ready** - Works on desktop and mobile

### 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT                                      │
│                     (Browser / Mobile App)                               │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ HTTP / WebSocket
┌─────────────────────────────▼───────────────────────────────────────────┐
│                           FRONTEND                                       │
│              React 18 + TypeScript + Vite + Tailwind CSS                 │
│                         Port: 5000                                       │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │ REST API / WebSocket
┌─────────────────────────────▼───────────────────────────────────────────┐
│                           BACKEND                                        │
│              FastAPI + Python 3.11 + SQLAlchemy 2.0                      │
│                         Port: 8000                                       │
└─────────────────────────────┬───────────────────────────────────────────┘
              ┌───────────────┼───────────────┐
              │               │               │
┌─────────────▼─────┐ ┌───────▼────────┐ ┌────▼──────────┐
│   PostgreSQL      │ │   PostgreSQL   │ │    Redis      │
│   (Main DB)       │ │  (Analytics)   │ │   (Cache)     │
│   Port: 5432      │ │   Port: 5433   │ │  Port: 6379   │
└───────────────────┘ └────────────────┘ └───────────────┘
```

---

## 💻 System Requirements

### Minimum Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 4 GB | 8+ GB |
| **Disk** | 20 GB | 50+ GB SSD |
| **OS** | Linux/macOS/Windows with Docker | Linux Ubuntu 22.04+ |
| **Docker** | 20.10+ | Latest |
| **Docker Compose** | 2.0+ | Latest |

### Network Requirements

- Ports to open:
  - `5000` - Dashboard UI
  - `8000` - API (if accessing directly)
  - `8090` - Adminer (optional, internal only recommended)

---

## 🚀 Quick Start

### 1. Clone/Download

```bash
# Clone the repository
git clone https://github.com/yourusername/multibotdashboard-v10.git
cd multibotdashboard-v10

# OR download and extract the release
wget https://github.com/yourusername/multibotdashboard-v10/releases/download/v10.0.0/multibotdashboard-v10.tar.gz
tar -xzf multibotdashboard-v10.tar.gz
cd multibotdashboard-v10
```

### 2. Run Installation

```bash
# Make install script executable
chmod +x install.sh

# Run interactive installation
./install.sh

# OR with custom options
./install.sh --db-password mypass --admin-password myadmin --production
```

### 3. Access Dashboard

```
🌐 Dashboard UI:    http://localhost:5000
📚 API Docs:        http://localhost:8000/docs
🗄️  Adminer (DB):   http://localhost:8090
```

**Default Login:**
- Username: `admin`
- Password: `admin` (change immediately!)

---

## 🔧 Installation Methods

### Method 1: Automated Installation (Recommended)

```bash
./install.sh
```

This will:
1. Check prerequisites (Docker, Docker Compose)
2. Generate secure passwords and secrets
3. Create directory structure
4. Set up database schemas
5. Build and start all services

### Method 2: Manual Installation

```bash
# 1. Create environment file
cp .env.example .env
nano .env  # Edit with your settings

# 2. Create directories
mkdir -p {logs,backup_DB,data,db/init,db/init-analytics}

# 3. Start databases first
docker-compose up -d postgres postgres-analytics redis

# 4. Wait for DB initialization (30 seconds)
sleep 30

# 5. Start all services
docker-compose up -d
```

### Method 3: Production Deployment

```bash
# Production mode with custom domain
./install.sh \
  --production \
  --db-password "$(openssl rand -base64 32)" \
  --jwt-secret "$(openssl rand -hex 64)" \
  --admin-password "$(openssl rand -base64 16)"
```

---

## ⚙️ Configuration

### Environment Variables

All configuration is done via the `.env` file:

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_HOST` | Public hostname/IP | `localhost` |
| `DB_PASSWORD` | PostgreSQL password | (auto-generated) |
| `JWT_SECRET` | JWT signing key | (auto-generated) |
| `ADMIN_USERNAME` | Admin username | `admin` |
| `ADMIN_PASSWORD` | Admin password | `admin` |
| `BACKEND_PORT` | API port | `8000` |
| `FRONTEND_PORT` | UI port | `5000` |
| `REDIS_PORT` | Redis port | `6379` |

### Docker Compose Configuration

Key settings in `docker-compose.yml`:

```yaml
# All volumes are mounted as RW (read-write) as requested
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:rw  # Docker access
  - /opt:/opt:rw                                    # Freqtrade data
  - ./backend/src:/app/src:rw                      # Backend code
  - ./config:/app/config:rw                        # Config files
```

### Dashboard YAML Config

Create `config/dashboard.yaml`:

```yaml
server:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "http://localhost:5000"

database:
  url: "postgresql://dashboard:dashboard@postgres:5432/dashboard"

discovery:
  docker:
    enabled: true
    image_patterns:
      - "freqtradeorg/freqtrade"
  filesystem:
    enabled: true
    scan_paths:
      - "/opt/freqtrade/*/user_data"

api_defaults:
  username: "your_freqtrade_user"
  password: "your_freqtrade_pass"
```

---

## 🗄️ Database Schema

### Main Dashboard Database (`dashboard`)

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `bots` | Registered Freqtrade bots |
| `bot_snapshots` | Historical bot metrics |
| `trades` | Trade history from all bots |
| `alerts` | System alerts and notifications |
| `settings` | Application configuration |
| `audit_log` | Activity tracking |

### Analytics Database (`freqtrade_analytics`)

| Table | Purpose |
|-------|---------|
| `crypto_prices` | Market price data |
| `crypto_movers` | Top gainers/losers |
| `stocks` | Stock market data |
| `portfolio_snapshots` | Aggregated portfolio metrics |
| `portfolio_trades` | Cross-bot trade history |
| `news` | Market news and sentiment |
| `economic_indicators` | Economic data |
| `daily_performance` | Daily profit/loss tracking |

---

## 🎮 Usage

### First Login

1. Navigate to `http://localhost:5000`
2. Login with default credentials
3. **Immediately change the admin password!**
4. Go to Settings → Profile → Change Password

### Adding Bots

**Method 1: Auto-Discovery**
- Dashboard automatically scans for bots every 60 seconds
- Ensure your bots are running in Docker or accessible in scan paths

**Method 2: Manual Registration**
1. Go to Bots → Add Bot
2. Enter bot details:
   - Name: Unique identifier
   - API URL: `http://bot-host:8080`
   - Username/Password: Freqtrade API credentials
3. Click "Test Connection" then "Save"

### Dashboard Views

| View | Description |
|------|-------------|
| **Overview** | Portfolio summary, P&L, active bots |
| **Bots** | Individual bot status and controls |
| **Trades** | Trade history with filters |
| **Analytics** | Charts and performance metrics |
| **Alerts** | System notifications |
| **Settings** | Configuration and user management |

---

## 🔍 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs -f [service_name]

# Common fixes
docker-compose down
docker-compose pull
docker-compose up -d
```

### Database Connection Issues

```bash
# Check database health
docker-compose exec postgres pg_isready -U dashboard

# Reset databases (WARNING: data loss!)
docker-compose down -v
docker-compose up -d postgres postgres-analytics
```

### Bot Discovery Not Working

```bash
# Check Docker socket access
docker-compose exec backend docker ps

# Verify scan paths
docker-compose exec backend ls -la /opt
```

### Common Errors

| Error | Solution |
|-------|----------|
| `Connection refused` | Wait for services to start (30s) |
| `Permission denied` | Check volume permissions: `chmod -R 755 data/` |
| `JWT validation failed` | Regenerate JWT_SECRET in .env |
| `Database locked` | Restart postgres: `docker-compose restart postgres` |

---

## 🔒 Security

### Production Checklist

- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET
- [ ] Use strong DB_PASSWORD
- [ ] Enable HTTPS (reverse proxy)
- [ ] Restrict Adminer access (VPN/internal only)
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Regular backups

### Recommended Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_set_header Host $host;
    }
}
```

---

## 📈 Upgrading

### From V9 to V10

```bash
# 1. Backup data
docker-compose exec postgres pg_dump -U dashboard dashboard > backup_v9.sql

# 2. Pull latest version
git pull origin main

# 3. Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Run migrations (if any)
docker-compose exec backend alembic upgrade head
```

---

## 📝 Useful Commands

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Restart service
docker-compose restart backend

# Scale backend (if needed)
docker-compose up -d --scale backend=2

# Backup database
docker-compose exec postgres pg_dump -U dashboard dashboard > backup.sql

# Restore database
docker-compose exec -T postgres psql -U dashboard dashboard < backup.sql

# Update images
docker-compose pull
docker-compose up -d

# Clean up unused data
docker system prune -a
docker volume prune
```

---

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/multibotdashboard-v10/issues)
- **Documentation**: [Full Docs](https://docs.yourdomain.com)
- **Discord**: [Join Community](https://discord.gg/yourinvite)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for the Freqtrade community<br>
  <strong>Multibotdashboard V10</strong>
</p>
