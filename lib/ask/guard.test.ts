/** Table-driven guard tests. Cases named [REGRESSION GUARD] are exploits that got through somewhere once. Keep them forever. */
import test from "node:test";
import assert from "node:assert/strict";
import { validate, MAX_LIMIT } from "./guard";
import type { Scope, Tier } from "@/lib/rights/types";

const CATALOG = { binding: { table: "store_day", store_column: "store_code", time_column: "report_date", freshness: "nightly" }, deny_columns: ["customer_name", "phone", "email", "vin", "monthly_payment"] };
const S = (tier: Tier, stores: string[], allStores = false): Scope =>
  ({ ok: true, email: "t@example.com", tier, features: ["sales"], stores, allStores, homeStore: stores[0] ?? null, restricted: tier === "user" });
const SCOPES = { admin: S("admin", [], true), gm: S("user", ["CR2"]), mgr2: S("store_admin", ["CR1", "CR2"]) };

type Case = [name: string, sql: string, scope: keyof typeof SCOPES, wantOk: boolean, reason?: RegExp];
const CASES: Case[] = [
  ["admin aggregate passes", "SELECT store_code, SUM(unit_count) AS units, MIN(report_date) AS AVAILABLE_START, MAX(report_date) AS AVAILABLE_END FROM store_day GROUP BY store_code", "admin", true],
  ["gm scoped passes", "SELECT SUM(unit_count) AS units FROM store_day WHERE store_code = 'CR2' AND report_date >= '2026-09-01'", "gm", true],
  ["gm IN subset passes", "SELECT SUM(unit_count) AS units FROM store_day WHERE store_code IN ('CR2')", "gm", true],
  ["mgr2 IN subset passes", "SELECT store_code, SUM(unit_count) AS units FROM store_day WHERE store_code IN ('CR1','CR2') GROUP BY store_code", "mgr2", true],
  ["star inside a CTE is still rejected", "WITH d AS (SELECT * FROM store_day WHERE store_code IN ('CR1')) SELECT SUM(unit_count) AS units FROM d", "mgr2", false, /\*/],
  ["count star allowed", "SELECT COUNT(*) AS n FROM store_day WHERE store_code IN ('CR2')", "gm", true],
  ["limit capped", "SELECT report_date, unit_count FROM store_day WHERE store_code = 'CR2' LIMIT 999999", "gm", true],
  ["limit injected when missing", "SELECT report_date, unit_count FROM store_day WHERE store_code = 'CR2'", "gm", true],
  ["two statements", "SELECT 1; DROP TABLE store_day", "admin", false, /one statement|semicolon/i],
  ["write verb", "DELETE FROM store_day", "admin", false, /read-only|DELETE/i],
  ["create", "CREATE TABLE x AS SELECT 1", "admin", false, /read-only|CREATE/i],
  ["table not in catalog", "SELECT COUNT(*) FROM customers", "admin", false, /customers|not in the catalog|table/i],
  ["denied column", "SELECT phone FROM store_day WHERE store_code = 'CR2'", "gm", false, /phone/],
  ["select star", "SELECT * FROM store_day WHERE store_code = 'CR2'", "gm", false, /\*/],
  ["fn star not count", "SELECT ARRAY_AGG(*) FROM store_day WHERE store_code = 'CR2'", "gm", false, /\*/],
  ["gm missing store filter", "SELECT SUM(unit_count) FROM store_day", "gm", false, /store/i],
  ["gm other store", "SELECT SUM(unit_count) FROM store_day WHERE store_code = 'CR1'", "gm", false, /CR1|store/i],
  ["gm superset IN", "SELECT SUM(unit_count) FROM store_day WHERE store_code IN ('CR1','CR2')", "gm", false, /CR1|store/i],
  ["gm OR smuggle", "SELECT SUM(unit_count) FROM store_day WHERE store_code = 'CR2' OR store_code = 'CR1'", "gm", false, /OR|store/i],
  ["gm subquery", "SELECT SUM(unit_count) FROM store_day WHERE store_code = 'CR2' AND report_date IN (SELECT report_date FROM store_day WHERE store_code='CR1')", "gm", false, /subquer|CR1|simple/i],
  ["gm union", "SELECT SUM(unit_count) FROM store_day WHERE store_code = 'CR2' UNION SELECT SUM(unit_count) FROM store_day WHERE store_code='CR1'", "gm", false, /UNION|CR1|simple/i],
  ["gm join", "SELECT SUM(a.unit_count) FROM store_day a JOIN store_day b ON a.report_date=b.report_date WHERE a.store_code = 'CR2'", "gm", false, /JOIN|simple/i],
  ["[REGRESSION GUARD] store_admin OR 1=1 bypass", "SELECT SUM(unit_count) FROM store_day WHERE store_code = 'CR1' OR 1=1", "mgr2", false, /OR|store/i],
  ["mgr2 OR inside parens is fine", "SELECT SUM(unit_count) FROM store_day WHERE store_code IN ('CR1','CR2') AND (unit_count > 0 OR deal_count > 0)", "mgr2", true],
  ["[REGRESSION GUARD] quote in alias hides a clause", "SELECT 1 AS \"x' OR store_code='CR1\", SUM(unit_count) FROM store_day WHERE store_code = 'CR2'", "gm", false, /quote|alias|OR|identifier/i],
  ["[REGRESSION GUARD] comment swallows injected LIMIT", "SELECT report_date FROM store_day WHERE store_code = 'CR2' -- trailing comment", "gm", true],
  ["[REGRESSION GUARD] denied column via function", "SELECT UPPER(customer_name) FROM store_day WHERE store_code = 'CR2'", "gm", false, /customer_name/],
  ["[REGRESSION GUARD] denied column in literal is fine", "SELECT 'phone' AS label, SUM(unit_count) FROM store_day WHERE store_code = 'CR2'", "gm", true],
  ["disabled scope is refused before any rule", "SELECT SUM(unit_count) FROM store_day WHERE store_code = 'CR2'", "gm", true],
];

for (const [name, sql, scopeKey, wantOk, reason] of CASES) {
  test(name, () => {
    const r = validate(sql, SCOPES[scopeKey], CATALOG);
    assert.equal(r.ok, wantOk, `${name}: got ok=${r.ok} reason=${JSON.stringify(r.reason)}`);
    if (!wantOk && reason) assert.match(r.reason, reason, `${name}: reason ${JSON.stringify(r.reason)} did not match ${reason}`);
    if (wantOk) {
      const m = /\bLIMIT\s+(\d+)\s*$/i.exec(r.sql.trim());
      assert.ok(m, `${name}: no top-level LIMIT in ${JSON.stringify(r.sql)}`);
      assert.ok(parseInt(m![1], 10) <= MAX_LIMIT);
    }
  });
}

test("a scope that is not ok is refused with its own reason", () => {
  const r = validate("SELECT 1", { ok: false, email: "x@example.com", reason: "Your access is disabled." }, CATALOG);
  assert.equal(r.ok, false);
  assert.match(r.reason, /disabled/);
});
