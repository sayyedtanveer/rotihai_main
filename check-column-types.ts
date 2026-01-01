import { db, sql } from './shared/db';

async function checkColumnTypes() {
  try {
    const result = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position
    `);
    
    console.log('=== SUBSCRIPTIONS TABLE COLUMN TYPES ===');
    result.rows?.forEach((row: any) => {
      console.log(`${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkColumnTypes();
