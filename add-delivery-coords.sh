#!/bin/bash
# Script to add missing latitude and longitude columns to delivery_areas table
# Usage: ./add-delivery-coords.sh

echo "🔄 Adding coordinates to delivery_areas table..."
echo ""

# Connection string - adjust as needed
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-rotihai_db}
DB_USER=${DB_USER:-rotihai_user}

# Run migration SQL
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF

-- Add missing columns
ALTER TABLE delivery_areas
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add coordinates for Kurla West
UPDATE delivery_areas 
SET 
  latitude = 19.07448,
  longitude = 72.8869815
WHERE (name ILIKE '%Kurla%' OR area_name ILIKE '%Kurla%')
AND latitude IS NULL;

-- Add coordinates for Bandra
UPDATE delivery_areas 
SET 
  latitude = 19.0501,
  longitude = 72.8329
WHERE (name ILIKE '%Bandra%' OR area_name ILIKE '%Bandra%')
AND latitude IS NULL;

-- Add coordinates for Worli
UPDATE delivery_areas 
SET 
  latitude = 19.0176,
  longitude = 72.8298
WHERE (name ILIKE '%Worli%' OR area_name ILIKE '%Worli%')
AND latitude IS NULL;

-- Add coordinates for Marine Drive
UPDATE delivery_areas 
SET 
  latitude = 18.9630,
  longitude = 72.8295
WHERE (name ILIKE '%Marine%' OR area_name ILIKE '%Marine%')
AND latitude IS NULL;

-- Verify
SELECT id, name, area_name, latitude, longitude FROM delivery_areas;

EOF

echo ""
echo "✅ Migration completed!"
