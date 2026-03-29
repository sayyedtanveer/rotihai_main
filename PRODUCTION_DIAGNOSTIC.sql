-- ========================================================================================
-- PRODUCTION DIAGNOSTIC QUERY
-- Check what's actually in your database
-- ========================================================================================

-- 1. Check pending Google Pay orders
SELECT 
  id,
  customer_name,
  phone,
  total,
  payment_status,
  payment_source,
  payment_verification_key,
  verification_attempts,
  created_at
FROM orders
WHERE payment_source = 'google-pay'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check payment verification log (should show attempts)
SELECT 
  order_id,
  check_attempt_number,
  expected_phone,
  actual_phone,
  phone_match,
  expected_amount,
  actual_amount,
  verification_status,
  failure_reason,
  checked_at
FROM payment_verification_log
ORDER BY checked_at DESC
LIMIT 20;

-- 3. Count verification attempts per status
SELECT 
  verification_status,
  COUNT(*) as count,
  failure_reason
FROM payment_verification_log
GROUP BY verification_status, failure_reason
ORDER BY count DESC;

-- 4. Check which orders have been verified vs pending
SELECT 
  CASE 
    WHEN payment_verified_by IS NOT NULL THEN 'VERIFIED'
    ELSE 'PENDING'
  END as status,
  COUNT(*) as count,
  SUM(total) as total_amount
FROM orders
WHERE payment_source = 'google-pay'
GROUP BY status;

-- 5. Orders with transaction IDs (successful payments)
SELECT 
  id,
  customer_name,
  total,
  gpay_transaction_id,
  payment_verified_by,
  created_at
FROM orders
WHERE gpay_transaction_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
