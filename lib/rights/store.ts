/** The rights record: one row per person in the users table, plus one audit row per change. */
import { eq, desc } from "drizzle-orm";
import { drizzleDb } from "./drizzle";
import { users, askAudit, type UserRow } from "@/lib/db/schema";
import type { Tier } from "./types";

export type UserInput = { email: string; tier: Tier; features: string[]; stores: string[]; allStores: boolean; homeStore: string | null };

const norm = (e: string) => (e || "").trim().toLowerCase();

export async function getUser(email: string): Promise<UserRow | null> {
  const d = await drizzleDb();
  const rows = await d.select().from(users).where(eq(users.email, norm(email))).limit(1);
  return rows[0] ?? null;
}

export async function listUsers(): Promise<UserRow[]> {
  const d = await drizzleDb();
  return d.select().from(users).orderBy(users.email);
}

/** Create or update the five rights fields. Writes one audit line: who, whom, before, after. */
export async function upsertUser(actor: string, input: UserInput): Promise<void> {
  const d = await drizzleDb();
  const email = norm(input.email);
  const before = await getUser(email);
  const fields = { tier: input.tier, features: input.features, stores: input.allStores ? [] : input.stores, allStores: input.allStores, homeStore: input.homeStore || null };
  if (before) await d.update(users).set(fields).where(eq(users.email, email));
  else await d.insert(users).values({ email, ...fields });
  await appendAudit(actor, "rights_change", {
    target: email,
    before: before ? pick(before) : null,
    after: fields,
  });
}

export async function setPassword(email: string, passwordHash: string): Promise<void> {
  const d = await drizzleDb();
  await d.update(users).set({ passwordHash }).where(eq(users.email, norm(email)));
}

export async function setTotp(email: string, patch: { totpSecret?: string | null; totpPending?: string | null }): Promise<void> {
  const d = await drizzleDb();
  await d.update(users).set(patch).where(eq(users.email, norm(email)));
}

export async function appendAudit(actor: string, kind: string, entry: Record<string, unknown>): Promise<void> {
  const d = await drizzleDb();
  await d.insert(askAudit).values({ actor: norm(actor) || "system", kind, entry });
}

export async function readAudit(limit = 20, kind?: string) {
  const d = await drizzleDb();
  const rows = await d.select().from(askAudit).orderBy(desc(askAudit.id)).limit(200);
  return (kind ? rows.filter((r) => r.kind === kind) : rows).slice(0, limit);
}

function pick(u: UserRow) {
  return { tier: u.tier, features: u.features, stores: u.stores, allStores: u.allStores, homeStore: u.homeStore };
}
