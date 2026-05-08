
import { db } from "../shared/db";
import { orders } from "../shared/schema";
import { desc, isNotNull } from "drizzle-orm";

async function inspect() {
  console.log("Checking scheduled orders...");
  const scheduledOrders = await db.select()
    .from(orders)
    .where(isNotNull(orders.deliveryTime))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  console.log(JSON.stringify(scheduledOrders.map(o => ({
    id: o.id,
    deliveryDate: o.deliveryDate,
    deliveryTime: o.deliveryTime,
    status: o.status,
    createdAt: o.createdAt
  })), null, 2));
}

inspect().catch(console.error).finally(() => process.exit());
