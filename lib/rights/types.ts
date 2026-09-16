export type Tier = "admin" | "store_admin" | "user" | "disabled";
export const TIERS: Tier[] = ["admin", "store_admin", "user", "disabled"];
export const FEATURES = ["sales", "service", "finance"] as const;
export type Feature = (typeof FEATURES)[number];

/** The object every other layer trusts. Resolved from the database on every request; never from a cookie. */
export type Scope =
  | { ok: true; email: string; tier: Tier; features: string[]; stores: string[]; allStores: boolean; homeStore: string | null; restricted: boolean }
  | { ok: false; email: string; reason: string };
