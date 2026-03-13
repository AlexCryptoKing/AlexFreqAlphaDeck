#!/bin/bash
# Freqtrade Bot Controller
# Usage: ./bot-control.sh <command> [bot_name|all]
#
# Commands:
#   stop <bot>      - Stop trading (graceful)
#   stopbuy <bot>   - Stop buying (sell open trades)
#   reload <bot>    - Reload configuration
#   status <bot>    - Get bot status
#   ping <bot>      - Check if bot is alive
#   list            - List all bots

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/config.json"
COMMAND="$1"
BOT_NAME="$2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is required${NC}"
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required${NC}"
    exit 1
fi

# Get bot info from config
get_bot_info() {
    local name="$1"
    jq ".bots[] | select(.name==\"$name\")" "$CONFIG_FILE"
}

# Get auth header
get_auth() {
    local username="$1"
    local password="$2"
    echo -n "$username:$password" | base64 -w0
}

# Send API command
send_command() {
    local url="$1"
    local username="$2"
    local password="$3"
    local endpoint="$4"
    local method="${5:-POST}"
    
    local auth=$(get_auth "$username" "$password")
    
    if [ "$method" = "GET" ]; then
        curl -s -m 10 -H "Authorization: Basic $auth" "$url$endpoint" 2>/dev/null
    else
        curl -s -m 10 -X POST -H "Authorization: Basic $auth" "$url$endpoint" 2>/dev/null
    fi
}

# List all bots
list_bots() {
    echo "Available bots:"
    echo "==============="
    jq -r '.bots[] | "  \(.name) - \(.url) [\(.mode)]"' "$CONFIG_FILE"
}

# Stop bot
stop_bot() {
    local name="$1"
    local bot=$(get_bot_info "$name")
    
    if [ -z "$bot" ]; then
        echo -e "${RED}Bot '$name' not found${NC}"
        return 1
    fi
    
    local url=$(echo "$bot" | jq -r '.url')
    local username=$(echo "$bot" | jq -r '.username')
    local password=$(echo "$bot" | jq -r '.password')
    
    echo -n "Stopping $name... "
    local response=$(send_command "$url" "$username" "$password" "/api/v1/stop")
    
    if [ -n "$response" ]; then
        echo -e "${GREEN}✓ Stopped${NC}"
        echo "$response" | jq -r '.status // .message // "Unknown response"' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed (no response)${NC}"
        return 1
    fi
}

# Stop buying (keep selling)
stopbuy_bot() {
    local name="$1"
    local bot=$(get_bot_info "$name")
    
    if [ -z "$bot" ]; then
        echo -e "${RED}Bot '$name' not found${NC}"
        return 1
    fi
    
    local url=$(echo "$bot" | jq -r '.url')
    local username=$(echo "$bot" | jq -r '.username')
    local password=$(echo "$bot" | jq -r '.password')
    
    echo -n "Stopping buys for $name... "
    local response=$(send_command "$url" "$username" "$password" "/api/v1/stopbuy")
    
    if [ -n "$response" ]; then
        echo -e "${YELLOW}✓ Buy orders stopped (will continue selling)${NC}"
        echo "$response" | jq -r '.status // .message // "Unknown response"' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Reload config
reload_bot() {
    local name="$1"
    local bot=$(get_bot_info "$name")
    
    if [ -z "$bot" ]; then
        echo -e "${RED}Bot '$name' not found${NC}"
        return 1
    fi
    
    local url=$(echo "$bot" | jq -r '.url')
    local username=$(echo "$bot" | jq -r '.username')
    local password=$(echo "$bot" | jq -r '.password')
    
    echo -n "Reloading config for $name... "
    local response=$(send_command "$url" "$username" "$password" "/api/v1/reload_config")
    
    if [ -n "$response" ]; then
        echo -e "${GREEN}✓ Config reloaded${NC}"
        echo "$response" | jq -r '.status // .message // "Unknown response"' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Failed${NC}"
        return 1
    fi
}

# Get bot status
bot_status() {
    local name="$1"
    local bot=$(get_bot_info "$name")
    
    if [ -z "$bot" ]; then
        echo -e "${RED}Bot '$name' not found${NC}"
        return 1
    fi
    
    local url=$(echo "$bot" | jq -r '.url')
    local username=$(echo "$bot" | jq -r '.username')
    local password=$(echo "$bot" | jq -r '.password')
    local mode=$(echo "$bot" | jq -r '.mode')
    
    echo "Checking $name [$mode]..."
    local response=$(send_command "$url" "$username" "$password" "/api/v1/ping" "GET")
    
    if [ -n "$response" ]; then
        local status=$(echo "$response" | jq -r '.status // "unknown"' 2>/dev/null)
        local version=$(echo "$response" | jq -r '.version // "unknown"' 2>/dev/null)
        echo -e "  Status: ${GREEN}$status${NC}"
        echo "  Version: $version"
        
        # Get more details
        local profit_response=$(send_command "$url" "$username" "$password" "/api/v1/profit" "GET")
        if [ -n "$profit_response" ]; then
            local profit=$(echo "$profit_response" | jq -r '.profit_all_fiat // 0')
            local trades=$(echo "$profit_response" | jq -r '.trade_count // 0')
            printf "  P&L: %.2f USDT | Trades: %d\n" "$profit" "$trades"
        fi
    else
        echo -e "  Status: ${RED}OFFLINE${NC}"
    fi
}

# Ping bot
ping_bot() {
    local name="$1"
    local bot=$(get_bot_info "$name")
    
    if [ -z "$bot" ]; then
        echo -e "${RED}Bot '$name' not found${NC}"
        return 1
    fi
    
    local url=$(echo "$bot" | jq -r '.url')
    local username=$(echo "$bot" | jq -r '.username')
    local password=$(echo "$bot" | jq -r '.password')
    
    echo -n "Pinging $name... "
    local response=$(send_command "$url" "$username" "$password" "/api/v1/ping" "GET")
    
    if [ -n "$response" ]; then
        echo -e "${GREEN}✓ Online${NC}"
    else
        echo -e "${RED}✗ Offline${NC}"
    fi
}

# Process all bots
process_all() {
    local cmd="$1"
    local bot_count=$(jq '.bots | length' "$CONFIG_FILE")
    
    echo "Processing all $bot_count bots..."
    echo ""
    
    for ((i=0; i<bot_count; i++)); do
        local name=$(jq -r ".bots[$i].name" "$CONFIG_FILE")
        case "$cmd" in
            stop) stop_bot "$name" ;;
            stopbuy) stopbuy_bot "$name" ;;
            reload) reload_bot "$name" ;;
            status) bot_status "$name" ;;
            ping) ping_bot "$name" ;;
        esac
        echo ""
    done
}

# Show usage
show_usage() {
    echo "Freqtrade Bot Controller"
    echo "========================"
    echo ""
    echo "Usage: $0 <command> [bot_name|all]"
    echo ""
    echo "Commands:"
    echo "  list              - List all bots"
    echo "  stop <bot|all>    - Stop trading (graceful shutdown)"
    echo "  stopbuy <bot|all> - Stop buying (continue selling open trades)"
    echo "  reload <bot|all>  - Reload bot configuration"
    echo "  status <bot|all>  - Get detailed bot status"
    echo "  ping <bot|all>    - Quick ping check"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 ping BandSniper-LIVE-9030"
    echo "  $0 stop NinjaAI-V4-9080"
    echo "  $0 stopbuy all"
    echo "  $0 status all"
}

# Main
if [ -z "$COMMAND" ]; then
    show_usage
    exit 1
fi

case "$COMMAND" in
    list)
        list_bots
        ;;
    stop)
        if [ -z "$BOT_NAME" ]; then
            echo -e "${RED}Error: Bot name required${NC}"
            show_usage
            exit 1
        elif [ "$BOT_NAME" = "all" ]; then
            process_all "stop"
        else
            stop_bot "$BOT_NAME"
        fi
        ;;
    stopbuy)
        if [ -z "$BOT_NAME" ]; then
            echo -e "${RED}Error: Bot name required${NC}"
            show_usage
            exit 1
        elif [ "$BOT_NAME" = "all" ]; then
            process_all "stopbuy"
        else
            stopbuy_bot "$BOT_NAME"
        fi
        ;;
    reload)
        if [ -z "$BOT_NAME" ]; then
            echo -e "${RED}Error: Bot name required${NC}"
            show_usage
            exit 1
        elif [ "$BOT_NAME" = "all" ]; then
            process_all "reload"
        else
            reload_bot "$BOT_NAME"
        fi
        ;;
    status)
        if [ -z "$BOT_NAME" ]; then
            echo -e "${RED}Error: Bot name required${NC}"
            show_usage
            exit 1
        elif [ "$BOT_NAME" = "all" ]; then
            process_all "status"
        else
            bot_status "$BOT_NAME"
        fi
        ;;
    ping)
        if [ -z "$BOT_NAME" ]; then
            echo -e "${RED}Error: Bot name required${NC}"
            show_usage
            exit 1
        elif [ "$BOT_NAME" = "all" ]; then
            process_all "ping"
        else
            ping_bot "$BOT_NAME"
        fi
        ;;
    *)
        echo -e "${RED}Unknown command: $COMMAND${NC}"
        show_usage
        exit 1
        ;;
esac
