#!/bin/bash
# =============================================================================
# MULTIBOTDASHBOARD V10 - INSTALLATION SCRIPT
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║           MULTIBOTDASHBOARD V10 - INSTALLER                      ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed."
        exit 1
    fi
    if ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not installed."
        exit 1
    fi
    if ! docker info &> /dev/null; then
        log_error "Docker is not running."
        exit 1
    fi
    log_success "Prerequisites check passed!"
}

generate_secrets() {
    log_info "Setting secrets..."
    DB_PASSWORD="dashboard"
    JWT_SECRET=$(openssl rand -hex 32)
    export DB_PASSWORD JWT_SECRET
}

create_directories() {
    log_info "Creating directory structure..."
    mkdir -p {logs,backup_DB,data,config,db/init,db/postgres_data,db/redis_data}
    chmod -R 755 logs backup_DB data config db
}

create_env_file() {
    log_info "Creating environment configuration..."
    cat > .env << EOF
# Multibotdashboard V10 Configuration
PUBLIC_HOST=192.168.0.231
DB_USER=dashboard
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=dashboard
REDIS_PASSWORD=${DB_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
BACKEND_PORT=8000
FRONTEND_PORT=5000
ADMINER_PORT=8090
DISABLE_ALERTS=true
FREQTRADE_BASE_PATH=/opt
LOG_LEVEL=INFO
EOF
    chmod 600 .env
}

build_and_start() {
    log_info "Building Docker images..."
    docker compose build --no-cache
    
    log_info "Starting services..."
    docker compose up -d postgres redis
    
    log_info "Waiting for databases (30s)..."
    sleep 30
    
    log_info "Starting remaining services..."
    docker compose up -d backend frontend data-collector adminer
    
    log_success "All services started!"
}

print_summary() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║           INSTALLATION COMPLETE!                                 ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo "  • Dashboard:    http://localhost:5000"
    echo "  • API Docs:     http://localhost:8000/docs"
    echo "  • Adminer:      http://localhost:8090"
    echo ""
    echo -e "${BLUE}Default Login:${NC}"
    echo "  • Username: admin"
    echo "  • Password: admin"
    echo ""
    echo -e "${YELLOW}IMPORTANT: Change the default password immediately!${NC}"
    echo ""
    echo -e "${BLUE}Commands:${NC}"
    echo "  • Logs:    docker compose logs -f"
    echo "  • Stop:    docker compose down"
    echo "  • Restart: docker compose restart"
}

main() {
    print_banner
    check_prerequisites
    generate_secrets
    create_directories
    create_env_file
    build_and_start
    print_summary
}

main
