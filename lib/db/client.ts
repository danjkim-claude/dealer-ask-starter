/**
 * One door to the database. Two engines behind it:
 *   - Neon Postgres over HTTP when DATABASE_URL is a postgres:// URL (Vercel and local dev),
 *   - PGlite, an in-process Postgres, when DATABASE_URL starts with pglite:// or is unset (tests).
 * Ask never touches this directly; it goes through readOnly(), which wraps the query in a
 * READ ONLY transaction so a write cannot happen even if the guard were wrong.
 */
import { neon } from "@neondatabase/serverless";

export type Row = Record<string, unknown>;
export interface Runner {
  engine: "neon" | "pglite";
  query(text: string, params?: unknown[]): Promise<Row[]>;
  readOnly(text: string): Promise<Row[]>;
  exec(text: string): Promise<void>;
}

function normalize(rows: Row[]): Row[] {
  for (const r of rows) for (const k of Object.keys(r)) {
    const v = r[k];
    if (v instanceof Date) r[k] = v.toISOString().slice(0, 10);
  }
  return rows;
}

// Cached on globalThis so every server chunk Next produces shares one connection (and one PGlite instance locally).
const g = globalThis as unknown as { __dealerAskRunner?: Promise<Runner> | null };

async function makePglite(url: string): Promise<Runner> {
  const { PGlite } = await import("@electric-sql/pglite");
  const dir = url.replace(/^pglite:\/\//, "");
  const pg = dir && dir !== "memory" ? new PGlite(dir) : new PGlite();
  (globalThis as unknown as { __pglite?: unknown }).__pglite = pg;
  return {
    engine: "pglite",
    async query(text, params = []) { return normalize((await pg.query(text, params as never[])).rows as Row[]); },
    async readOnly(text) {
      return pg.transaction(async (tx) => {
        await tx.query("SET TRANSACTION READ ONLY");
        return normalize((await tx.query(text)).rows as Row[]);
      });
    },
    async exec(text) { await pg.exec(text); },
  };
}

function makeNeon(url: string): Runner {
  const sql = neon(url);
  return {
    engine: "neon",
    async query(text, params = []) { return normalize((await sql.query(text, params as never[])) as Row[]); },
    async readOnly(text) {
      const [rows] = await sql.transaction([sql.query(text)], { readOnly: true });
      return normalize(rows as Row[]);
    },
    async exec(text) {
      for (const stmt of text.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean)) await sql.query(stmt);
    },
  };
}

export function db(): Promise<Runner> {
  if (!g.__dealerAskRunner) {
    const url = process.env.DATABASE_URL || "pglite://memory";
    g.__dealerAskRunner = url.startsWith("pglite://") ? makePglite(url) : Promise.resolve(makeNeon(url));
  }
  return g.__dealerAskRunner;
}

/** Tests call this to start from an empty in-memory database. */
export function resetDbForTests(): void { g.__dealerAskRunner = null; }
