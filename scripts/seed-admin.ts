/** Make BOOTSTRAP_ADMIN the first admin (tier admin, all stores, every feature) with BOOTSTRAP_PASSWORD. Safe to rerun. */
import "./env";
import { initSchema } from "@/lib/db/init";
import { getUser, upsertUser, setPassword } from "@/lib/rights/store";
import { hashPassword } from "@/lib/auth/password";
import { FEATURES } from "@/lib/rights/types";
(async () => {
  const email = (process.env.BOOTSTRAP_ADMIN || "").trim().toLowerCase();
  const password = process.env.BOOTSTRAP_PASSWORD || "";
  if (!email || !password) { console.error("Set BOOTSTRAP_ADMIN and BOOTSTRAP_PASSWORD first."); process.exit(1); }
  await initSchema();
  const existing = await getUser(email);
  await upsertUser("system", { email, tier: "admin", features: [...FEATURES], stores: [], allStores: true, homeStore: null });
  if (!existing?.passwordHash) await setPassword(email, hashPassword(password));
  console.log(`${email} is an admin with all stores. Sign in, enroll your authenticator, then change the password.`);
})().catch((e) => { console.error(e.message); process.exit(1); });
