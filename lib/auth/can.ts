/** Feature check, kept tiny on purpose: a feature grant is not a store grant. Store scope is enforced in SQL by the guard. */
import type { Scope } from "@/lib/rights/types";
export function can(scope: Scope, feature: string): boolean {
  return scope.ok && (scope.tier === "admin" || scope.features.includes(feature));
}
