/**
 * Manage rights from the terminal (the Users page does the same thing in the browser).
 *   npm run users -- list
 *   npm run users -- add gm.kia@ridgeline.example --tier user --features sales,service --stores CR2 --home CR2 --password ridgeline
 *   (add --secret <base32> to pin a demo user's authenticator secret; --demo no to skip the pre-set secret; --demo alone means yes)
 *   npm run users -- code gm.kia@ridgeline.example        # print the current six-digit code for a demo user
 * Demo users get a pre-set authenticator secret so you can sign in as them without four phones. Your own account enrolls for real.
 */
import "./env";
import { initSchema } from "@/lib/db/init";
import { listUsers, upsertUser, setPassword, setTotp, getUser } from "@/lib/rights/store";
import { hashPassword } from "@/lib/auth/password";
import { currentCode, newSecret } from "@/lib/auth/totp";
import type { Tier } from "@/lib/rights/types";

// --flag value; a bare --flag (no value, or followed by another flag) reads as "yes"
function arg(name: string, def = ""): string { const i = process.argv.indexOf(`--${name}`); if (i < 0) return def; const v = process.argv[i + 1]; return v === undefined || v.startsWith("--") ? "yes" : v; }
(async () => {
  await initSchema();
  const [cmd, email] = process.argv.slice(2).filter((a) => !a.startsWith("--") && !process.argv[process.argv.indexOf(a) - 1]?.startsWith("--"));
  if (cmd === "list") {
    for (const u of await listUsers()) console.log(`${u.email.padEnd(34)} ${u.tier.padEnd(12)} features=${u.features.join(",") || "-"} stores=${u.allStores ? "ALL" : u.stores.join(",") || "-"} home=${u.homeStore ?? "-"} 2fa=${u.totpSecret ? "yes" : "no"}`);
    return;
  }
  if (cmd === "add" && email) {
    const actor = process.env.BOOTSTRAP_ADMIN || "terminal";
    const allStores = arg("stores", "") === "ALL";
    await upsertUser(actor, { email, tier: (arg("tier", "user") as Tier), features: arg("features", "").split(",").filter(Boolean), stores: allStores ? [] : arg("stores", "").split(",").filter(Boolean), allStores, homeStore: arg("home", "") || null });
    if (arg("password")) await setPassword(email, hashPassword(arg("password")));
    const u = await getUser(email);
    if (u && !u.totpSecret && arg("demo", "yes") === "yes") await setTotp(email, { totpSecret: arg("secret") || newSecret() });
    console.log(`saved ${email}`);
    return;
  }
  if (cmd === "code" && email) {
    const u = await getUser(email);
    if (!u?.totpSecret) { console.error("no authenticator secret for that user"); process.exit(1); }
    console.log(currentCode(u.totpSecret));
    return;
  }
  console.log("usage: users list | add <email> --tier T --features a,b --stores CR1,CR2|ALL --home CR1 --password P | code <email>");
})().catch((e) => { console.error(e.message); process.exit(1); });
