/**
 * Checks between the narration and the rows it claims to describe. Complete; attendees read it, not write it.
 * check(prose, rows, scope, catalog, storeNames) -> plain-English violations (empty = pass).
 */
import type { Row } from "@/lib/db/client";
import type { Scope } from "@/lib/rights/types";
import type { Catalog } from "./catalog";

const BANNED = ["ttm", "dedup", "normalized", "stddev", "right-censor", "select ", "group by", "null", "varchar", "coalesce"];
const NUM = /(?<![\w.])\$?\(?-?\d[\d,]*\.?\d*%?\)?/g;
const DATE_RE = /\b(\d{4})-(\d{2})-(\d{2})\b/g;

function numsIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(NUM)) {
    const t = m[0].replace(/^[$(]+|[)%]+$/g, "").replace(/,/g, "");
    if (!t || t === "-" || t === ".") continue;
    const v = Number(t); if (Number.isFinite(v)) out.push(v);
  }
  return out;
}
const stripDates = (t: string) => t.replace(DATE_RE, " ");
const isDatey = (v: unknown) => v instanceof Date || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v));

function cellValues(rows: Row[]): number[] {
  const vals: number[] = [];
  for (const r of rows) for (const v of Object.values(r)) {
    if (typeof v === "boolean" || v == null || isDatey(v)) continue;
    if (typeof v === "number") vals.push(v);
    else if (typeof v === "string") { const n = Number(v.replace(/,/g, "")); if (Number.isFinite(n)) vals.push(n); }
  }
  return vals;
}
const asNumber = (v: unknown): number | null => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && !isDatey(v)) { const n = Number(v.replace(/,/g, "")); return Number.isFinite(n) ? n : null; }
  return null;
};

/** Arithmetic a narrator may legitimately do: pairwise sum/difference, ratios, percentages (<=100), and whole-column totals. */
function derived(vals: number[], rows?: Row[]): Set<number> {
  const d = new Set<number>(); const v = vals.slice(0, 40);
  for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) {
    const a = v[i], b = v[j];
    d.add(a + b); d.add(a - b); d.add(b - a);
    if (b) { d.add(a / b); if (a >= 0 && a <= b) d.add((100 * a) / b); }
    if (a) { d.add(b / a); if (b >= 0 && b <= a) d.add((100 * b) / a); }
  }
  if (rows && rows.length) for (const k of Object.keys(rows[0])) {
    const col = rows.map((r) => asNumber(r[k])).filter((x): x is number => x !== null);
    if (col.length === rows.length && col.length > 1) { const s = col.reduce((x, y) => x + y, 0); d.add(s); d.add(s / col.length); }
  }
  return d;
}
const close = (x: number, pool: Iterable<number>, rel = 0.006, absr = 0.51) => { for (const y of pool) if (Math.abs(x - y) <= Math.max(absr, Math.abs(y) * rel)) return true; return false; };
const isYear = (x: number) => x >= 1990 && x <= 2100 && Math.trunc(x) === x;

export function numbersInRows(prose: string, rows: Row[]): string[] {
  const cells = cellValues(rows);
  const pool = new Set<number>([...cells, ...derived(cells, rows), rows.length]);
  const bad = new Set<number>();
  for (const x of numsIn(stripDates(prose))) { if (isYear(x)) continue; if (!close(x, pool)) bad.add(x); }
  return [...bad].sort((a, b) => a - b).map((x) => `The number ${x} does not appear in the rows and is not arithmetic on them.`);
}

/** When a sentence names exactly one store that has a row, every number in it must be in that row (or arithmetic on it). */
export function attribution(prose: string, rows: Row[], storeNames: Record<string, string>): string[] {
  if (!rows.length) return [];
  const keyCol = Object.keys(rows[0]).find((k) => ["store_code", "store", "rooftop"].includes(k.toLowerCase()));
  if (!keyCol) return [];
  const byStore = new Map<string, Row[]>();
  for (const r of rows) { const c = String(r[keyCol]).toUpperCase(); byStore.set(c, [...(byStore.get(c) ?? []), r]); }
  const issues: string[] = [];
  for (const sent of prose.split(/(?<=[.!?])\s+/)) {
    const named = new Set<string>();
    for (const [code, name] of Object.entries(storeNames)) {
      const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if ((new RegExp(`\\b${esc(name)}\\b`, "i").test(sent) || new RegExp(`\\b${esc(code)}\\b`).test(sent)) && byStore.has(code.toUpperCase())) named.add(code.toUpperCase());
    }
    if (named.size !== 1) continue;
    const code = [...named][0]; const cells = cellValues(byStore.get(code)!); const pool = new Set([...cells, ...derived(cells, byStore.get(code)!)]);
    for (const x of numsIn(stripDates(sent))) { if (isYear(x)) continue; if (!close(x, pool)) issues.push(`The sentence about ${storeNames[code] ?? code} uses ${x}, which is not in that store's row.`); }
  }
  return issues;
}

export function coverage(prose: string, rows: Row[], scope: Scope, storeNames: Record<string, string>): string[] {
  const issues: string[] = []; if (!rows.length || !scope.ok) return issues;
  const keys = Object.keys(rows[0]);
  const hasDates = keys.some((k) => ["AVAILABLE_START", "AVAILABLE_END"].includes(k.toUpperCase()));
  if (hasDates && !/\d{4}-\d{2}-\d{2}|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.? \d{1,2}/.test(prose)) issues.push("State the covered dates (AVAILABLE_START to AVAILABLE_END) in the answer.");
  const keyCol = keys.find((k) => ["store_code", "store"].includes(k.toLowerCase()));
  const expected = scope.allStores ? Object.keys(storeNames) : scope.stores;
  if (keyCol && expected.length > 1) {
    const present = new Set(rows.map((r) => String(r[keyCol]).toUpperCase()));
    const missing = expected.filter((s) => !present.has(s.toUpperCase()));
    if (missing.length && !/did not report|has not reported|no data|not reported/i.test(prose)) issues.push(`${missing.map((s) => storeNames[s] ?? s).join(", ")} has no row; say it did not report. Absent is not zero.`);
  }
  const endCol = keys.find((k) => k.toUpperCase() === "AVAILABLE_END");
  if (keyCol && endCol && rows.length > 1) {
    const ends = new Map<string, string>();
    for (const r of rows) if (r[endCol] != null) ends.set(String(r[keyCol]).toUpperCase(), String(r[endCol]).slice(0, 10));
    const latest = [...ends.values()].sort().pop();
    for (const [code, end] of ends) if (latest && end < latest && !prose.includes(end) && !new RegExp(`did not report|has not reported|not yet reported|through ${end}`, "i").test(prose)) issues.push(`${storeNames[code] ?? code} only has data through ${end}; say so, or say it did not report after that date.`);
  }
  return issues;
}

export function bannedWords(prose: string, catalog: Pick<Catalog, "binding">): string[] {
  const low = prose.toLowerCase(); const issues: string[] = [];
  for (const w of BANNED) if (low.includes(w)) issues.push(`Do not use the word '${w.trim()}' in a GM-facing answer.`);
  const b = catalog.binding as Record<string, unknown>;
  const idents = [b.table, b.store_column, b.time_column].filter((c): c is string => typeof c === "string" && c.includes("_"));
  for (const col of idents) if (new RegExp(`\\b${col.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(prose)) issues.push(`Do not show the column or table name '${col}'; use its dealer label.`);
  return issues;
}

export function check(prose: string, rows: Row[], scope: Scope, catalog: Pick<Catalog, "binding">, storeNames: Record<string, string>): string[] {
  if (!rows.length) return [];
  return [...new Set([...numbersInRows(prose, rows), ...attribution(prose, rows, storeNames), ...coverage(prose, rows, scope, storeNames), ...bannedWords(prose, catalog)])];
}
