import { db } from './server/db';
import { deliverySettings } from './shared/schema';

async function run() {
    console.log("Fetching delivery settings from DB...");
    const settings = await db.select().from(deliverySettings);
    console.log(JSON.stringify(settings, null, 2));
    process.exit(0);
}

run().catch(console.error);
