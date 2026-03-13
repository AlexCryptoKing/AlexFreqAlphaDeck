#!/bin/bash
# Freqtrade Report & Post to Telegram BOTS topic
# Usage: ./report-and-post.sh [morning|afternoon|evening]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPORT_TYPE="${1:-report}"
CHANNEL_ID="-1003786133533"
THREAD_ID="120"

# Generate report
REPORT=$(cd /root/.openclaw/workspace && ./skills/freqtrade-monitor/fleet-summary.sh 2>&1)

# Check if report was generated
if [ -z "$REPORT" ]; then
    echo "Failed to generate report"
    exit 1
fi

# Add header based on report type
HEADER="🤖 FREQTRADE $(echo "$REPORT_TYPE" | tr '[:lower:]' '[:upper:]') REPORT"
FULL_MESSAGE="$HEADER

$REPORT"

# Save to temp file for sending
echo "$FULL_MESSAGE" > /tmp/freqtrade_report.txt

echo "Report generated and saved to /tmp/freqtrade_report.txt"
echo "To post manually, use:"
echo "  message send --target $CHANNEL_ID --thread $THREAD_ID --text @/tmp/freqtrade_report.txt"
