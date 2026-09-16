import test, { before } from "node:test";
import assert from "node:assert/strict";
import { initSchema } from "@/lib/db/init";
import { loadPack } from "@/lib/db/load-pack";
import { q, storeFilter, GuardRefused } from "./q";
import type { Scope } from "@/lib/rights/types";

const gm: Scope = { ok: true, email: "gm.kia@ridgeline.example", tier: "user", features: ["sales"], stores: ["CR2"], allStores: false, homeStore: "CR2", restricted: true };
before(async () => { process.env.DATABASE_URL = "pglite://memory"; await initSchema(); await loadPack({ tables: ["stores", "store_day"] }); });

test("a tile query for the signed-in GM returns only their store", async () => {
  const rows = await q(gm, "store_day", `SELECT store_code, SUM(unit_count) AS units FROM store_day WHERE ${storeFilter(gm)} GROUP BY store_code`);
  assert.equal(rows.length, 1); assert.equal(rows[0].store_code, "CR2");
});
test("a tile that reaches for another store is refused by the same guard as the ask box", async () => {
  await assert.rejects(() => q(gm, "store_day", "SELECT store_code, SUM(unit_count) AS units FROM store_day WHERE store_code IN ('CR1','CR2') GROUP BY store_code"), GuardRefused);
});
