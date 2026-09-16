/** resolve(email) -> Scope. The one lookup that turns an identity into what a person may see. */
import { getUser } from "./store";
import type { Scope, Tier } from "./types";

const RESTRICTED: Tier[] = ["user"];

export async function resolve(email: string): Promise<Scope> {
  const u = await getUser(email);
  if (!u) return { ok: false, email, reason: "You are signed in, but you are not set up to use this assistant. Ask your administrator to add you." };
  if (u.tier === "disabled") return { ok: false, email, reason: "Your access is disabled." };
  const allStores = !!u.allStores;
  const stores = allStores ? [] : [...(u.stores ?? [])];
  if (!allStores && stores.length === 0) return { ok: false, email, reason: "You have no store assigned, so store reports cannot be shown." };
  const tier = (u.tier as Tier) || "user";
  return { ok: true, email: u.email, tier, features: [...(u.features ?? [])], stores, allStores, homeStore: u.homeStore ?? null, restricted: RESTRICTED.includes(tier) };
}

export function hasFeature(scope: Scope, feature: string): boolean {
  return scope.ok && scope.features.includes(feature);
}

export function isAdmin(scope: Scope): boolean {
  return scope.ok && scope.tier === "admin";
}
