#!/usr/bin/env bash
set -euo pipefail

# Usage: send-report.sh <morning|afternoon|evening>

MODE="${1:-}"
if [[ -z "$MODE" ]]; then
  echo "Usage: $0 <morning|afternoon|evening>" >&2
  exit 2
fi

WORKDIR="/opt/openclaw/workspace"
MONITOR_DIR="$WORKDIR/skills/freqtrade-monitor"

# Telegram destination (same as the OpenClaw cron jobs used)
TG_TARGET="-1003786133533"
TG_THREAD_ID="120"  # BOTS topic

case "$MODE" in
  morning)
    HEADER="🤖 FREQTRADE MORNING REPORT — $(date +'%Y-%m-%d')"
    ;;
  afternoon)
    HEADER="🤖 FREQTRADE AFTERNOON REPORT — $(date +'%Y-%m-%d')"
    ;;
  evening)
    HEADER="🤖 FREQTRADE EVENING REPORT — $(date +'%Y-%m-%d')"
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 2
    ;;
esac

cd "$WORKDIR"

# Generate report (hard timeout so we never hang)
REPORT_RAW="$MONITOR_DIR/fleet-summary.sh"
if [[ ! -x "$REPORT_RAW" ]]; then
  echo "Missing or not executable: $REPORT_RAW" >&2
  exit 1
fi

OUT=$(timeout 90 "$REPORT_RAW" || true)
if [[ -z "${OUT// }" ]]; then
  OUT="(fleet-summary produced no output)"
fi

# Keep Telegram under safe size. (Telegram supports more, but OpenClaw routing / logs can choke.)
# If this truncates too much, we can later switch to sending as a document.
MAX_CHARS=3500
BODY="$HEADER

$OUT"
if (( ${#BODY} > MAX_CHARS )); then
  BODY="${BODY:0:MAX_CHARS}

…(truncated)"
fi

openclaw message send \
  --channel telegram \
  --target "$TG_TARGET" \
  --thread-id "$TG_THREAD_ID" \
  --message "$BODY"
