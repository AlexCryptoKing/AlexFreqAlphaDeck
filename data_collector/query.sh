#!/bin/bash
# Freqtrade Query Tool - Linux Version
# Usage: ./query.sh [latest|trend] [-Bot botname] [-Days n]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
QUERY_TYPE="${1:-latest}"

# Parse arguments
BOT_NAME=""
DAYS=14

while [[ $# -gt 0 ]]; do
    case $1 in
        -Bot)
            BOT_NAME="$2"
            shift 2
            ;;
        -Days)
            DAYS="$2"
            shift 2
            ;;
        *)
            shift
            ;;
    esac
done

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required. Install with: apt-get install jq"
    exit 1
fi

# View latest snapshot
show_latest() {
    local latest=$(ls -1t "$DATA_DIR"/snapshot_*.json 2>/dev/null | head -1)
    
    if [ -z "$latest" ]; then
        echo "No snapshots found."
        exit 1
    fi
    
    echo "Latest Snapshot: $(basename "$latest")"
    echo "Date: $(jq -r '.date' "$latest") $(jq -r '.time' "$latest")"
    echo ""
    
    if [ -n "$BOT_NAME" ]; then
        # Show specific bot
        local bot=$(jq ".bots[] | select(.name==\"$BOT_NAME\")" "$latest")
        if [ -z "$bot" ]; then
            echo "Bot '$BOT_NAME' not found in snapshot."
            exit 1
        fi
        echo "$bot" | jq '.'
    else
        # Show all bots
        jq '.bots[] | {name, state, mode, profit_all_fiat, total_balance, win_rate, open_trades}' "$latest"
    fi
}

# Show trend over time
show_trend() {
    if [ -z "$BOT_NAME" ]; then
        echo "Error: -Bot parameter required for trend query"
        exit 1
    fi
    
    local snapshots=$(find "$DATA_DIR" -name "snapshot_*.json" -mtime -$DAYS | sort)
    
    if [ -z "$snapshots" ]; then
        echo "No snapshots found in the last $DAYS days."
        exit 1
    fi
    
    echo "Trend for $BOT_NAME (last $DAYS days)"
    echo "================================"
    echo ""
    printf "%-20s %-12s %-12s %-8s %-6s\n" "Date/Time" "P&L (USDT)" "Balance" "WR%" "Open"
    printf "%-20s %-12s %-12s %-8s %-6s\n" "--------------------" "------------" "------------" "--------" "------"
    
    for file in $snapshots; do
        local datetime=$(jq -r '[.date, .time] | join(" ")' "$file")
        local bot=$(jq ".bots[] | select(.name==\"$BOT_NAME\")" "$file")
        
        if [ -n "$bot" ]; then
            local profit=$(echo "$bot" | jq -r '.profit_all_fiat // 0')
            local balance=$(echo "$bot" | jq -r '.total_balance // 0')
            local wr=$(echo "$bot" | jq -r '.win_rate // 0')
            local open=$(echo "$bot" | jq -r '.open_trades // 0')
            
            printf "%-20s %-12.2f %-12.2f %-8.1f %-6d\n" "$datetime" "$profit" "$balance" "$wr" "$open"
        fi
    done
}

# Main
case "$QUERY_TYPE" in
    latest)
        show_latest
        ;;
    trend)
        show_trend
        ;;
    *)
        echo "Usage: $0 [latest|trend] [-Bot botname] [-Days n]"
        echo ""
        echo "Commands:"
        echo "  latest          Show latest snapshot"
        echo "  trend           Show bot trend over time"
        echo ""
        echo "Options:"
        echo "  -Bot <name>     Specify bot name (required for trend)"
        echo "  -Days <n>       Number of days for trend (default: 14)"
        exit 1
        ;;
esac
