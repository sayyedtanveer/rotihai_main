#!/bin/bash

# ==============================================================================
# DATABASE MANAGEMENT AUTOMATION SCRIPT
# ==============================================================================
# This script automates database setup, verification, and maintenance
# Use this for quick database operations
# ==============================================================================

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Database configurations
LOCAL_DB_NAME="${LOCAL_DB_NAME:-replitrotihai_local}"
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_HOST="${LOCAL_DB_HOST:-localhost}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"

PROD_DB_URL="${DATABASE_URL:-}"
PROD_DB_NAME="${PROD_DB_NAME:-replitrotihai_prod}"

# Backup directory
BACKUP_DIR="./database-backups"
mkdir -p "$BACKUP_DIR"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================

print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# ==============================================================================
# DATABASE OPERATIONS
# ==============================================================================

# Create a new local database
create_local_db() {
    print_header "Creating Local Database"
    
    print_info "Database: $LOCAL_DB_NAME"
    print_info "User: $LOCAL_DB_USER"
    
    if psql -U "$LOCAL_DB_USER" -h "$LOCAL_DB_HOST" -lqt | cut -d \| -f 1 | grep -qw "$LOCAL_DB_NAME"; then
        print_error "Database '$LOCAL_DB_NAME' already exists"
        read -p "Drop and recreate? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            dropdb -U "$LOCAL_DB_USER" -h "$LOCAL_DB_HOST" "$LOCAL_DB_NAME" || true
            createdb -U "$LOCAL_DB_USER" -h "$LOCAL_DB_HOST" "$LOCAL_DB_NAME"
        else
            return 1
        fi
    else
        createdb -U "$LOCAL_DB_USER" -h "$LOCAL_DB_HOST" "$LOCAL_DB_NAME"
    fi
    
    print_success "Database created"
}

# Apply full migration
apply_migration() {
    local db_target=$1  # "local" or "production"
    local db_name=$2
    local db_user=$3
    local db_host=$4
    local db_port=$5
    
    print_header "Applying Migration to $db_target"
    
    if [[ ! -f "$SCRIPT_DIR/FULL_DATABASE_MIGRATION.sql" ]]; then
        print_error "Migration file not found: $SCRIPT_DIR/FULL_DATABASE_MIGRATION.sql"
        return 1
    fi
    
    print_info "Running SQL migration..."
    
    if [[ "$db_target" == "production" ]] && [[ -n "$PROD_DB_URL" ]]; then
        # Use connection string for production
        psql "$PROD_DB_URL" -f "$SCRIPT_DIR/FULL_DATABASE_MIGRATION.sql"
    else
        # Use individual parameters for local
        PGPASSWORD="${LOCAL_DB_PASS:-}" \
        psql -U "$db_user" -h "$db_host" -p "$db_port" -d "$db_name" \
            -f "$SCRIPT_DIR/FULL_DATABASE_MIGRATION.sql"
    fi
    
    print_success "Migration applied"
}

# Verify database
verify_database() {
    local db_target=$1
    local db_name=$2
    local db_user=$3
    local db_host=$4
    local db_port=$5
    
    print_header "Verifying Database Structure"
    
    if [[ ! -f "$SCRIPT_DIR/VERIFY_DATABASE.sql" ]]; then
        print_error "Verification script not found"
        return 1
    fi
    
    if [[ "$db_target" == "production" ]] && [[ -n "$PROD_DB_URL" ]]; then
        psql "$PROD_DB_URL" -f "$SCRIPT_DIR/VERIFY_DATABASE.sql"
    else
        PGPASSWORD="${LOCAL_DB_PASS:-}" \
        psql -U "$db_user" -h "$db_host" -p "$db_port" -d "$db_name" \
            -f "$SCRIPT_DIR/VERIFY_DATABASE.sql"
    fi
}

# Quick table count check
quick_check() {
    local db_target=$1
    local db_name=$2
    local db_user=$3
    local db_host=$4
    local db_port=$5
    
    print_info "Running quick database check..."
    
    local query="SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';"
    
    if [[ "$db_target" == "production" ]] && [[ -n "$PROD_DB_URL" ]]; then
        psql "$PROD_DB_URL" -c "$query"
    else
        PGPASSWORD="${LOCAL_DB_PASS:-}" \
        psql -U "$db_user" -h "$db_host" -p "$db_port" -d "$db_name" -c "$query"
    fi
}

# Backup database
backup_database() {
    local db_target=$1
    local db_name=$2
    local db_user=$3
    local db_host=$4
    local db_port=$5
    
    print_header "Backing Up Database"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_${db_target}_${timestamp}.sql"
    
    print_info "Creating backup: $backup_file"
    
    if [[ "$db_target" == "production" ]] && [[ -n "$PROD_DB_URL" ]]; then
        pg_dump "$PROD_DB_URL" > "$backup_file"
    else
        PGPASSWORD="${LOCAL_DB_PASS:-}" \
        pg_dump -U "$db_user" -h "$db_host" -p "$db_port" "$db_name" > "$backup_file"
    fi
    
    print_success "Backup created: $backup_file"
    ls -lh "$backup_file"
}

# Compare databases
compare_databases() {
    print_header "Comparing Databases"
    
    if [[ ! -f "$SCRIPT_DIR/COMPARE_DATABASES.sql" ]]; then
        print_error "Comparison script not found"
        return 1
    fi
    
    print_info "Generating local database profile..."
    PGPASSWORD="${LOCAL_DB_PASS:-}" \
    psql -U "$LOCAL_DB_USER" -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -d "$LOCAL_DB_NAME" \
        -f "$SCRIPT_DIR/COMPARE_DATABASES.sql" > "$BACKUP_DIR/local_schema_profile.txt"
    
    print_success "Local profile saved: $BACKUP_DIR/local_schema_profile.txt"
    
    if [[ -n "$PROD_DB_URL" ]]; then
        print_info "Generating production database profile..."
        psql "$PROD_DB_URL" -f "$SCRIPT_DIR/COMPARE_DATABASES.sql" > "$BACKUP_DIR/prod_schema_profile.txt"
        print_success "Production profile saved: $BACKUP_DIR/prod_schema_profile.txt"
        
        print_info "Differences:"
        diff "$BACKUP_DIR/local_schema_profile.txt" "$BACKUP_DIR/prod_schema_profile.txt" || true
    fi
}

# Reset database data (development only)
reset_database_data() {
    print_header "Resetting Database Data"
    
    print_error "⚠️  WARNING: This will DELETE ALL DATA but keep the schema!"
    read -p "Are you sure? Type 'YES' to confirm: " confirmation
    
    if [[ "$confirmation" != "YES" ]]; then
        print_info "Reset cancelled"
        return 0
    fi
    
    if [[ ! -f "$SCRIPT_DIR/RESET_DATABASE_DATA.sql" ]]; then
        print_error "Reset script not found"
        return 1
    fi
    
    print_info "Resetting data..."
    PGPASSWORD="${LOCAL_DB_PASS:-}" \
    psql -U "$LOCAL_DB_USER" -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -d "$LOCAL_DB_NAME" \
        -f "$SCRIPT_DIR/RESET_DATABASE_DATA.sql"
    
    print_success "Database data reset complete"
}

# Seed initial data
seed_data() {
    print_header "Seeding Initial Data"
    
    print_info "Running seed scripts..."
    
    if command -v npm &> /dev/null; then
        npm run seed || print_error "Seed script failed (check if seed script exists)"
    else
        print_error "npm not found - cannot run seed"
    fi
}

# ==============================================================================
# MAIN MENU
# ==============================================================================

show_menu() {
    echo ""
    echo -e "${BLUE}Database Management Menu${NC}"
    echo "1. Create local database"
    echo "2. Apply migration to local"
    echo "3. Verify local database"
    echo "4. Quick check local database"
    echo "5. Backup local database"
    echo "6. Backup production database"
    echo "7. Compare local vs production schemas"
    echo "8. Reset database data (DEV ONLY)"
    echo "9. Seed initial data"
    echo "10. Full setup (create + migrate + verify)"
    echo "11. Production: Apply migration"
    echo "12. Production: Verify database"
    echo "0. Exit"
    echo ""
}

# ==============================================================================
# MAIN SCRIPT
# ==============================================================================

main() {
    print_header "Replitrotihai Database Manager"
    
    print_info "Loaded configuration:"
    print_info "  Local DB: $LOCAL_DB_NAME@$LOCAL_DB_HOST:$LOCAL_DB_PORT"
    print_info "  Production: ${PROD_DB_URL:-(not configured)}"
    echo ""
    
    while true; do
        show_menu
        read -p "Select option (0-12): " choice
        
        case $choice in
            1)
                create_local_db
                ;;
            2)
                apply_migration "local" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT"
                ;;
            3)
                verify_database "local" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT"
                ;;
            4)
                quick_check "local" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT"
                ;;
            5)
                backup_database "local" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT"
                ;;
            6)
                if [[ -z "$PROD_DB_URL" ]]; then
                    print_error "Production database URL not configured (DATABASE_URL)"
                else
                    backup_database "production" "$PROD_DB_NAME" "" "" ""
                fi
                ;;
            7)
                compare_databases
                ;;
            8)
                reset_database_data
                ;;
            9)
                seed_data
                ;;
            10)
                create_local_db && \
                apply_migration "local" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" && \
                verify_database "local" "$LOCAL_DB_NAME" "$LOCAL_DB_USER" "$LOCAL_DB_HOST" "$LOCAL_DB_PORT"
                ;;
            11)
                if [[ -z "$PROD_DB_URL" ]]; then
                    print_error "Production database URL not configured (DATABASE_URL)"
                else
                    print_error "⚠️  BACKUP FIRST!"
                    sleep 2
                    backup_database "production" "$PROD_DB_NAME" "" "" "" && \
                    apply_migration "production" "$PROD_DB_NAME" "" "" ""
                fi
                ;;
            12)
                if [[ -z "$PROD_DB_URL" ]]; then
                    print_error "Production database URL not configured (DATABASE_URL)"
                else
                    verify_database "production" "$PROD_DB_NAME" "" "" ""
                fi
                ;;
            0)
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option"
                ;;
        esac
    done
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi
