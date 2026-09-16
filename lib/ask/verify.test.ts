import test from "node:test";
import assert from "node:assert/strict";
import { check, numbersInRows, attribution, coverage } from "./verify";
import type { Scope } from "@/lib/rights/types";

const NAMES = { CR1: "Ridgeline Hyundai", CR2: "Ridgeline Kia", CR3: "Ridgeline Ford", CR4: "Ridgeline Chevrolet" };
const CAT = { binding: { table: "store_day", store_column: "store_code", time_column: "report_date", freshness: "nightly" } };
const owner: Scope = { ok: true, email: "o@x", tier: "admin", features: ["sales"], stores: [], allStores: true, homeStore: null, restricted: false };
const rows = [
  { store_code: "CR1", units: 45, total_gross: "147479.00", AVAILABLE_START: "2026-08-30", AVAILABLE_END: "2026-09-05" },
  { store_code: "CR2", units: 15, total_gross: "54449.00", AVAILABLE_START: "2026-08-30", AVAILABLE_END: "2026-09-02" },
];

test("numbers that appear in the rows pass, including a column total", () => {
  assert.deepEqual(numbersInRows("Hyundai delivered 45 units and Kia 15, 60 in all, for $201,928.", rows), []);
});
test("a number that is in no row and is not arithmetic on the rows fails", () => {
  assert.match(numbersInRows("Hyundai delivered 212 units.", rows)[0], /212/);
});
test("digits inside a date are not read as numbers", () => {
  assert.deepEqual(numbersInRows("From 2026-08-30 to 2026-09-05, Hyundai delivered 45 units.", rows), []);
});
test("a real number attached to the wrong store is caught by attribution", () => {
  const issues = attribution("Ridgeline Kia delivered 45 units.", rows, NAMES);
  assert.equal(issues.length, 1); assert.match(issues[0], /Kia.*45/);
});
test("coverage requires the covered dates when the rows carry them", () => {
  assert.ok(coverage("Hyundai delivered 45 units and Kia 15.", rows, owner, NAMES).some((i) => /covered dates/.test(i)));
});
test("coverage flags a store the asker can see that has no row", () => {
  const issues = coverage("Through Sept 5, Hyundai delivered 45 units and Kia 15 through 2026-09-02.", rows, owner, NAMES);
  assert.ok(issues.some((i) => /Ford|Chevrolet/.test(i) && /did not report/.test(i)));
});
test("coverage flags a store whose data stops early unless the answer says so", () => {
  const two: Scope = { ...owner, allStores: false, stores: ["CR1", "CR2"], tier: "store_admin" };
  const bad = coverage("From 2026-08-30 to 2026-09-05 Hyundai did 45 and Kia did 15.", rows, two, NAMES);
  assert.ok(bad.some((i) => /Kia.*2026-09-02/.test(i)));
  const good = coverage("From 2026-08-30 to 2026-09-05 Hyundai did 45; Kia did 15 and did not report after 2026-09-02.", rows, two, NAMES);
  assert.deepEqual(good.filter((i) => /Kia/.test(i)), []);
});
test("banned words and column names are rejected in GM-facing prose", () => {
  const issues = check("From 2026-08-30 to 2026-09-05 the store_day rows show 45 units, dedup applied.", rows, { ...owner, allStores: false, stores: ["CR1"] }, CAT, NAMES);
  assert.ok(issues.some((i) => /store_day/.test(i))); assert.ok(issues.some((i) => /dedup/.test(i)));
});
