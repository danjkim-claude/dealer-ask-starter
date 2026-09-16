/** Load one catalog entity and render it into the block the planner prompt receives. The guard reads the same object. */
import { readFileSync } from "node:fs";
import yaml from "js-yaml";

export interface Catalog {
  entity: string; label: string; feature: string; grain: string; unique_key: string[];
  binding: { table: string; store_column: string; time_column: string; freshness: string; notes?: string };
  facts: Record<string, { label: string; expr: string; description: string }>;
  gotchas?: { name: string; rule: string }[];
  refusals?: { name: string; reason: string }[];
  deny_columns?: string[];
  example_questions?: string[];
}

export function loadCatalog(path: string): Catalog {
  return yaml.load(readFileSync(path, "utf8")) as Catalog;
}

export function renderCatalog(cat: Catalog): string {
  const b = cat.binding;
  const out: string[] = [
    `ENTITY ${cat.entity} — ${cat.label}`,
    `Grain: ${cat.grain.trim()}`,
    `Unique key: ${cat.unique_key.join(", ")}`,
    `Table: ${b.table}   Store column: ${b.store_column}   Time column: ${b.time_column}`,
    `Freshness: ${b.freshness}`,
  ];
  if (b.notes) out.push(`Notes: ${b.notes.trim()}`);
  out.push("\nFACTS (use these expressions verbatim; alias each as its name):");
  for (const [k, v] of Object.entries(cat.facts ?? {})) out.push(`  ${k} [${v.label}]: ${v.expr}\n      ${v.description.trim()}`);
  out.push("\nGOTCHAS (rules that change the answer):");
  for (const g of cat.gotchas ?? []) out.push(`  - ${g.name}: ${g.rule.trim()}`);
  out.push("\nREFUSALS (the catalog will not answer these; return empty sql with the reason):");
  for (const r of cat.refusals ?? []) out.push(`  - ${r.name}: ${r.reason.trim()}`);
  const dc = cat.deny_columns ?? [];
  out.push("\nDENIED COLUMNS (never select, filter, or group on): " + (dc.length ? dc.join(", ") : "none"));
  out.push("\nEXAMPLE QUESTIONS this entity answers:");
  for (const q of cat.example_questions ?? []) out.push(`  - ${q}`);
  return out.join("\n");
}
