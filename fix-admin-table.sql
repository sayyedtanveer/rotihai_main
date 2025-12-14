-- Add missing last_login_at column to admin_users table
-- This fixes the 500 error when trying to test login

ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;
