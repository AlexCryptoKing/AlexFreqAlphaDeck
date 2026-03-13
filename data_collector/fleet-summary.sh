#!/bin/bash
# Freqtrade Fleet Summary Report Generator - Linux Version
# Usage: ./fleet-summary.sh [telegram|text]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
DATA_DIR="$SCRIPT_DIR/data"
OUTPUT_FORMAT="${1:-telegram}"

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required. Install with: apt-get install jq"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo "Error: curl is required."
    exit 1
fi

if ! command -v bc &> /dev/null; then
    echo "Error: bc is required. Install with: apt-get install bc"
    exit 1
fi

# Get bot summary function
get_bot_summary() {
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
        echo "{\"name\":\"$name\",\"state\":\"error\",\"mode\":\"$mode\",\"error\":\"API unreachable\"}"
        return
    fi
    
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
    
    local total_balance=$(echo "$balance_response" | jq -r '.total // 0')
    local starting_capital=$(echo "$balance_response" | jq -r '.starting_capital // 0')
    
    local open_trades=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true)] | length')
    local longs=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true and .is_short==false)] | length')
    local shorts=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true and .is_short==true)] | length')
    
    # Get best/worst open trades
    local worst_trade=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true)] | sort_by(.profit_ratio) | first | {pair: (.pair // "N/A"), profit_pct: ((.profit_pct // 0) * 100 | round / 100)}' 2>/dev/null)
    local best_trade=$(echo "$status_response" | jq -r '[.[] | select(.is_open==true)] | sort_by(.profit_ratio) | reverse | first | {pair: (.pair // "N/A"), profit_pct: ((.profit_pct // 0) * 100 | round / 100)}' 2>/dev/null)
    
    cat <<EOF
{
  "name": "$name",
  "state": "running",
  "mode": "$mode",
  "strategy": "$strategy",
  "closed_profit": $(echo "scale=2; $closed_profit" | bc),
  "closed_profit_pct": $(echo "scale=2; $closed_profit_pct" | bc),
  "total_profit": $(echo "scale=2; $total_profit" | bc),
  "total_profit_pct": $(echo "scale=2; $total_profit_pct" | bc),
  "win_rate": $(echo "scale=1; $winrate * 100" | bc),
  "total_trades": $trade_count,
  "closed_trades": $closed_trade_count,
  "open_trades": $open_trades,
  "longs": $longs,
  "shorts": $shorts,
  "total_balance": $(echo "scale=2; $total_balance" | bc),
  "starting_capital": $(echo "scale=2; $starting_capital" | bc),
  "max_drawdown": $(echo "scale=2; $max_drawdown * 100" | bc),
  "current_drawdown": $(echo "scale=2; $current_drawdown * 100" | bc),
  "profit_factor": $(echo "scale=2; $profit_factor" | bc),
  "best_pair": "$best_pair",
  "best_rate": $best_rate,
  "worst_open": $worst_trade,
  "best_open": $best_trade
}
EOF
}

# Get previous snapshot for comparison
get_previous_snapshot() {
    local yesterday=$(date -d "yesterday" +%Y-%m-%d)
    local files=$(ls -1 "$DATA_DIR"/snapshot_*${yesterday}*.json 2>/dev/null | sort -r | head -1)
    
    if [ -z "$files" ]; then
        # Get most recent
        files=$(ls -1t "$DATA_DIR"/snapshot_*.json 2>/dev/null | head -1)
    fi
    
    if [ -n "$files" ] && [ -f "$files" ]; then
        cat "$files"
    fi
}

# Calculate delta between current and previous
get_bot_delta() {
    local bot_name="$1"
    local current_value="$2"
    local prev_bots="$3"
    local property="$4"
    
    if [ -z "$prev_bots" ]; then
        echo ""
        return
    fi
    
    local prev_value=$(echo "$prev_bots" | jq -r ".[] | select(.name==\"$bot_name\") | .$property // 0")
    if [ -z "$prev_value" ] || [ "$prev_value" = "0" ] || [ "$prev_value" = "null" ]; then
        echo ""
        return
    fi
    
    local delta=$(echo "scale=2; $current_value - $prev_value" | bc)
    echo "$delta"
}

# Format bot line for summary
format_bot_line() {
    local bot="$1"
    local prev_bots="$2"
    
    local name=$(echo "$bot" | jq -r '.name')
    local state=$(echo "$bot" | jq -r '.state')
    local mode=$(echo "$bot" | jq -r '.mode')
    local total_profit=$(echo "$bot" | jq -r '.total_profit')
    local total_profit_pct=$(echo "$bot" | jq -r '.total_profit_pct')
    local win_rate=$(echo "$bot" | jq -r '.win_rate')
    local open_trades=$(echo "$bot" | jq -r '.open_trades')
    
    if [ "$state" = "error" ]; then
        local mode_tag="[DRY]"
        [ "$mode" = "live" ] && mode_tag="[LIVE]"
        echo "X $name $mode_tag - ERROR"
        return
    fi
    
    local profit_emoji=""
    local mode_tag="[DRY]"
    [ "$mode" = "live" ] && mode_tag="[LIVE]"
    
    local delta_str=""
    if [ -n "$prev_bots" ]; then
        local delta=$(get_bot_delta "$name" "$total_profit" "$prev_bots" "profit_all_fiat")
        if [ -n "$delta" ]; then
            local delta_sign=""
            if (( $(echo "$delta > 0" | bc -l) )); then
                delta_sign="+"
            fi
            delta_str=" ($delta_sign$delta)"
        fi
    fi
    
    local profit_sign=""
    if (( $(echo "$total_profit >= 0" | bc -l) )); then
        profit_sign="+"
    fi
    
    echo "$name $mode_tag | $profit_sign${total_profit} USDT$delta_str ($profit_sign${total_profit_pct}%) | WR: ${win_rate}% | Open: ${open_trades}"
}

# Format detailed bot view
format_detailed_bot() {
    local bot="$1"
    local prev_bots="$2"
    
    local name=$(echo "$bot" | jq -r '.name')
    local state=$(echo "$bot" | jq -r '.state')
    local mode=$(echo "$bot" | jq -r '.mode')
    
    if [ "$state" = "error" ]; then
        echo "**$name** - Error: API unreachable"
        return
    fi
    
    local total_profit=$(echo "$bot" | jq -r '.total_profit')
    local total_profit_pct=$(echo "$bot" | jq -r '.total_profit_pct')
    local win_rate=$(echo "$bot" | jq -r '.win_rate')
    local profit_factor=$(echo "$bot" | jq -r '.profit_factor')
    local closed_trades=$(echo "$bot" | jq -r '.closed_trades')
    local open_trades=$(echo "$bot" | jq -r '.open_trades')
    local current_drawdown=$(echo "$bot" | jq -r '.current_drawdown')
    local max_drawdown=$(echo "$bot" | jq -r '.max_drawdown')
    local total_balance=$(echo "$bot" | jq -r '.total_balance')
    local longs=$(echo "$bot" | jq -r '.longs')
    local shorts=$(echo "$bot" | jq -r '.shorts')
    
    local profit_sign=""
    if (( $(echo "$total_profit >= 0" | bc -l) )); then
        profit_sign="+"
    fi
    
    local mode_tag="DRY RUN"
    [ "$mode" = "live" ] && mode_tag="LIVE"
    
    local delta_str=""
    if [ -n "$prev_bots" ]; then
        local profit_delta=$(get_bot_delta "$name" "$total_profit" "$prev_bots" "profit_all_fiat")
        local balance_delta=$(get_bot_delta "$name" "$total_balance" "$prev_bots" "total_balance")
        if [ -n "$profit_delta" ] || [ -n "$balance_delta" ]; then
            delta_str=" [24h:"
            if [ -n "$profit_delta" ]; then
                local ps=""
                if (( $(echo "$profit_delta > 0" | bc -l) )); then
                    ps="+"
                fi
                delta_str="${delta_str} P&L $ps$profit_delta"
            fi
            if [ -n "$balance_delta" ]; then
                local bs=""
                if (( $(echo "$balance_delta > 0" | bc -l) )); then
                    bs="+"
                fi
                delta_str="${delta_str} | Bal $bs$balance_delta"
            fi
            delta_str="${delta_str}]"
        fi
    fi
    
    cat <<EOF
**$name** ($mode_tag)$delta_str
   Profit: $profit_sign${total_profit} USDT ($profit_sign${total_profit_pct}%) | WR: ${win_rate}% | PF: ${profit_factor}
   Trades: ${closed_trades} closed / ${open_trades} open | DD: ${current_drawdown}% current, ${max_drawdown}% max
   Balance: ${total_balance} USDT | Open: ${longs}L / ${shorts}S
EOF
}

# Main execution
echo "Fetching bot data..." >&2

# Get previous snapshot
prev_snapshot=$(get_previous_snapshot)
prev_bots=""
compare_date="N/A"
if [ -n "$prev_snapshot" ]; then
    prev_bots=$(echo "$prev_snapshot" | jq -r '.bots // empty')
    compare_date=$(echo "$prev_snapshot" | jq -r '[.date, .time] | join(" ")')
fi

# Collect all bot data
bots_data="["
first=true
bot_count=$(jq '.bots | length' "$CONFIG_FILE")

for ((i=0; i<bot_count; i++)); do
    name=$(jq -r ".bots[$i].name" "$CONFIG_FILE")
    url=$(jq -r ".bots[$i].url" "$CONFIG_FILE")
    username=$(jq -r ".bots[$i].username" "$CONFIG_FILE")
    password=$(jq -r ".bots[$i].password" "$CONFIG_FILE")
    mode=$(jq -r ".bots[$i].mode" "$CONFIG_FILE")
    strategy=$(jq -r ".bots[$i].strategy" "$CONFIG_FILE")
    
    echo "Checking $name..." >&2
    
    [ "$first" = true ] || bots_data+=","
    first=false
    
    bot_info=$(get_bot_summary "$name" "$url" "$username" "$password" "$mode" "$strategy")
    bots_data+="$bot_info"
done

bots_data+="]"

# Calculate fleet totals
running_bots=$(echo "$bots_data" | jq '[.[] | select(.state=="running")]')
running_count=$(echo "$running_bots" | jq 'length')
error_count=$(echo "$bots_data" | jq '[.[] | select(.state=="error")] | length')

total_profit=$(echo "$running_bots" | jq -r '[.[].total_profit] | add // 0')
total_balance=$(echo "$running_bots" | jq -r '[.[].total_balance] | add // 0')
total_starting=$(echo "$running_bots" | jq -r '[.[].starting_capital] | add // 0')
total_open=$(echo "$running_bots" | jq -r '[.[].open_trades] | add // 0')

live_count=$(echo "$running_bots" | jq '[.[] | select(.mode=="live")] | length')
dry_count=$(echo "$running_bots" | jq '[.[] | select(.mode=="dry_run")] | length')
live_bots=$(echo "$running_bots" | jq '[.[] | select(.mode=="live")]')

# Fleet delta calculation
fleet_delta_str=""
if [ -n "$prev_bots" ]; then
    prev_running=$(echo "$prev_bots" | jq '[.[] | select(.state=="running")]')
    prev_total_profit=$(echo "$prev_running" | jq -r '[.[].profit_all_fiat // 0] | add // 0')
    prev_total_balance=$(echo "$prev_running" | jq -r '[.[].total_balance // 0] | add // 0')
    
    if [ "$prev_total_profit" != "0" ] || [ "$prev_total_balance" != "0" ]; then
        profit_delta=$(echo "scale=2; $total_profit - $prev_total_profit" | bc)
        balance_delta=$(echo "scale=2; $total_balance - $prev_total_balance" | bc)
        
        profit_sign=""
        if (( $(echo "$profit_delta >= 0" | bc -l) )); then
            profit_sign="+"
        fi
        
        balance_sign=""
        if (( $(echo "$balance_delta >= 0" | bc -l) )); then
            balance_sign="+"
        fi
        
        fleet_delta_str=" [vs ${compare_date}: P&L $profit_sign${profit_delta} | Bal $balance_sign${balance_delta}]"
    fi
fi

# Generate report
current_time=$(date +"%Y-%m-%d %H:%M")
total_profit_rounded=$(echo "scale=2; $total_profit" | bc)
total_balance_rounded=$(echo "scale=2; $total_balance" | bc)

cat <<EOF
FREQTRADE FLEET REPORT
$current_time

FLEET OVERVIEW
Total Bots: $bot_count | Running: $running_count | Errors: $error_count
Live Trading: $live_count | Dry Run: $dry_count

COMBINED PERFORMANCE$fleet_delta_str
Total P&L: $(if (( $(echo "$total_profit >= 0" | bc -l) )); then echo -n "+"; fi)${total_profit_rounded} USDT | Balance: ${total_balance_rounded} USDT
Total Open Trades: $total_open

BOT STATUS (vs previous: ${compare_date})
EOF

# Bot status lines
bot_count=$(echo "$bots_data" | jq 'length')
for ((i=0; i<bot_count; i++)); do
    bot=$(echo "$bots_data" | jq -r ".[$i]")
    format_bot_line "$bot" "$prev_bots"
done

echo ""
echo "DETAILED VIEW (Top 5 by Balance)"

# Top 5 by balance
top_bots=$(echo "$running_bots" | jq -r 'sort_by(.total_balance) | reverse | .[0:5]')
top_count=$(echo "$top_bots" | jq 'length')

for ((i=0; i<top_count; i++)); do
    bot=$(echo "$top_bots" | jq -r ".[$i]")
    echo ""
    format_detailed_bot "$bot" "$prev_bots"
done

# Live bots section
if [ "$live_count" -gt 0 ]; then
    echo ""
    echo "LIVE BOTS (Real Money)"
    
    live_count_arr=$(echo "$live_bots" | jq 'length')
    for ((i=0; i<live_count_arr; i++)); do
        bot=$(echo "$live_bots" | jq -r ".[$i]")
        echo ""
        format_detailed_bot "$bot" "$prev_bots"
    done
fi
