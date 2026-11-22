import { eq } from "drizzle-orm";
import { factoryWorkspace } from "../drizzle/schema";
import { getDb } from "../server/db";

const openingState = {
  moves: [
    { item: "Flour", quantity: 100, unit: "kg", kind: "opening" },
    { item: "Cooking oil", quantity: 30, unit: "L", kind: "opening" },
    { item: "Salt & spice mix", quantity: 5, unit: "kg", kind: "opening" },
    { item: "200 g pouch", quantity: 500, unit: "pcs", kind: "opening" },
    { item: "Carton · 20 pk", quantity: 30, unit: "pcs", kind: "opening" },
    { item: "Murukku · 200 g", quantity: 50, unit: "packets", kind: "opening" },
  ],
  complete: [],
  orders: [],
  payment: 0,
  overhead: 0,
  invoiceNo: "—",
  customToast: "",
  seedVersion: 1,
};

const db = await getDb();
if (!db) throw new Error("DATABASE_URL is not available; benchmark seed was not written.");
const existing = await db.select({ slug: factoryWorkspace.slug }).from(factoryWorkspace).where(eq(factoryWorkspace.slug, "benchmark-demo")).limit(1);
if (existing.length) {
  console.log("Benchmark workspace already exists; preserving it without overwriting user changes.");
} else {
  await db.insert(factoryWorkspace).values({ slug: "benchmark-demo", state: openingState });
  console.log("Seeded the exact benchmark opening balances (once) into factory_workspace.");
}
process.exit(0);
