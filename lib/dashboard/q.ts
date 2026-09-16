/**
 * Every dashboard query goes through here: the guard validates it with the signed-in person's scope, then it runs read-only.
 * The page cannot show a store the guard would refuse, because the page never runs SQL any other way.
 */
import { db, type Row } from "@/lib/db/client";
import { validate } from "@/lib/ask/guard";
import type { Scope } from "@/lib/rights/types";
import { BINDINGS, type BindingKey } from "./bindings";
import { asOf } from "@/lib/ask/ask";

export class GuardRefused extends Error {}

export async function q(scope: Scope, table: BindingKey, sql: string): Promise<Row[]> {
  const cat = BINDINGS[table];
  const g = validate(sql, scope, cat);
  if (!g.ok) throw new GuardRefused(g.reason);
  return (await db()).readOnly(g.sql);
}

/** The SQL fragment every scoped query starts from: the asker's stores as an IN list, or all stores for the owner. */
export function storeFilter(scope: Scope, col = "store_code", allStores: string[] = []): string {
  if (!scope.ok) return `${col} IN ('')`;
  const list = scope.allStores ? allStores : scope.stores;
  return `${col} IN (${list.map((s) => `'${s}'`).join(",")})`;
}
export const today = asOf;
