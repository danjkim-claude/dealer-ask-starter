/**
 * The Ask loop. Complete. The order is the contract; do not reorder:
 * resolve scope -> feature check -> render catalog -> plan SQL (tool call) -> guard -> run read-only -> narrate -> verify -> repair once -> fall back to plain rows.
 * Every run writes one audit row. Nothing here can write to the warehouse: the query runs inside a READ ONLY transaction.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { db, type Row } from "@/lib/db/client";
import { resolve, hasFeature } from "@/lib/rights/scope";
import { appendAudit } from "@/lib/rights/store";
import { loadCatalog, renderCatalog, type Catalog } from "./catalog";
import { validate } from "./guard";
import { check } from "./verify";
import { parseCsv } from "@/lib/db/csv";

export const MODEL = process.env.ASK_MODEL || "claude-opus-5";
const ROOT = process.cwd();

export function storeNames(): Record<string, string> {
  const rows = parseCsv(readFileSync(path.join(ROOT, "data", "pack", "stores.csv"), "utf8"));
  return Object.fromEntries(rows.map((r) => [r.store_code, r.store_name]));
}
/** "Today" for every relative window: ASK_TODAY, else the pack manifest. Never the clock. */
export function asOf(): string {
  if (process.env.ASK_TODAY) return process.env.ASK_TODAY;
  return JSON.parse(readFileSync(path.join(ROOT, "data", "pack", "manifest.json"), "utf8")).as_of;
}
function prompt(name: string, vars: Record<string, string>): string {
  let t = readFileSync(path.join(ROOT, "lib", "ask", name), "utf8");
  for (const [k, v] of Object.entries(vars)) t = t.split(`{{${k}}}`).join(v);
  return t;
}

const RUN_SQL_TOOL: Anthropic.Tool = {
  name: "run_sql",
  description: "Run one read-only SQL query against the catalog table, or refuse with sql='' and a reason.",
  input_schema: {
    type: "object", additionalProperties: false, required: ["sql", "reason"],
    properties: { sql: { type: "string", description: "One SELECT statement, or empty string to refuse." }, reason: { type: "string", description: "Which fact you chose and why, or the plain-English refusal." } },
  },
};

export type Answer =
  | { outcome: "permission_denied" | "refused"; text: string }
  | { outcome: "safety_block"; text: string; sql: string }
  | { outcome: "answered"; text: string; sql: string; verify: "passed" | "repaired" | "fallback"; issues: string[]; rows: Row[]; tokens: number | null };

export interface AskOptions { mock?: boolean; lie?: boolean; catalogPath?: string }

async function plan(client: Anthropic | null, system: string, question: string, mock: boolean): Promise<{ sql: string; reason: string; tokens: number | null }> {
  if (mock || !client) return mockPlan(question);
  const r = await client.messages.create({
    model: MODEL, max_tokens: 4000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    tools: [RUN_SQL_TOOL], tool_choice: { type: "tool", name: "run_sql" },
    messages: [{ role: "user", content: question }],
  });
  const tokens = r.usage.input_tokens + r.usage.output_tokens;
  for (const b of r.content) if (b.type === "tool_use" && b.name === "run_sql") { const i = b.input as { sql: string; reason: string }; return { sql: i.sql ?? "", reason: i.reason ?? "", tokens }; }
  return { sql: "", reason: "The planner returned no query.", tokens };
}

async function narrate(client: Anthropic | null, system: string, question: string, sql: string, rows: Row[], mock: boolean, lie?: string | null): Promise<string> {
  if (mock || !client) return mockNarrate(rows, lie);
  const user = `QUESTION: ${question}\n\nSQL THAT RAN:\n${sql}\n\nROWS (JSON):\n${JSON.stringify(rows).slice(0, 20000)}`;
  const r = await client.messages.create({ model: MODEL, max_tokens: 2000, system, messages: [{ role: "user", content: user }] });
  let text = r.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");
  if (lie) text += " " + lie;
  return text;
}

export function fallbackTable(rows: Row[]): string {
  if (!rows.length) return "No rows were returned.";
  const cols = Object.keys(rows[0]); const w = cols.map((c) => Math.max(c.length, ...rows.map((r) => String(r[c]).length)));
  const line = (r: Row) => cols.map((c, i) => String(r[c]).padEnd(w[i])).join(" | ");
  return [line(Object.fromEntries(cols.map((c) => [c, c]))), w.map((x) => "-".repeat(x)).join("-+-"), ...rows.slice(0, 50).map(line)].join("\n");
}

export async function answer(user: string, question: string, opts: AskOptions = {}): Promise<Answer> {
  const mock = !!opts.mock || process.env.ASK_MOCK === "1";
  const catalogPath = opts.catalogPath ?? process.env.ASK_CATALOG ?? path.join(ROOT, "catalog", "store_day.yaml");
  if (!existsSync(catalogPath)) {
    const text = `There is no catalog yet. Write ${path.relative(ROOT, catalogPath)} (the catalog block) and the assistant will know what it may answer.`;
    await appendAudit(user, "ask", { question, outcome: "refused", reason: text });
    return { outcome: "refused", text };
  }
  const catalog: Catalog = loadCatalog(catalogPath);
  const names = storeNames();
  const scope = await resolve(user);
  if (!scope.ok) { await appendAudit(user, "ask", { question, outcome: "permission_denied", reason: scope.reason }); return { outcome: "permission_denied", text: scope.reason }; }
  if (!hasFeature(scope, catalog.feature)) {
    const reason = `Your access does not include ${catalog.feature} reporting.`;
    await appendAudit(user, "ask", { question, outcome: "permission_denied", reason });
    return { outcome: "permission_denied", text: reason };
  }
  const allowed = scope.allStores ? Object.keys(names) : scope.stores;
  const b = catalog.binding;
  const system = prompt("planner.md", {
    ALLOWED_STORES: allowed.map((s) => `${s} (${names[s] ?? s})`).join(", "),
    ALLOWED_STORES_SQL: allowed.map((s) => `'${s}'`).join(", "),
    STORE_COLUMN: b.store_column, TIME_COLUMN: b.time_column,
    RESTRICTED_SHAPE_RULE: scope.restricted ? "Your query must be a single simple SELECT: no CTEs, subqueries, UNION, JOIN, or OR." : "",
    TODAY: asOf(), DIALECT: "PostgreSQL", CATALOG_BLOCK: renderCatalog(catalog),
  });
  const client = mock ? null : new Anthropic();
  const p = await plan(client, system, question, mock);
  if (!p.sql.trim()) { await appendAudit(user, "ask", { question, outcome: "refused", reason: p.reason }); return { outcome: "refused", text: p.reason }; }
  const g = validate(p.sql, scope, catalog);
  if (!g.ok) { await appendAudit(user, "ask", { question, outcome: "safety_block", reason: g.reason, sql: p.sql }); return { outcome: "safety_block", text: g.reason, sql: p.sql }; }
  const rows = await (await db()).readOnly(g.sql);
  const nameList = Object.entries(names).map(([k, v]) => `${k} = ${v}`).join(", ");
  let lieText: string | null = null;
  if (opts.lie && rows.length >= 2 && "store_code" in rows[0]) {
    const other = rows.find((r) => r.store_code !== rows[0].store_code);
    const val = Object.entries(rows[0]).find(([k, v]) => k !== "store_code" && Number.isFinite(Number(v)) && !/^\d{4}-\d{2}-\d{2}/.test(String(v)))?.[1];
    if (other && val != null) lieText = `${names[String(other.store_code)] ?? other.store_code} delivered ${Number(val)} units.`;
  }
  let prose = await narrate(client, prompt("narrator.md", { STORE_NAMES: nameList, REPAIR_BLOCK: "" }), question, g.sql, rows, mock, lieText);
  const issues = check(prose, rows, scope, catalog, names);
  let status: "passed" | "repaired" | "fallback" = "passed";
  if (issues.length) {
    const repair = "YOUR PREVIOUS DRAFT WAS REJECTED. Fix exactly these problems and rewrite:\n- " + issues.join("\n- ") + `\n\nREJECTED DRAFT:\n${prose}`;
    const second = await narrate(client, prompt("narrator.md", { STORE_NAMES: nameList, REPAIR_BLOCK: repair }), question, g.sql, rows, mock);
    const issues2 = check(second, rows, scope, catalog, names);
    if (issues2.length) { prose = fallbackTable(rows); status = "fallback"; } else { prose = second; status = "repaired"; }
  }
  await appendAudit(user, "ask", { question, outcome: "answered", verify: status, issues, sql: g.sql, rows: rows.length, tokens: p.tokens, mock });
  return { outcome: "answered", text: prose, sql: g.sql, verify: status, issues, rows, tokens: p.tokens };
}

// ---------- mock planner and narrator: plumbing tests only, no model ----------
function mockPlan(q: string): { sql: string; reason: string; tokens: null } {
  const ql = q.toLowerCase();
  if (ql.includes("trade") || ql.includes("split")) return { sql: "", reason: "This table has no trade or split-deal data, so that cannot be computed.", tokens: null };
  if (ql.includes("lead") || ql.includes("close rate")) return { sql: "", reason: "Leads and close rates live in the CRM, not the DMS, so this assistant cannot answer that.", tokens: null };
  const days = ql.includes("7") || ql.includes("week") ? 7 : 30;
  let where = `report_date > DATE '${asOf()}' - INTERVAL '${days} days' AND report_date <= DATE '${asOf()}'`;
  if (ql.includes("cr1")) where += " AND store_code IN ('CR1')"; // deliberately the wrong store, for the guard test
  else if (/all stores|group|each|by store/.test(ql)) where += " AND store_code IN ('CR1','CR2','CR3','CR4')";
  else where += " AND store_code IN ('CR2')";
  return { sql: `SELECT store_code, SUM(unit_count) AS units, SUM(REPLACE(total_gross, ',', '')::numeric) AS total_gross, MIN(report_date) AS AVAILABLE_START, MAX(report_date) AS AVAILABLE_END FROM store_day WHERE ${where} GROUP BY store_code ORDER BY store_code`, reason: "mock", tokens: null };
}
/** Postgres folds unquoted aliases to lower case, so read AVAILABLE_START either way. */
export function col(r: Row, name: string): unknown { return r[name] ?? r[name.toLowerCase()] ?? r[name.toUpperCase()]; }
function mockNarrate(rows: Row[], lie?: string | null): string {
  const names = storeNames();
  const parts = rows.map((r) => `${names[String(r.store_code)] ?? r.store_code} delivered ${Math.round(Number(r.units))} units for $${Math.round(Number(r.total_gross)).toLocaleString("en-US")} total gross from ${col(r, "AVAILABLE_START")} to ${col(r, "AVAILABLE_END")}.`);
  if (lie) parts.push(lie);
  return parts.join(" ");
}
