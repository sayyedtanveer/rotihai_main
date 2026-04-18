const { Client } = require('pg');
const c = new Client({
  connectionString: 'postgresql://neondb_owner:npg_Jp2CY9PRTcDt@ep-lingering-sound-a8x9b6y8-pooler.eastus2.azure.neon.tech/rotihai_dev?sslmode=require&channel_binding=require'
});
c.connect()
  .then(() => c.query("SELECT id, name, frequency, price, is_active FROM subscription_plans WHERE name IN ('Weekly Roti Plan','Monthly Roti Plan') ORDER BY price"))
  .then(r => { console.table(r.rows); return c.end(); })
  .catch(e => { console.error(e.message); c.end(); });
