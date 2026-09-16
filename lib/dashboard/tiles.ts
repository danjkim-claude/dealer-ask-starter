/** The dashboard's queries. Each one goes through q(), so it carries the signed-in person's scope and the guard's rules. */
import { q, storeFilter, today } from "./q";
import type { Scope } from "@/lib/rights/types";
import { col } from "@/lib/ask/ask";

export type StoreRow = { store_code: string; store_name: string };
export async function stores(scope: Scope): Promise<StoreRow[]> {
  const rows = await q(scope, "store_day", `SELECT DISTINCT store_code FROM store_day WHERE ${storeFilter(scope, "store_code", ALL)} ORDER BY store_code`);
  return rows.map((r) => ({ store_code: String(r.store_code), store_name: NAMES[String(r.store_code)] ?? String(r.store_code) }));
}
export const ALL = ["CR1", "CR2", "CR3", "CR4"];
export const NAMES: Record<string, string> = { CR1: "Ridgeline Hyundai", CR2: "Ridgeline Kia", CR3: "Ridgeline Ford", CR4: "Ridgeline Chevrolet" };

function monthStart(d: string) { return d.slice(0, 8) + "01"; }

export async function salesMtd(scope: Scope) {
  const t = today();
  const rows = await q(scope, "store_day", `SELECT store_code, SUM(unit_count) AS units, SUM(REPLACE(total_gross, ',', '')::numeric) AS total_gross, SUM(fi_gross) AS fi_gross, MAX(report_date) AS available_end FROM store_day WHERE ${storeFilter(scope, "store_code", ALL)} AND report_date >= DATE '${monthStart(t)}' AND report_date <= DATE '${t}' GROUP BY store_code ORDER BY store_code`);
  return rows.map((r) => ({ store_code: String(r.store_code), name: NAMES[String(r.store_code)] ?? String(r.store_code), units: Number(r.units), total_gross: Number(r.total_gross), fi_gross: Number(r.fi_gross), available_end: String(col(r, "available_end")), late: String(col(r, "available_end")) < t }));
}

export async function serviceLast30(scope: Scope) {
  const t = today();
  const rows = await q(scope, "service_ros", `SELECT store_code, COUNT(*) AS ros, SUM(CASE WHEN pay_type = 'C' THEN labor_sales ELSE 0 END) AS cp_labor, SUM(CASE WHEN pay_type = 'C' THEN labor_hours ELSE 0 END) AS cp_hours, MAX(close_date) AS available_end FROM service_ros WHERE ${storeFilter(scope, "store_code", ALL)} AND close_date > DATE '${t}' - INTERVAL '30 days' AND close_date <= DATE '${t}' GROUP BY store_code ORDER BY store_code`);
  return rows.map((r) => ({ store_code: String(r.store_code), name: NAMES[String(r.store_code)] ?? String(r.store_code), ros: Number(r.ros), cp_rate: Number(r.cp_hours) ? Number(r.cp_labor) / Number(r.cp_hours) : 0, available_end: String(col(r, "available_end")) }));
}
