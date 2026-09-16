/** On the first sign-in attempt, make sure the tables exist and BOOTSTRAP_ADMIN has a row. Idempotent and cheap. */
import { initSchema } from "@/lib/db/init";
import { getUser, upsertUser, setPassword } from "@/lib/rights/store";
import { hashPassword } from "./password";
import { FEATURES } from "@/lib/rights/types";

let done: Promise<void> | null = null;
export function ensureBootstrap(): Promise<void> {
  if (!done) done = run().catch((e) => { done = null; throw e; });
  return done;
}
async function run() {
  await initSchema();
  const email = (process.env.BOOTSTRAP_ADMIN || "").trim().toLowerCase();
  const password = process.env.BOOTSTRAP_PASSWORD || "";
  if (!email || !password) return;
  const u = await getUser(email);
  if (u?.passwordHash) return;
  await upsertUser("system", { email, tier: "admin", features: [...FEATURES], stores: [], allStores: true, homeStore: null });
  await setPassword(email, hashPassword(password));
}
