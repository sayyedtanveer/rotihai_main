#!/usr/bin/env python3
"""
Database Migration Script: Old Production → New Production
Migrates all data from old Neon database to new Neon database

Usage:
    python migrate_database.py
    
Requirements:
    pip install psycopg2-binary python-dotenv
"""

import psycopg2
from psycopg2 import sql
import os
from dotenv import load_dotenv
import sys
from datetime import datetime
from typing import Dict, List, Tuple

# Load environment variables
load_dotenv()

# Configuration
OLD_DB_URL = os.getenv('OLD_DB_URL')
NEW_DB_URL = os.getenv('NEW_DB_URL')

# Tables to migrate (in order to handle foreign keys)
TABLES_TO_MIGRATE = [
    # Core tables with no dependencies
    ('sessions', ['sid', 'sess', 'expire']),
    ('users', ['id', 'name', 'phone', 'email', 'address', 'password_hash', 'referral_code', 'wallet_balance', 'last_login_at', 'created_at', 'updated_at', 'latitude', 'longitude']),
    ('admin_users', ['id', 'username', 'email', 'phone', 'password_hash', 'role', 'last_login_at', 'created_at']),
    ('partner_users', ['id', 'chef_id', 'username', 'email', 'password_hash', 'profile_picture_url', 'last_login_at', 'created_at']),
    ('categories', ['id', 'name', 'description', 'image', 'icon_name', 'item_count', 'requires_delivery_slot', 'display_order']),
    
    # Chefs and Products
    ('chefs', ['id', 'name', 'phone', 'description', 'image', 'rating', 'review_count', 'category_id', 'address', 'address_building', 'address_street', 'address_area', 'address_city', 'address_pincode', 'latitude', 'longitude', 'is_active', 'default_delivery_fee', 'delivery_fee_per_km', 'free_delivery_threshold', 'max_delivery_distance_km', 'service_pincodes', 'is_verified']),
    ('products', ['id', 'name', 'description', 'hotel_price', 'price', 'image', 'rating', 'review_count', 'is_veg', 'is_customizable', 'stock_quantity', 'low_stock_threshold', 'is_available', 'category_id', 'chef_id', 'offer_percentage', 'margin_percent']),
    ('delivery_personnel', ['id', 'name', 'phone', 'email', 'password_hash', 'status', 'current_location', 'is_active', 'total_deliveries', 'rating', 'created_at', 'last_login_at']),
    
    # Orders and related
    ('orders', ['id', 'user_id', 'customer_name', 'phone', 'email', 'address', 'address_building', 'address_street', 'address_area', 'address_city', 'address_pincode', 'items', 'subtotal', 'delivery_fee', 'discount', 'coupon_code', 'referral_code', 'wallet_amount_used', 'total', 'status', 'payment_status', 'payment_qr_shown', 'chef_id', 'chef_name', 'category_id', 'category_name', 'delivery_time', 'delivery_date', 'delivery_slot_id', 'approved_by', 'rejected_at', 'approved_at', 'rejected_by', 'rejection_reason', 'assigned_to', 'delivery_person_name', 'delivery_person_phone', 'assigned_at', 'picked_up_at', 'delivered_at', 'created_at', 'expires_at', 'payment_verification_key', 'expected_payer_phone', 'payment_source', 'gpay_transaction_id', 'phone_match', 'amount_match', 'reference_match', 'payment_verified_by', 'verification_attempts']),
    ('payment_verification_log', ['id', 'order_id', 'check_attempt_number', 'expected_phone', 'actual_phone', 'phone_match', 'expected_amount', 'actual_amount', 'amount_match', 'expected_reference', 'actual_reference', 'reference_match', 'verification_status', 'failure_reason', 'gpay_transaction_id', 'checked_at']),
    
    # Settings
    ('delivery_settings', ['id', 'name', 'min_distance', 'max_distance', 'price', 'min_order_amount', 'pincode', 'is_active', 'created_at', 'updated_at']),
    ('cart_settings', ['id', 'category_id', 'category_name', 'min_order_amount', 'is_active', 'created_at', 'updated_at']),
    ('delivery_time_slots', ['id', 'start_time', 'end_time', 'label', 'capacity', 'current_orders', 'cutoff_hours_before', 'is_active', 'created_at', 'updated_at']),
    ('roti_settings', ['id', 'morning_block_start_time', 'morning_block_end_time', 'last_order_time', 'block_message', 'prepare_window_hours', 'is_active', 'created_at', 'updated_at']),
    
    # Coupons
    ('coupons', ['id', 'code', 'description', 'discount_type', 'discount_value', 'min_order_amount', 'max_discount', 'usage_limit', 'used_count', 'per_user_limit', 'valid_from', 'valid_until', 'is_active', 'created_at']),
    ('coupon_usages', ['id', 'coupon_id', 'user_id', 'order_id', 'used_at']),
    
    # Referrals and Wallet
    ('referrals', ['id', 'referrer_id', 'referred_id', 'referral_code', 'status', 'referrer_bonus', 'referred_bonus', 'referred_order_completed', 'admin_note', 'fraud_flag', 'created_at', 'completed_at']),
    ('wallet_transactions', ['id', 'user_id', 'amount', 'type', 'description', 'reference_id', 'reference_type', 'balance_before', 'balance_after', 'created_at']),
    ('wallet_settings', ['id', 'max_usage_per_order', 'min_order_amount', 'referrer_bonus', 'referred_bonus', 'is_active', 'created_at', 'updated_at']),
    ('payout_transactions', ['id', 'chef_id', 'order_id', 'amount', 'status', 'payment_method', 'transaction_id', 'notes', 'created_at', 'paid_at', 'failed_at', 'failure_reason']),
    ('referral_rewards', ['id', 'name', 'referrer_bonus', 'referred_bonus', 'min_order_amount', 'max_referrals_per_month', 'max_earnings_per_month', 'expiry_days', 'is_active', 'created_at', 'updated_at']),
    
    # Visitors and Areas
    ('visitors', ['id', 'user_id', 'session_id', 'page', 'user_agent', 'ip_address', 'referrer', 'created_at']),
    ('delivery_areas', ['id', 'name', 'pincodes', 'latitude', 'longitude', 'is_active', 'created_at', 'updated_at']),
    
    # Admin and Configuration
    ('admin_settings', ['id', 'key', 'value', 'description', 'created_at', 'updated_at']),
    ('push_subscriptions', ['id', 'user_id', 'user_type', 'device_type', 'subscription', 'is_active', 'created_at', 'last_activated_at']),
    ('newsletter_subscribers', ['id', 'email', 'is_active', 'subscribed_at', 'unsubscribed_at']),
    ('pending_broadcasts', ['id', 'recipient_id', 'recipient_type', 'event_type', 'payload', 'is_delivered', 'created_at']),
    
    # Subscriptions
    ('subscription_plans', ['id', 'name', 'description', 'category_id', 'frequency', 'price', 'delivery_days', 'items', 'is_active', 'created_at', 'updated_at']),
    ('subscriptions', ['id', 'user_id', 'plan_id', 'chef_id', 'chef_assigned_at', 'delivery_slot_id', 'customer_name', 'phone', 'email', 'address', 'status', 'start_date', 'end_date', 'next_delivery_date', 'next_delivery_time', 'custom_items', 'remaining_deliveries', 'total_deliveries', 'is_paid', 'payment_transaction_id', 'original_price', 'discount_amount', 'wallet_amount_used', 'coupon_code', 'coupon_discount', 'final_amount', 'payment_notes', 'last_delivery_date', 'delivery_history', 'pause_start_date', 'pause_resume_date', 'created_at', 'updated_at']),
    ('subscription_delivery_logs', ['id', 'subscription_id', 'date', 'time', 'status', 'delivery_person_id', 'notes', 'created_at', 'updated_at']),
    
    # Marketing
    ('promotional_banners', ['id', 'title', 'subtitle', 'button_text', 'gradient_from', 'gradient_via', 'gradient_to', 'emoji_1', 'emoji_2', 'emoji_3', 'action_type', 'action_value', 'is_active', 'display_order', 'created_at', 'updated_at']),
    
    # Pending Checkouts
    ('pending_checkouts', ['id', 'phone', 'customer_name', 'email', 'address', 'address_building', 'address_street', 'address_area', 'address_city', 'address_pincode', 'items', 'subtotal', 'delivery_fee', 'discount', 'total', 'chef_id', 'category_id', 'category_name', 'customer_latitude', 'customer_longitude', 'coupon_code', 'referral_code', 'wallet_amount_used', 'bonus_used_at_checkout', 'delivery_slot_id', 'delivery_time', 'delivery_date', 'status', 'is_deleted', 'created_at', 'updated_at', 'order_id']),
]


def log_message(message: str, level: str = "INFO"):
    """Log messages with timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")


def connect_to_database(db_url: str) -> psycopg2.extensions.connection:
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(db_url)
        log_message(f"Connected to database: {db_url.split('@')[1][:30]}...", "SUCCESS")
        return conn
    except Exception as e:
        log_message(f"Failed to connect to database: {str(e)}", "ERROR")
        sys.exit(1)


def get_row_count(conn: psycopg2.extensions.connection, table: str) -> int:
    """Get number of rows in a table"""
    try:
        cursor = conn.cursor()
        cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
        count = cursor.fetchone()[0]
        cursor.close()
        return count
    except Exception as e:
        log_message(f"Error counting rows in {table}: {str(e)}", "WARNING")
        return 0


def migrate_table(old_conn: psycopg2.extensions.connection, 
                  new_conn: psycopg2.extensions.connection,
                  table_name: str,
                  columns: List[str]) -> bool:
    """Migrate a single table from old to new database"""
    try:
        old_cursor = old_conn.cursor()
        new_cursor = new_conn.cursor()
        
        # Get row count from old table
        old_count = get_row_count(old_conn, table_name)
        
        if old_count == 0:
            log_message(f"[{table_name}] No data to migrate", "INFO")
            return True
        
        # Clear new table
        try:
            new_cursor.execute(f'TRUNCATE TABLE "{table_name}" CASCADE')
            new_conn.commit()
        except:
            pass  # Table might not have data
        
        # Prepare column list
        col_list = ', '.join([f'"{col}"' for col in columns])
        
        # Fetch data from old database
        old_cursor.execute(f'SELECT {col_list} FROM "{table_name}"')
        rows = old_cursor.fetchall()
        
        if not rows:
            log_message(f"[{table_name}] No rows returned from OLD database", "WARNING")
            return True
        
        # Insert data into new database
        placeholders = ', '.join(['%s'] * len(columns))
        insert_query = f'INSERT INTO "{table_name}" ({col_list}) VALUES ({placeholders})'
        
        new_cursor.executemany(insert_query, rows)
        new_conn.commit()
        
        new_count = get_row_count(new_conn, table_name)
        
        if new_count == old_count:
            log_message(f"[{table_name}] ✓ Migrated {old_count} rows successfully", "SUCCESS")
            return True
        else:
            log_message(f"[{table_name}] ⚠ Mismatch: OLD={old_count}, NEW={new_count}", "WARNING")
            return False
        
    except Exception as e:
        log_message(f"[{table_name}] ✗ Error during migration: {str(e)}", "ERROR")
        if new_conn:
            new_conn.rollback()
        return False
    finally:
        old_cursor.close()
        new_cursor.close()


def verify_migration(old_conn: psycopg2.extensions.connection,
                     new_conn: psycopg2.extensions.connection) -> Dict[str, int]:
    """Verify that all data was migrated correctly"""
    log_message("Starting verification...", "INFO")
    
    verification_results = {}
    total_old = 0
    total_new = 0
    
    for table_name, _ in TABLES_TO_MIGRATE:
        old_count = get_row_count(old_conn, table_name)
        new_count = get_row_count(new_conn, table_name)
        
        total_old += old_count
        total_new += new_count
        
        match = "✓" if old_count == new_count else "⚠"
        verification_results[table_name] = {"old": old_count, "new": new_count, "match": old_count == new_count}
        
        print(f"  {match} {table_name:35} OLD: {old_count:8} NEW: {new_count:8}")
    
    print(f"\n  Total rows OLD: {total_old} | NEW: {total_new}")
    
    if total_old == total_new:
        log_message("✓ Verification PASSED - All data migrated successfully!", "SUCCESS")
    else:
        log_message("⚠ Verification FAILED - Data mismatch detected", "WARNING")
    
    return verification_results


def main():
    """Main migration process"""
    print("\n" + "="*80)
    print("DATABASE MIGRATION SCRIPT")
    print("Old Production → New Production")
    print("="*80 + "\n")
    
    # Validate configuration
    if not OLD_DB_URL or not NEW_DB_URL:
        log_message("Missing environment variables: OLD_DB_URL or NEW_DB_URL", "ERROR")
        log_message("Please create .env file with:", "INFO")
        print("  OLD_DB_URL=your_old_connection_string")
        print("  NEW_DB_URL=your_new_connection_string")
        sys.exit(1)
    
    # Connect to both databases
    log_message("Connecting to databases...", "INFO")
    old_conn = connect_to_database(OLD_DB_URL)
    new_conn = connect_to_database(NEW_DB_URL)
    
    try:
        # Start migration
        log_message(f"Starting migration of {len(TABLES_TO_MIGRATE)} tables...", "INFO")
        print()
        
        successful = 0
        failed = 0
        
        for i, (table_name, columns) in enumerate(TABLES_TO_MIGRATE, 1):
            print(f"[{i}/{len(TABLES_TO_MIGRATE)}] ", end="")
            if migrate_table(old_conn, new_conn, table_name, columns):
                successful += 1
            else:
                failed += 1
        
        print("\n" + "="*80)
        print("MIGRATION SUMMARY")
        print("="*80)
        print(f"Total Tables: {len(TABLES_TO_MIGRATE)}")
        print(f"Successful: {successful} ✓")
        print(f"Failed: {failed} ✗")
        print()
        
        # Verify migration
        verification_results = verify_migration(old_conn, new_conn)
        
        print("\n" + "="*80)
        print("NEXT STEPS:")
        print("="*80)
        print("1. Review verification results above")
        print("2. Run tests against new database")
        print("3. Update application connection string")
        print("4. Deploy to production")
        print("="*80 + "\n")
        
    finally:
        old_conn.close()
        new_conn.close()
        log_message("Database connections closed", "INFO")


if __name__ == "__main__":
    main()
