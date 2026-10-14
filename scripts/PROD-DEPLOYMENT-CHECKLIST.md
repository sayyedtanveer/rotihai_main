# Product Variants System - Production Deployment Checklist

## Pre-Deployment (Week Before)

- [ ] Review all variant-related code changes
- [ ] Schedule deployment window (low-traffic hours)
- [ ] Notify stakeholders (support team, admins, chefs)
- [ ] Prepare rollback plan
- [ ] Brief database admin on migration

## Database Backup & Testing

- [ ] **BACKUP PRODUCTION DATABASE**
  ```bash
  pg_dump -h prod-db.example.com -U dbadmin rotihai_db > backup_prod_$(date +%Y%m%d_%H%M%S).sql
  ```
  - Size: ____ GB
  - Location: ____
  - Verified backup: [ ] Yes [ ] No

- [ ] **TEST ON STAGING**
  ```bash
  psql -h staging-db.example.com -d rotihai_db < scripts/prod-migration-variants.sql
  ```
  - Result: PASS [ ] FAIL [ ]
  - Issues found: ____

- [ ] **VERIFY STAGING DATA**
  - Check products table unmodified: [ ] Yes
  - Check has_variants column added: [ ] Yes
  - Check product_variants table created: [ ] Yes
  - Check indexes created: [ ] Yes

## Pre-Migration Checks

- [ ] **Stop deployments** - no code changes during migration
- [ ] **Check database health**
  ```bash
  psql -d rotihai_db -c "SELECT version();"
  psql -d rotihai_db -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database ORDER BY pg_database_size(pg_database.datname) DESC LIMIT 1;"
  ```
  - Database available: [ ] Yes [ ] No
  - Disk space sufficient (>10GB free): [ ] Yes [ ] No
  - All connections stable: [ ] Yes [ ] No

- [ ] **Verify current schema version**
  ```bash
  psql -d rotihai_db -c "SELECT version, description, applied_at FROM schema_migrations ORDER BY version DESC LIMIT 5;"
  ```
  - Last migration: ____
  - Date: ____

## Production Migration

### Phase 1: Execute Migration Script
- [ ] Start migration at: __:__ UTC
- [ ] **Run migration**
  ```bash
  psql -h prod-db.example.com -d rotihai_db -f scripts/prod-migration-variants.sql
  ```
  - Execution time: ____ seconds
  - Status: SUCCESS [ ] FAILED [ ]
  - Errors: ____

### Phase 2: Post-Migration Verification
- [ ] **Check new objects exist**
  ```bash
  psql -d rotihai_db -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='product_variants';"
  psql -d rotihai_db -c "SELECT column_name FROM information_schema.columns WHERE table_name='products' AND column_name='has_variants';"
  ```
  - product_variants table exists: [ ] Yes [ ] No
  - has_variants column exists: [ ] Yes [ ] No

- [ ] **Verify data integrity**
  ```bash
  psql -d rotihai_db -c "SELECT COUNT(*) as product_count FROM products;"
  psql -d rotihai_db -c "SELECT COUNT(*) as variant_count FROM product_variants;"
  psql -d rotihai_db -c "SELECT COUNT(*) as count FROM products WHERE has_variants IS NULL;"
  ```
  - Products unchanged: [ ] Yes (should be unchanged)
  - Variants count: ____
  - NULL has_variants found: [ ] None [ ] Some (ERROR)

- [ ] **Check indexes performance**
  ```bash
  psql -d rotihai_db -c "SELECT indexname FROM pg_indexes WHERE tablename='product_variants' AND indexname LIKE 'idx_%';"
  ```
  - Indexes found: ____ (should be 3)
  - Index sizes reasonable: [ ] Yes [ ] No

- [ ] **Verify migration tracking**
  ```bash
  psql -d rotihai_db -c "SELECT version, description FROM schema_migrations WHERE version=15;"
  ```
  - Migration 15 recorded: [ ] Yes [ ] No

## Code Deployment

- [ ] **Deploy backend code** (server/)
  - Variant API endpoints ready: [ ] Yes
  - Product endpoints updated: [ ] Yes
  - Admin endpoints ready: [ ] Yes

- [ ] **Deploy frontend code** (client/)
  - VariantSelectorDialog component ready: [ ] Yes
  - CategoryMenuDrawer integration ready: [ ] Yes
  - Cart variant display ready: [ ] Yes

- [ ] **Clear application caches**
  ```bash
  # If using Redis
  redis-cli FLUSHDB
  
  # Clear CDN cache
  # Redeploy cache-busted assets
  ```

## Admin Testing

- [ ] **Test admin variant creation**
  - Login as admin: [ ] Success
  - Create product "Test Roti": [ ] Success
  - Toggle "Multiple Variants": [ ] Success
  - Open variant manager: [ ] Success
  - Add "Half" variant (₹10): [ ] Success
  - Add "Full" variant (₹15): [ ] Success
  - Add "Large" variant (₹20): [ ] Success
  - Reorder variants: [ ] Success
  - Edit variant price: [ ] Success
  - Delete variant: [ ] Success
  - Save product: [ ] Success

- [ ] **Verify database after admin test**
  ```bash
  psql -d rotihai_db -c "SELECT id, name, has_variants, price FROM products WHERE name='Test Roti';"
  psql -d rotihai_db -c "SELECT id, product_id, name, price FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE name='Test Roti') ORDER BY sort_order;"
  ```

## Customer Testing (Staging)

- [ ] **Test customer variant selection**
  - Browse menu with multi-variant product: [ ] Success
  - Click "Add" button: [ ] Shows VariantSelectorDialog
  - Select "Half" (₹10): [ ] Dialog responds
  - Select quantity 2: [ ] Quantity increments
  - Total price updates (₹20): [ ] Correct
  - Click "Add to Cart": [ ] Cart updates

- [ ] **Verify cart display**
  - Cart shows "Product Name (Size)": [ ] Yes
  - Example: "Roti (Full) × 2": [ ] Yes
  - Different sizes separate lines: [ ] Yes
  - Prices correct: [ ] Yes

- [ ] **Test single-price products still work**
  - Old products without variants: [ ] Add without dialog
  - Cart shows normally: [ ] Yes
  - No variant selector appears: [ ] Correct

## Monitoring & Alerts

- [ ] **Enable monitoring alerts**
  - Database query performance
  - API response times
  - Error rates
  - Product variant table size

- [ ] **Set up logging**
  ```bash
  # Watch logs for errors
  tail -f /var/log/rotihai-app.log | grep -i variant
  tail -f /var/log/postgresql/postgresql.log | grep -i variant
  ```

## Rollback Plan (If Needed)

- [ ] **Prepare rollback**
  ```bash
  # If critical issues found within 1 hour:
  psql -d rotihai_db < scripts/rollback-variants.sql
  ```
  - Rollback script tested: [ ] Yes
  - Execution time: ____ seconds
  - Data restored: [ ] Yes

- [ ] **Rollback steps**
  1. [ ] Revert backend code to previous version
  2. [ ] Revert frontend code to previous version
  3. [ ] Run rollback SQL script
  4. [ ] Clear caches
  5. [ ] Verify old functionality restored
  6. [ ] Notify stakeholders

## Post-Deployment

- [ ] **Monitor for 24 hours**
  - No errors in logs: [ ] Confirmed
  - API response times normal: [ ] Yes
  - Database performance normal: [ ] Yes
  - Customer orders processing: [ ] Yes

- [ ] **Verify variant system working**
  - Admin can create variants: [ ] Yes
  - Customers see size selector: [ ] Yes
  - Cart shows variants correctly: [ ] Yes
  - Orders include variant info: [ ] Yes (Phase 5)

- [ ] **Update documentation**
  - [ ] Admin guide for variants
  - [ ] API documentation
  - [ ] Database schema docs
  - [ ] Release notes

- [ ] **Notify stakeholders**
  - [ ] Support team: variants now available
  - [ ] Chef/Admin team: new feature enabled
  - [ ] Engineering team: migration complete
  - [ ] Product team: feature live

## Post-Deployment Queries

Run these to verify everything is healthy:

```sql
-- Check migration applied
SELECT * FROM schema_migrations WHERE version >= 15 ORDER BY version DESC;

-- Count objects
SELECT 'products' as table_name, COUNT(*) as count FROM products
UNION ALL
SELECT 'product_variants', COUNT(*) FROM product_variants;

-- Find products with variants
SELECT id, name, has_variants, price 
FROM products 
WHERE has_variants = true 
LIMIT 10;

-- Show variant distribution
SELECT COUNT(*) as product_with_variants, COUNT(DISTINCT product_id) as unique_products
FROM product_variants;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan as scans, idx_tup_read as tuples_read
FROM pg_stat_user_indexes
WHERE tablename IN ('products', 'product_variants')
ORDER BY idx_scan DESC;
```

## Sign-Off

- [ ] Database Admin: __________ Date: __________
- [ ] Backend Lead: __________ Date: __________
- [ ] Frontend Lead: __________ Date: __________
- [ ] DevOps/Infra: __________ Date: __________
- [ ] Product Manager: __________ Date: __________

---

## Emergency Contacts

- Database Admin: [Name] - [Phone/Email]
- DevOps Lead: [Name] - [Phone/Email]
- On-Call Engineer: [Name] - [Phone/Email]
- Product Manager: [Name] - [Phone/Email]

---

## Success Criteria

✅ **Deployment is SUCCESSFUL if:**
- Migration completes in < 2 minutes
- Zero data loss
- All product data intact
- Variant table created with data
- No application errors
- Admin can create variants
- Customers can select variants
- Cart displays variants correctly
- Single-price products work unchanged
- Monitoring shows normal performance

❌ **Deployment is FAILED if:**
- Migration exceeds 5 minutes
- Product data corrupted
- Variant table not created
- Application errors on startup
- Admin features broken
- Customer can't add to cart
- Critical performance degradation

