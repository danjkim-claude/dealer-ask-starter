/** Server-side gates. Every page calls one of these before it loads data; there is no client-side permission logic. */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { resolve } from "@/lib/rights/scope";
import { can } from "./can";
import type { Scope } from "@/lib/rights/types";

export async function currentEmail(): Promise<string | null> {
  const s = await auth();
  return s?.user?.email ?? null;
}

/** Signed in and present in the rights table with at least one store, or you are sent to /login or /denied. */
export async function requireScope(): Promise<Extract<Scope, { ok: true }>> {
  const email = await currentEmail();
  if (!email) redirect("/login");
  const scope = await resolve(email);
  if (!scope.ok) redirect("/denied");
  return scope;
}

export async function requireFeature(feature: string) {
  const scope = await requireScope();
  if (!can(scope, feature)) redirect("/denied?feature=" + feature);
  return scope;
}

export async function requireAdmin() {
  const scope = await requireScope();
  if (scope.tier !== "admin") redirect("/denied?admin=1");
  return scope;
}
