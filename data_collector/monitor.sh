#!/bin/bash
# Freqtrade Bot Monitor - Linux Version
# Usage: ./monitor.sh [bot_name|all]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
BOT_NAME="${1:-all}"

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required. Install with: apt-get install jq"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "Error: curl is required."
    exit 1
fi

get_bot_summary() {
    local name="$1"
    local url="$2"
    local username="$3"
    local password="$4"
    
    # Create auth header
    local auth=$(echo -n "$username:$password" | base64 -w0)
    
    # Fetch data with timeout
    local profit_response=$(curl -s -m 15 -H "Authorization: Basic $auth" "$url/api/v1/profit" 2>/dev/null)
    local balance_response=$(curl -s -m 15 -H "Authorization: Basic $auth" "$url/api/v1/balance" 2>/dev/null)
    local status_response=$(curl -s -m 15 -H "Authorization: Basic $auth" "$url/api/v1/status" 2>/dev/null)
    
    if [ -z "$profit_response" ] || [ -z "$balance_response" ]; then
        echo "{\"name\":\"$name\",\"state\":\"error\",\"error\":\"Failed to fetch data\"}"
        return
    fi
    
    # Parse data
    local closed_profit=$(echo "$profit_response" | jq -r '.profit_closed_fiat // 0')
    local closed_profit_pct=$(echo "$profit_response" | jq -r '.profit_closed_percent // 0')
    local total_profit=$(echo "$profit_response" | jq -r '.profit_all_fiat // 0')
    local total_profit_pct=$(echo "$profit_response" | jq -r '.profit_all_percent // 0')
    local winrate=$(echo "$profit_response" | jq -r '.winrate // 0')
    local trade_count=$(echo "$profit_response" | jq -r '.trade_count // 0')
    local closed_trade_count=$(echo "$profit_response" | jq -r '.closed_trade_count // 0')
    local max_drawdown=$(echo "$profit_response" | jq -r '.max_drawdown // 0')
    local current_drawdown=$(echo "$profit_response" | jq -r '.current_drawdown // 0')
    local profit_factor=$(echo "$profit_response" | jq -r '.profit_factor // 0')
    local best_pair=$(echo "$profit_response" | jq -r '.best_pair // "N/A"')
    local best_rate=$(echo "$profit_response" | jq -r '.best_rate // 0')
    local first_trade=$(echo "$profit_response" | jq -r '.first_trade_humanized // "N/A"')
    
    local free_balance=$(echo "$balance_response" | jq -r '.currencies[0].free // 0')
    local total_balance=$(echo "$balance_response" | jq -r '.total // 0')
    local starting_capital=$(echo "$balance_response" | jq -r '.starting_capital // 0')
    
    local open_trades=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true)] | length')
    local longs=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true and .is_short==false)] | length')
    local shorts=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true and .is_short==true)] | length')
    
    # Format output JSON
    cat <<EOF
{
  "name": "$name",
  "state": "running",
  "closed_profit": $closed_profit,
  "closed_profit_pct": $closed_profit_pct,
  "total_profit": $total_profit,
  "total_profit_pct": $total_profit_pct,
  "win_rate": $(echo "scale=1; $winrate * 100" | bc -l 2>/dev/null || echo "0"),
  "total_trades": $trade_count,
  "closed_trades": $closed_trade_count,
  "open_trades": $open_trades,
  "longs": $longs,
  "shorts": $shorts,
  "free_balance": $free_balance,
  "total_balance": $total_balance,
  "starting_capital": $starting_capital,
  "max_drawdown": $(echo "scale=2; $max_drawdown * 100" | bc -l 2>/dev/null || echo "0"),
  "current_drawdown": $(echo "scale=2; $current_drawdown * 100" | bc -l 2>/dev/null || echo "0"),
  "profit_factor": $(echo "scale=2; $profit_factor" | bc -l 2>/dev/null || echo "0"),
  "best_pair": "$best_pair",
  "best_rate": $best_rate,
  "run_time": "$first_trade"
}
EOF
}

# Main execution
results="["
first=true

if [ "$BOT_NAME" = "all" ]; then
    # Process all bots
    bot_count=$(jq '.bots | length' "$CONFIG_FILE")
    for ((i=0; i<bot_count; i++)); do
        name=$(jq -r ".bots[$i].name" "$CONFIG_FILE")
        url=$(jq -r ".bots[$i].url" "$CONFIG_FILE")
        username=$(jq -r ".bots[$i].username" "$CONFIG_FILE")
        password=$(jq -r ".bots[$i].password" "$CONFIG_FILE")
        
        [ "$first" = true ] || results+=","
        first=false
        
        bot_data=$(get_bot_summary "$name" "$url" "$username" "$password")
        results+="$bot_data"
    done
else
    # Process specific bot
    bot_data=$(jq ".bots[] | select(.name==\"$BOT_NAME\")" "$CONFIG_FILE")
    if [ -z "$bot_data" ]; then
        echo "Error: Bot '$BOT_NAME' not found in config" >&2
        exit 1
    fi
    
    name=$(echo "$bot_data" | jq -r '.name')
    url=$(echo "$bot_data" | jq -r '.url')
    username=$(echo "$bot_data" | jq -r '.username')
    password=$(echo "$bot_data" | jq -r '.password')
    
    bot_data=$(get_bot_summary "$name" "$url" "$username" "$password")
    results+="$bot_data"
fi

results+="]"

# Output formatted JSON
echo "$results" | jq '.'
