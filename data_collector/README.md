# Freqtrade Bot Monitor

Monitoring setup for Freqtrade trading bots with historical data tracking.
**Now running on Linux!** (Converted from PowerShell)

## Prerequisites

```bash
sudo apt-get update
sudo apt-get install -y jq curl bc
```

## Data Storage

All bot data is saved locally in:
```
skills/freqtrade-monitor/data/snapshot_YYYY-MM-DD_HHMM.json
```

Each snapshot contains:
- Profit/L (fiat & %)
- Balance & starting capital
- Win rate & trade count
- Open trades count
- Drawdown metrics
- Timestamp

## Querying Historical Data

### View Latest Snapshot
```bash
./skills/freqtrade-monitor/query.sh
```

### View Bot Trend Over Time
```bash
# Show last 14 days of a specific bot
./skills/freqtrade-monitor/query.sh trend -Bot BandSniper-LIVE-9030 -Days 14
```

### Generate Historical Report
```bash
# After 2 weeks, generate performance report
./skills/freqtrade-monitor/logger.sh report
```

## Data Logging

### Manual Snapshot
```bash
# Save current state to file
./skills/freqtrade-monitor/logger.sh log
```

### Automatic Logging
- **Daily snapshot** at 23:00 (Berlin time) - saves end-of-day data
- **3x daily reports** at 08:00, 14:00, 20:00 - sends Telegram summaries

## Fleet Overview

**12 Bots Total:**
| Port | Name | Strategy | Mode | Status |
|------|------|----------|------|--------|
| 9000 | BandSniper-V18 | AlexBandSniperV18MLAIM | DRY | Running |
| 9010 | BandSniper-MLAI | AlexBandSniperV18MLAI | DRY | Running |
| 9020 | Divergence-V4 | Alex_DivergenceV4 | DRY | Running |
| **9030** | **BandSniper-LIVE** | **AlexBandSniperV18MLAIM** | **LIVE** | **Running** |
| 9040 | BandSniper-9040 | AlexBandSniperV18MLAIM | DRY | Running |
| 9050 | NexusForge-V8 | AlexNexusForgeV8AIV2 | DRY | Running |
| 9060 | Divergence-Optuna | Alex_Divergence_Optuna | DRY | Running |
| 9070 | NinjaAI-V4 | NinjaAI_V4 | DRY | Running |
| 9080 | NinjaAI-V4-2 | NinjaAI_V4 | DRY | - |
| 9090 | Divergence-V41 | Alex_DivergenceV41 | DRY | Running |
| 9100 | Divergence-V5 | Alex_DivergenceV5 | DRY | Running |
| 9110 | ANF-V9 | ANFV9 | DRY | Running |

## Files

- `config.json` — Bot credentials and settings (12 bots configured)
- `monitor.sh` — Get raw JSON data from bot(s)
- `fleet-summary.sh` — **Generate fleet-wide report (main)**
- `logger.sh` — Save snapshots and generate reports
- `query.sh` — Query historical data
- `README.md` — This file

## Usage

### Quick Fleet Check
```bash
# Full fleet summary
./skills/freqtrade-monitor/fleet-summary.sh
```

### Automated Reports
Three daily summaries scheduled (Berlin time):
- **08:00** — Morning Report
- **14:00** — Afternoon Report  
- **20:00** — Evening Report

Reports include:
- Fleet overview (total P&L, balance, open trades)
- Per-bot status line
- Top 5 performers (detailed)
- Live bot highlight

## Adding More Bots

Edit `config.json`:
```json
{
  "name": "YourBotName",
  "url": "http://ip:port",
  "username": "your_user",
  "password": "your_pass",
  "mode": "dry_run",
  "strategy": "StrategyName"
}
```

## Security Note

- Credentials stored locally in `config.json`
- 1 bot running LIVE (9030) — real money at stake
- 11 bots in dry-run/paper trading mode

## API Endpoints Used

- `/api/v1/ping` — Health check
- `/api/v1/status` — Open trades
- `/api/v1/profit` — Performance metrics
- `/api/v1/balance` — Account balance

---

*Restored from Windows PowerShell version - 2026-02-01*
