import test, { before } from "node:test";
import assert from "node:assert/strict";
import { initSchema } from "@/lib/db/init";
import { upsertUser, readAudit } from "./store";
import { resolve, hasFeature } from "./scope";

before(async () => {
  process.env.DATABASE_URL = "pglite://memory";
  await initSchema();
  await upsertUser("owner@ridgeline.example", { email: "owner@ridgeline.example", tier: "admin", features: ["sales", "service", "finance"], stores: [], allStores: true, homeStore: null });
  await upsertUser("owner@ridgeline.example", { email: "gm.kia@ridgeline.example", tier: "user", features: ["sales", "service"], stores: ["CR2"], allStores: false, homeStore: "CR2" });
  await upsertUser("owner@ridgeline.example", { email: "former@ridgeline.example", tier: "disabled", features: [], stores: [], allStores: false, homeStore: null });
  await upsertUser("owner@ridgeline.example", { email: "nostore@ridgeline.example", tier: "user", features: ["sales"], stores: [], allStores: false, homeStore: null });
});

test("an admin with all_stores resolves to an unrestricted scope", async () => {
  const s = await resolve("owner@ridgeline.example");
  assert.ok(s.ok && s.allStores && !s.restricted && s.tier === "admin");
});
test("a GM resolves to one store and a restricted query shape", async () => {
  const s = await resolve("GM.Kia@ridgeline.example");
  assert.ok(s.ok && !s.allStores && s.restricted); if (s.ok) assert.deepEqual(s.stores, ["CR2"]);
  assert.ok(hasFeature(s, "sales")); assert.ok(!hasFeature(s, "finance"));
});
test("someone with no row is signed in but not authorized", async () => {
  const s = await resolve("stranger@example.com");
  assert.ok(!s.ok); if (!s.ok) assert.match(s.reason, /not set up/);
});
test("disabled and no-store rows fail closed", async () => {
  const d = await resolve("former@ridgeline.example"); assert.ok(!d.ok && /disabled/.test(d.reason));
  const n = await resolve("nostore@ridgeline.example"); assert.ok(!n.ok && /no store/.test(n.reason));
});
test("every rights change writes an audit row naming actor, target, before and after", async () => {
  await upsertUser("owner@ridgeline.example", { email: "gm.kia@ridgeline.example", tier: "user", features: ["sales", "service"], stores: ["CR2", "CR1"], allStores: false, homeStore: "CR2" });
  const rows = await readAudit(1, "rights_change");
  const e = rows[0].entry as { target: string; before: { stores: string[] } | null; after: { stores: string[] } };
  assert.equal(rows[0].actor, "owner@ridgeline.example"); assert.equal(e.target, "gm.kia@ridgeline.example");
  assert.deepEqual(e.before?.stores, ["CR2"]); assert.deepEqual(e.after.stores, ["CR2", "CR1"]);
});
