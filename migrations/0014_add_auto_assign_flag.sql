-- Add isAutoAssign flag to categories table for hybrid chef model
ALTER TABLE categories ADD COLUMN is_auto_assign BOOLEAN NOT NULL DEFAULT false;

-- Create migration metadata
COMMENT ON COLUMN categories.is_auto_assign IS 'Flag to enable auto-assignment chef model for this category (Ghar Ka Khana only)';
