/** End to end on the mock planner and narrator against a real in-process Postgres with the pack's store_day table loaded. */
import test, { before } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { initSchema, proveReadOnly } from "@/lib/db/init";
import { loadPack } from "@/lib/db/load-pack";
import { upsertUser, readAudit } from "@/lib/rights/store";
import { answer } from "./ask";

const CAT = path.join(process.cwd(), "SOLUTIONS", "catalog", "store_day.yaml");
before(async () => {
  process.env.DATABASE_URL = "pglite://memory";
  await initSchema();
  await loadPack({ tables: ["stores", "store_day"] });
  const a = "owner@ridgeline.example";
  await upsertUser(a, { email: a, tier: "admin", features: ["sales", "service", "finance"], stores: [], allStores: true, homeStore: null });
  await upsertUser(a, { email: "gm.kia@ridgeline.example", tier: "user", features: ["sales", "service"], stores: ["CR2"], allStores: false, homeStore: "CR2" });
  await upsertUser(a, { email: "service.east@ridgeline.example", tier: "user", features: ["service"], stores: ["CR1", "CR2"], allStores: false, homeStore: "CR1" });
  await upsertUser(a, { email: "former@ridgeline.example", tier: "disabled", features: [], stores: [], allStores: false, homeStore: null });
});

test("the query path is read-only by construction", async () => {
  assert.match(await proveReadOnly(), /read-only/i);
});
test("the owner gets four stores with covered dates, and Kia's early stop is named", async () => {
  const r = await answer("owner@ridgeline.example", "Total gross last 7 days across all stores", { mock: true, catalogPath: CAT });
  assert.equal(r.outcome, "answered"); if (r.outcome !== "answered") return;
  assert.equal(r.rows.length, 4); assert.equal(r.verify, "passed"); assert.match(r.text, /2026-09-02/);
});
test("a GM asking about the group is answered for their store only", async () => {
  const r = await answer("gm.kia@ridgeline.example", "units by store last 7 days", { mock: true, catalogPath: CAT });
  assert.equal(r.outcome, "safety_block"); // the mock planner deliberately writes all four stores; the guard stops it
  if (r.outcome === "safety_block") assert.match(r.text, /CR1|outside your access/);
});
test("a GM's own-store question passes the guard and verifies", async () => {
  const r = await answer("gm.kia@ridgeline.example", "How many units did we deliver in the last 30 days?", { mock: true, catalogPath: CAT });
  assert.equal(r.outcome, "answered"); if (r.outcome === "answered") { assert.equal(r.rows.length, 1); assert.match(r.sql, /IN \('CR2'\)/); }
});
test("a missing feature, a disabled user, and a CRM question are declined in one sentence each", async () => {
  const a = await answer("service.east@ridgeline.example", "What was total gross last month?", { mock: true, catalogPath: CAT });
  assert.equal(a.outcome, "permission_denied"); assert.match(a.text, /sales/);
  const b = await answer("former@ridgeline.example", "How many units MTD?", { mock: true, catalogPath: CAT });
  assert.equal(b.outcome, "permission_denied"); assert.match(b.text, /disabled/);
  const c = await answer("gm.kia@ridgeline.example", "What is our close rate on internet leads?", { mock: true, catalogPath: CAT });
  assert.equal(c.outcome, "refused"); assert.match(c.text, /CRM/);
});
test("a real number attached to the wrong store is caught and the answer still ships", async () => {
  const r = await answer("owner@ridgeline.example", "units by store last 7 days", { mock: true, lie: true, catalogPath: CAT });
  assert.equal(r.outcome, "answered"); if (r.outcome !== "answered") return;
  assert.ok(r.issues.length > 0, "the planted lie was not caught");
  assert.ok(["repaired", "fallback"].includes(r.verify));
});
test("every run leaves one audit row with who asked, the SQL, and the outcome", async () => {
  const rows = await readAudit(10, "ask");
  assert.ok(rows.length >= 6);
  const answered = rows.find((r) => (r.entry as { outcome: string }).outcome === "answered");
  assert.ok(answered && typeof (answered.entry as { sql: string }).sql === "string");
});
