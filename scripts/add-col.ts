import { pool } from '../shared/db';

async function run() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN requires_chef_confirmation boolean NOT NULL DEFAULT false;');
    console.log('Success');
  } catch (e: any) {
    if (e.message.includes('already exists')) {
      console.log('Already exists');
    } else {
      console.error(e);
      process.exit(1);
    }
  } finally {
    process.exit(0);
  }
}
run();
