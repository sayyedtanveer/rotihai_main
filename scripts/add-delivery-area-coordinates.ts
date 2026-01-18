import { pool } from './db';
import fs from 'fs';
import path from 'path';

async function addDeliveryAreaCoordinates() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration: Add coordinates to delivery_areas...\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/0013_add_coordinates_to_delivery_areas.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      console.log(`⏳ Executing: ${statement.substring(0, 60)}...`);
      try {
        await client.query(statement);
        console.log(`✅ Success\n`);
      } catch (err: any) {
        if (err.code === '42701' && statement.includes('CREATE INDEX')) {
          console.log(`ℹ️ Index already exists (skipping)\n`);
        } else if (err.code === '42804') {
          console.log(`⚠️ Column might already exist (skipping)\n`);
        } else {
          console.error(`❌ Error: ${err.message}\n`);
          throw err;
        }
      }
    }

    // Verify results
    console.log('\n📊 Verifying delivery areas...\n');
    const result = await client.query(
      'SELECT id, name, area_name, latitude, longitude, pincodes FROM delivery_areas ORDER BY name'
    );

    if (result.rows.length === 0) {
      console.log('⚠️ No delivery areas found in database!');
      console.log('You may need to seed the database first.\n');
      return;
    }

    console.log('✅ Delivery Areas with Coordinates:\n');
    result.rows.forEach((area: any) => {
      const coords = area.latitude && area.longitude 
        ? `(${area.latitude}, ${area.longitude})`
        : '(No coordinates)';
      console.log(`  📍 ${area.area_name || area.name} - ${coords}`);
      console.log(`     Pincodes: ${area.pincodes?.join(', ') || 'None'}`);
    });

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

// Run migration
addDeliveryAreaCoordinates().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
