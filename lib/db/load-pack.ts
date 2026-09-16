/** Load the Ridgeline CSVs into Postgres in batches. Empty cells become NULL. Idempotent: it truncates first. */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { db } from "./client";
import { parseCsv } from "./csv";

export const PACK_TABLES = ["stores", "staff", "sales_deals", "store_day", "service_ros", "service_day", "inventory_snapshot", "gl_monthly"] as const;
export type PackTable = (typeof PACK_TABLES)[number];

export async function loadPack(opts: { dir?: string; tables?: readonly PackTable[]; batch?: number } = {}): Promise<Record<string, number>> {
  const dir = opts.dir ?? path.join(process.cwd(), "data", "pack");
  const tables = opts.tables ?? PACK_TABLES;
  const batch = opts.batch ?? 500;
  const r = await db();
  const counts: Record<string, number> = {};
  for (const t of tables) {
    const file = path.join(dir, `${t}.csv`);
    if (!existsSync(file)) throw new Error(`missing ${file}`);
    const rows = parseCsv(readFileSync(file, "utf8"));
    const cols = Object.keys(rows[0]);
    await r.query(`TRUNCATE ${t}`);
    for (let i = 0; i < rows.length; i += batch) {
      const chunk = rows.slice(i, i + batch);
      const params: unknown[] = [];
      const values = chunk.map((row) => "(" + cols.map((c) => { params.push(row[c] === "" ? null : row[c]); return `$${params.length}`; }).join(",") + ")").join(",");
      await r.query(`INSERT INTO ${t} (${cols.join(",")}) VALUES ${values}`, params);
    }
    counts[t] = rows.length;
  }
  return counts;
}

export function manifest(): { as_of: string; tables: Record<string, number> } {
  return JSON.parse(readFileSync(path.join(process.cwd(), "data", "pack", "manifest.json"), "utf8"));
}
