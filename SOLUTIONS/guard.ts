/** Reference solution for lib/ask/guard.ts. Copy over lib/ask/guard.ts only after the rights block ends. */
import type { Catalog } from "@/lib/ask/catalog";
import type { Scope } from "@/lib/rights/types";

export const MAX_LIMIT = 5000;
export type GuardResult = { ok: boolean; reason: string; sql: string };
const FORBIDDEN = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "GRANT", "REVOKE", "CALL", "EXECUTE", "COPY", "USE", "MERGE", "TRUNCATE"];

export function scrub(sql: string): string {
  const out: string[] = []; let i = 0; const n = sql.length;
  while (i < n) {
    const c = sql[i];
    if (sql.startsWith("--", i)) { const j = sql.indexOf("\n", i); i = j < 0 ? n : j; continue; }
    if (sql.startsWith("/*", i)) { const j = sql.indexOf("*/", i + 2); i = j < 0 ? n : j + 2; continue; }
    if (c === "'" || c === '"') {
      const q = c; let j = i + 1;
      while (j < n) { if (sql[j] === q) { if (sql[j + 1] === q) { j += 2; continue; } break; } j++; }
      if (q === '"') {
        const inner = sql.slice(i + 1, j);
        out.push(/['";]|\bOR\b|\bAND\b|--/i.test(inner) ? " __BAD_IDENT__ " : inner);
      } else out.push("''");
      i = j + 1; continue;
    }
    out.push(c); i++;
  }
  return out.join("");
}

const singleStatement = (sql: string) => !scrub(sql).trimEnd().replace(/;+$/, "").includes(";");

function readOnly(s: string): [boolean, string] {
  const head = (s.trim().split(/\s+/)[0] || "").toUpperCase();
  if (head !== "SELECT" && head !== "WITH") return [false, "Only read-only SELECT queries are allowed."];
  for (const w of FORBIDDEN) if (new RegExp(`\\b${w}\\b`, "i").test(s)) return [false, `Only read-only SELECT queries are allowed (${w} is not permitted).`];
  return [true, ""];
}

function tablesAllowed(s: string, allowed: Set<string>): [boolean, string] {
  const ctes = new Set<string>();
  if (/^\s*WITH\b/i.test(s)) for (const m of s.matchAll(/\b(\w+)\s+AS\s*\(/gi)) ctes.add(m[1].toLowerCase());
  const ok = new Set([...allowed].map((a) => a.toLowerCase()));
  for (const m of s.matchAll(/\b(?:FROM|JOIN)\s+([\w."]+)/gi)) {
    const name = m[1].replace(/"/g, "").split(".").pop()!.toLowerCase();
    if (!ok.has(name) && !ctes.has(name)) return [false, `The table ${name} is not in the catalog, so it cannot be queried.`];
  }
  return [true, ""];
}

function columnsAllowed(s: string, deny: string[]): [boolean, string] {
  for (const col of deny) if (new RegExp(`\\b${col.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(s)) return [false, `The column ${col} is private and can never be selected.`];
  if (/\bSELECT\s+(DISTINCT\s+)?\*|,\s*\*|\w+\.\*/i.test(s)) return [false, "SELECT * is not allowed; name the catalog facts you need."];
  for (const m of s.matchAll(/\b(\w+)\s*\(\s*\*\s*\)/gi)) if (m[1].toUpperCase() !== "COUNT") return [false, `${m[1]}(*) is not allowed; only COUNT(*) may use *.`];
  if (s.includes("__BAD_IDENT__")) return [false, "A quoted alias or identifier contains a quote or a clause, which is not allowed."];
  return [true, ""];
}

/** True if an OR sits at parenthesis depth 0 inside the WHERE clause: it could switch the store filter off. */
function topLevelOr(scrubbed: string): boolean {
  const m = /\bWHERE\b/i.exec(scrubbed); if (!m) return false;
  let depth = 0;
  for (const t of scrubbed.slice(m.index + m[0].length).matchAll(/\(|\)|\bOR\b|\bGROUP\b|\bORDER\b|\bLIMIT\b/gi)) {
    const tok = t[0].toUpperCase();
    if (tok === "(") depth++; else if (tok === ")") depth--;
    else if (tok === "OR" && depth === 0) return true;
    else if (depth === 0) break;
  }
  return false;
}

function storeScoped(sql: string, col: string, stores: string[]): [boolean, string] {
  const allowed = new Set(stores.map((x) => x.toUpperCase()));
  if (topLevelOr(scrub(sql))) return [false, "An OR at the top of the WHERE clause could bypass your store filter; use AND, or put the OR inside parentheses."];
  const found = [...sql.matchAll(new RegExp(`\\b${col}\\s*(?:=\\s*'([^']*)'|IN\\s*\\(([^)]*)\\))`, "gi"))];
  if (!found.length) return [false, `This question needs a store filter on ${col} for your store(s): ${stores.join(", ")}.`];
  for (const [, eq, inlist] of found) {
    const vals = eq ? [eq] : [...(inlist || "").matchAll(/'([^']*)'/g)].map((m) => m[1]);
    const bad = vals.filter((v) => !allowed.has(v.toUpperCase()));
    if (bad.length) return [false, `Store ${bad.join(", ")} is outside your access (${stores.join(", ")}).`];
  }
  return [true, ""];
}

function restrictedShape(s: string): [boolean, string] {
  if (/^\s*WITH\b/i.test(s) || (s.toUpperCase().match(/SELECT/g) || []).length > 1) return [false, "Your access allows simple queries only: no subqueries or CTEs."];
  for (const kw of ["UNION", "JOIN", "OR"]) if (new RegExp(`\\b${kw}\\b`, "i").test(s)) return [false, `Your access allows simple queries only: ${kw} is not permitted.`];
  return [true, ""];
}

function capLimit(sql: string): string {
  sql = sql.replace(/\bLIMIT\s+(\d+)/gi, (_, n) => `LIMIT ${Math.min(parseInt(n, 10), MAX_LIMIT)}`);
  const s = scrub(sql); let depth = 0, top = false;
  for (const m of s.matchAll(/\(|\)|\bLIMIT\b/gi)) {
    if (m[0] === "(") depth++; else if (m[0] === ")") depth--; else if (depth === 0) top = true;
  }
  return top ? sql : sql.trimEnd().replace(/;+$/, "") + `\nLIMIT ${MAX_LIMIT}`;
}

export function validate(sql: string, scope: Scope, catalog: Pick<Catalog, "binding" | "deny_columns">): GuardResult {
  if (!scope.ok) return { ok: false, reason: scope.reason, sql };
  if (!singleStatement(sql)) return { ok: false, reason: "Only one statement is allowed (no semicolons).", sql };
  const s = scrub(sql);
  for (const [ok, why] of [readOnly(s), tablesAllowed(s, new Set([catalog.binding.table])), columnsAllowed(s, catalog.deny_columns ?? [])]) {
    if (!ok) return { ok: false, reason: why, sql };
  }
  if (scope.restricted) { const [ok, why] = restrictedShape(s); if (!ok) return { ok: false, reason: why, sql }; }
  if (!scope.allStores) { const [ok, why] = storeScoped(sql, catalog.binding.store_column, scope.stores); if (!ok) return { ok: false, reason: why, sql }; }
  return { ok: true, reason: "", sql: capLimit(sql) };
}
