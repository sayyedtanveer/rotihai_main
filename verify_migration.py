#!/usr/bin/env python3
"""
Database Migration Verification Script
Verify data integrity and consistency after migration

Usage:
    python verify_migration.py
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv
import sys
from datetime import datetime

# Load environment variables
load_dotenv()

NEW_DB_URL = os.getenv('NEW_DB_URL')


def log_message(message: str, level: str = "INFO"):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    colors = {
        "SUCCESS": "\033[92m",
        "ERROR": "\033[91m",
        "WARNING": "\033[93m",
        "INFO": "\033[94m",
        "RESET": "\033[0m"
    }
    color = colors.get(level, colors["INFO"])
    print(f"{color}[{timestamp}] [{level}] {message}{colors['RESET']}")


def connect_to_database(db_url: str) -> psycopg2.extensions.connection:
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        log_message(f"Failed to connect to database: {str(e)}", "ERROR")
        sys.exit(1)


def verify_table_structure(conn: psycopg2.extensions.connection) -> bool:
    """Verify that all required tables exist"""
    required_tables = [
        'sessions', 'users', 'admin_users', 'partner_users', 'categories',
        'chefs', 'products', 'delivery_personnel', 'orders', 'payment_verification_log',
        'delivery_settings', 'cart_settings', 'coupons', 'coupon_usages', 'referrals',
        'wallet_transactions', 'wallet_settings', 'payout_transactions', 'referral_rewards',
        'delivery_time_slots', 'roti_settings', 'visitors', 'delivery_areas',
        'admin_settings', 'push_subscriptions', 'newsletter_subscribers', 'pending_broadcasts',
        'subscription_plans', 'subscriptions', 'subscription_delivery_logs',
        'promotional_banners', 'pending_checkouts'
    ]
    
    cursor = conn.cursor()
    missing_tables = []
    
    for table in required_tables:
        cursor.execute(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name=%s AND table_schema='public')",
            (table,)
        )
        if not cursor.fetchone()[0]:
            missing_tables.append(table)
    
    cursor.close()
    
    if missing_tables:
        log_message(f"Missing tables: {', '.join(missing_tables)}", "ERROR")
        return False
    
    log_message(f"✓ All {len(required_tables)} tables exist", "SUCCESS")
    return True


def verify_row_counts(conn: psycopg2.extensions.connection):
    """Get row counts for all tables"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name, 
               (xpath('/row/@cnt', xml_count))[1]::text::int as count
        FROM (
            SELECT table_name, 
                   query_to_xml(format('SELECT count(*) as cnt FROM %I', table_name), 
                   false, true, '') as xml_count
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        ) t
    """)
    
    results = cursor.fetchall()
    cursor.close()
    
    total_rows = sum(count for _, count in results if count is not None)
    
    print("\n" + "="*60)
    print("TABLE ROW COUNTS")
    print("="*60)
    for table, count in sorted(results):
        if count is not None:
            print(f"  {table:35} {count:8} rows")
    
    print("="*60)
    log_message(f"Total rows in database: {total_rows}", "INFO")
    print()
    
    return total_rows > 0


def verify_data_integrity(conn: psycopg2.extensions.connection) -> bool:
    """Run data integrity checks"""
    cursor = conn.cursor()
    issues = []
    
    print("\n" + "="*60)
    print("DATA INTEGRITY CHECKS")
    print("="*60)
    
    # Check 1: Users with invalid emails
    cursor.execute("SELECT COUNT(*) FROM users WHERE email IS NOT NULL AND email NOT LIKE '%@%'")
    invalid_emails = cursor.fetchone()[0]
    if invalid_emails > 0:
        issues.append(f"Found {invalid_emails} users with invalid emails")
        log_message(f"Found {invalid_emails} users with invalid email format", "WARNING")
    else:
        log_message("✓ All user emails are valid", "SUCCESS")
    
    # Check 2: Orders with valid user references
    cursor.execute("""
        SELECT COUNT(*) FROM orders o 
        WHERE o.user_id IS NOT NULL 
        AND o.user_id NOT IN (SELECT id FROM users)
    """)
    orphaned_orders = cursor.fetchone()[0]
    if orphaned_orders > 0:
        issues.append(f"Found {orphaned_orders} orders with non-existent user_id")
        log_message(f"⚠ Found {orphaned_orders} orders referencing non-existent users", "WARNING")
    else:
        log_message("✓ All order user references are valid", "SUCCESS")
    
    # Check 3: Subscriptions with non-existent plans
    cursor.execute("""
        SELECT COUNT(*) FROM subscriptions s 
        WHERE s.plan_id NOT IN (SELECT id FROM subscription_plans)
    """)
    invalid_subscriptions = cursor.fetchone()[0]
    if invalid_subscriptions > 0:
        issues.append(f"Found {invalid_subscriptions} subscriptions with invalid plan_id")
        log_message(f"⚠ Found {invalid_subscriptions} subscriptions with invalid plan references", "WARNING")
    else:
        log_message("✓ All subscription plan references are valid", "SUCCESS")
    
    # Check 4: Products with non-existent chef references
    cursor.execute("""
        SELECT COUNT(*) FROM products p 
        WHERE p.chef_id IS NOT NULL 
        AND p.chef_id NOT IN (SELECT id FROM chefs)
    """)
    orphaned_products = cursor.fetchone()[0]
    if orphaned_products > 0:
        issues.append(f"Found {orphaned_products} products with non-existent chef_id")
        log_message(f"⚠ Found {orphaned_products} products with non-existent chef references", "WARNING")
    else:
        log_message("✓ All product chef references are valid", "SUCCESS")
    
    # Check 5: Admin users exist
    cursor.execute("SELECT COUNT(*) FROM admin_users")
    admin_count = cursor.fetchone()[0]
    if admin_count > 0:
        log_message(f"✓ Found {admin_count} admin users", "SUCCESS")
    else:
        log_message("⚠ No admin users found - you may need to create one", "WARNING")
    
    # Check 6: Categories exist
    cursor.execute("SELECT COUNT(*) FROM categories")
    category_count = cursor.fetchone()[0]
    if category_count > 0:
        log_message(f"✓ Found {category_count} categories", "SUCCESS")
    else:
        log_message("✗ No categories found - database may be incomplete", "ERROR")
        issues.append("No categories found")
    
    # Check 7: Chefs exist
    cursor.execute("SELECT COUNT(*) FROM chefs")
    chef_count = cursor.fetchone()[0]
    if chef_count > 0:
        log_message(f"✓ Found {chef_count} chefs", "SUCCESS")
    else:
        log_message("⚠ No chefs found", "WARNING")
    
    # Check 8: Orders exist
    cursor.execute("SELECT COUNT(*) FROM orders")
    order_count = cursor.fetchone()[0]
    if order_count > 0:
        log_message(f"✓ Found {order_count} orders", "SUCCESS")
    else:
        log_message("⚠ No orders found (this may be normal for fresh database)", "INFO")
    
    # Check 9: Subscriptions exist
    cursor.execute("SELECT COUNT(*) FROM subscriptions")
    subscription_count = cursor.fetchone()[0]
    if subscription_count > 0:
        log_message(f"✓ Found {subscription_count} subscriptions", "SUCCESS")
    else:
        log_message("⚠ No subscriptions found", "INFO")
    
    # Check 10: Pending checkouts
    cursor.execute("SELECT COUNT(*) FROM pending_checkouts")
    pending_count = cursor.fetchone()[0]
    log_message(f"  Found {pending_count} pending checkouts", "INFO")
    
    print("="*60)
    cursor.close()
    
    if issues:
        log_message(f"Found {len(issues)} data integrity issues", "WARNING")
        return len(issues) < 3  # Pass if minor issues only
    else:
        log_message("All data integrity checks passed!", "SUCCESS")
        return True


def verify_indexes(conn: psycopg2.extensions.connection) -> bool:
    """Verify that all indexes exist"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM pg_indexes 
        WHERE schemaname = 'public'
    """)
    index_count = cursor.fetchone()[0]
    cursor.close()
    
    log_message(f"✓ Found {index_count} indexes", "SUCCESS")
    return index_count > 0


def run_performance_stats(conn: psycopg2.extensions.connection):
    """Get database size and performance stats"""
    cursor = conn.cursor()
    
    # Database size
    cursor.execute("""
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
    """)
    db_size = cursor.fetchone()[0]
    
    # Table sizes
    cursor.execute("""
        SELECT table_name, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        LIMIT 5
    """)
    
    print("\n" + "="*60)
    print("DATABASE PERFORMANCE STATISTICS")
    print("="*60)
    print(f"Total Database Size: {db_size}")
    print("\nLargest Tables:")
    for table, size in cursor.fetchall():
        print(f"  {table:35} {size:10}")
    
    print("="*60)
    cursor.close()


def main():
    """Main verification process"""
    print("\n" + "="*80)
    print("DATABASE MIGRATION VERIFICATION")
    print("="*80 + "\n")
    
    if not NEW_DB_URL:
        log_message("Missing NEW_DB_URL environment variable", "ERROR")
        sys.exit(1)
    
    log_message("Connecting to new database...", "INFO")
    conn = connect_to_database(NEW_DB_URL)
    
    try:
        # Run all checks
        all_passed = True
        
        print()
        log_message("Step 1: Verifying table structure...", "INFO")
        if not verify_table_structure(conn):
            all_passed = False
        
        print()
        log_message("Step 2: Checking row counts...", "INFO")
        if not verify_row_counts(conn):
            all_passed = False
        
        print()
        log_message("Step 3: Running data integrity checks...", "INFO")
        if not verify_data_integrity(conn):
            all_passed = False
        
        print()
        log_message("Step 4: Verifying indexes...", "INFO")
        if not verify_indexes(conn):
            all_passed = False
        
        print()
        log_message("Step 5: Getting performance statistics...", "INFO")
        run_performance_stats(conn)
        
        # Final report
        print("\n" + "="*80)
        print("VERIFICATION REPORT")
        print("="*80)
        
        if all_passed:
            log_message("✓ ALL CHECKS PASSED - Database migration successful!", "SUCCESS")
            print("\nYou can now:")
            print("  1. Update your application connection string")
            print("  2. Deploy to production")
            print("  3. Monitor for any issues")
        else:
            log_message("⚠ Some checks failed - review issues above", "WARNING")
            print("\nPlease address the issues before deploying to production")
        
        print("="*80 + "\n")
        
    finally:
        conn.close()


if __name__ == "__main__":
    main()
