#!/bin/bash
# Freqtrade Data Logger - Linux Version
# Usage: ./logger.sh log|report

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
DATA_DIR="$SCRIPT_DIR/data"
ACTION="${1:-log}"

# Ensure data directory exists
mkdir -p "$DATA_DIR"

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required. Install with: apt-get install jq"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "Error: curl is required."
    exit 1
fi

# Get bot data
get_bot_data() {
    local name="$1"
    local url="$2"
    local username="$3"
    local password="$4"
    local mode="$5"
    local strategy="$6"
    
    local auth=$(echo -n "$username:$password" | base64 -w0)
    
    local profit_response=$(curl -s -m 15 -H "Authorization: Basic $auth" "$url/api/v1/profit" 2>/dev/null)
    local balance_response=$(curl -s -m 15 -H "Authorization: Basic $auth" "$url/api/v1/balance" 2>/dev/null)
    local status_response=$(curl -s -m 15 -H "Authorization: Basic $auth" "$url/api/v1/status" 2>/dev/null)
    
    if [ -z "$profit_response" ] || [ -z "$balance_response" ]; then
        echo "{\"name\":\"$name\",\"state\":\"error\",\"mode\":\"$mode\"}"
        return
    fi
    
    local total_profit=$(echo "$profit_response" | jq -r '.profit_all_fiat // 0')
    local total_profit_pct=$(echo "$profit_response" | jq -r '.profit_all_percent // 0')
    local winrate=$(echo "$profit_response" | jq -r '.winrate // 0')
    local trade_count=$(echo "$profit_response" | jq -r '.trade_count // 0')
    local closed_trade_count=$(echo "$profit_response" | jq -r '.closed_trade_count // 0')
    local max_drawdown=$(echo "$profit_response" | jq -r '.max_drawdown // 0')
    local current_drawdown=$(echo "$profit_response" | jq -r '.current_drawdown // 0')
    local profit_factor=$(echo "$profit_response" | jq -r '.profit_factor // 0')
    
    local total_balance=$(echo "$balance_response" | jq -r '.total // 0')
    local starting_capital=$(echo "$balance_response" | jq -r '.starting_capital // 0')
    local free_balance=$(echo "$balance_response" | jq -r '.currencies[0].free // 0')
    
    local open_trades=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true)] | length')
    
    cat <<EOF
{
  "name": "$name",
  "state": "running",
  "mode": "$mode",
  "strategy": "$strategy",
  "profit_all_fiat": $total_profit,
  "profit_all_percent": $total_profit_pct,
  "win_rate": $(echo "scale=1; $winrate * 100" | bc),
  "trade_count": $trade_count,
  "closed_trade_count": $closed_trade_count,
  "open_trades": $open_trades,
  "total_balance": $total_balance,
  "starting_capital": $starting_capital,
  "free_balance": $free_balance,
  "max_drawdown": $(echo "scale=4; $max_drawdown" | bc),
  "current_drawdown": $(echo "scale=4; $current_drawdown" | bc),
  "profit_factor": $(echo "scale=2; $profit_factor" | bc)
}
EOF
}

# Save snapshot
save_snapshot() {
    local date_str=$(date +"%Y-%m-%d")
    local time_str=$(date +"%H%M")
    local filename="snapshot_${date_str}_${time_str}.json"
    local filepath="$DATA_DIR/$filename"
    
    echo "Collecting bot data..."
    
    local bots_data="["
    local first=true
    local bot_count=$(jq '.bots | length' "$CONFIG_FILE")
    
    for ((i=0; i<bot_count; i++)); do
        local name=$(jq -r ".bots[$i].name" "$CONFIG_FILE")
        local url=$(jq -r ".bots[$i].url" "$CONFIG_FILE")
        local username=$(jq -r ".bots[$i].username" "$CONFIG_FILE")
        local password=$(jq -r ".bots[$i].password" "$CONFIG_FILE")
        local mode=$(jq -r ".bots[$i].mode" "$CONFIG_FILE")
        local strategy=$(jq -r ".bots[$i].strategy" "$CONFIG_FILE")
        
        [ "$first" = true ] || bots_data+=","
        first=false
        
        local bot_info=$(get_bot_data "$name" "$url" "$username" "$password" "$mode" "$strategy")
        bots_data+="$bot_info"
    done
    
    bots_data+="]"
    
    # Create snapshot JSON
    cat > "$filepath" <<EOF
{
  "date": "$date_str",
  "time": "$(date +"%H:%M")",
  "timestamp": $(date +%s),
  "bots": $bots_data
}
EOF
    
    echo "Snapshot saved: $filepath"
    
    # Cleanup old snapshots (keep last 30 days)
    find "$DATA_DIR" -name "snapshot_*.json" -mtime +30 -delete 2>/dev/null
}

# Generate report
generate_report() {
    echo "Generating historical report..."
    
    # Get snapshots from last 14 days
    local snapshots=$(find "$DATA_DIR" -name "snapshot_*.json" -mtime -14 | sort)
    
    if [ -z "$snapshots" ]; then
        echo "No snapshots found in the last 14 days."
        exit 1
    fi
    
    echo "FREQTRADE HISTORICAL REPORT"
    echo "Generated: $(date +"%Y-%m-%d %H:%M")"
    echo "Period: Last 14 days"
    echo ""
    echo "Snapshots found: $(echo "$snapshots" | wc -l)"
    echo ""
    
    # Show first and last snapshot dates
    local first_file=$(echo "$snapshots" | head -1)
    local last_file=$(echo "$snapshots" | tail -1)
    
    local first_date=$(jq -r '[.date, .time] | join(" ")' "$first_file")
    local last_date=$(jq -r '[.date, .time] | join(" ")' "$last_file")
    
    echo "Date range: $first_date to $last_date"
    echo ""
    
    # Calculate overall trends
    local first_profit=$(jq '[.bots[] | select(.state=="running") | .profit_all_fiat] | add // 0' "$first_file")
    local last_profit=$(jq '[.bots[] | select(.state=="running") | .profit_all_fiat] | add // 0' "$last_file")
    local profit_change=$(echo "scale=2; $last_profit - $first_profit" | bc)
    
    local first_balance=$(jq '[.bots[] | select(.state=="running") | .total_balance] | add // 0' "$first_file")
    local last_balance=$(jq '[.bots[] | select(.state=="running") | .total_balance] | add // 0' "$last_file")
    local balance_change=$(echo "scale=2; $last_balance - $first_balance" | bc)
    
    echo "=== FLEET PERFORMANCE ==="
    echo "Starting P&L: ${first_profit} USDT"
    echo "Current P&L: ${last_profit} USDT"
    echo "Change: $(if (( $(echo "$profit_change >= 0" | bc -l) )); then echo -n "+"; fi)${profit_change} USDT"
    echo ""
    echo "Starting Balance: ${first_balance} USDT"
    echo "Current Balance: ${last_balance} USDT"
    echo "Change: $(if (( $(echo "$balance_change >= 0" | bc -l) )); then echo -n "+"; fi)${balance_change} USDT"
}

# Main
case "$ACTION" in
    log)
        save_snapshot
        ;;
    report)
        generate_report
        ;;
    *)
        echo "Usage: $0 [log|report]"
        echo "  log    - Save current snapshot"
        echo "  report - Generate historical report"
        exit 1
        ;;
esac
