/** Drizzle on top of whichever engine lib/db/client.ts chose. */
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

type Drizzle = ReturnType<typeof import("drizzle-orm/neon-http").drizzle<typeof schema>>;
const g = globalThis as unknown as { __dealerAskDrizzle?: Promise<Drizzle> | null };

export function drizzleDb(): Promise<Drizzle> {
  if (!g.__dealerAskDrizzle) g.__dealerAskDrizzle = build();
  return g.__dealerAskDrizzle;
}

async function build(): Promise<Drizzle> {
  const url = process.env.DATABASE_URL || "pglite://memory";
  if (url.startsWith("pglite://")) {
    // Share the PGlite instance the raw runner uses, so tests see one database.
    await db();
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const client = (globalThis as unknown as { __pglite?: InstanceType<typeof PGlite> }).__pglite;
    if (!client) throw new Error("PGlite client not initialised");
    return drizzle({ client, schema }) as unknown as Drizzle;
  }
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  return drizzle({ client: neon(url), schema });
}

export function resetDrizzleForTests(): void { g.__dealerAskDrizzle = null; }
