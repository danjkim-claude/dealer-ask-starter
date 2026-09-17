/**
 * The guard. Attendees make this real in the rights block; every test in guard.test.ts is red until then.
 * validate(sql, scope, catalog) -> { ok, reason, sql }
 *
 * Rules, in order (see PROMPTS/02-rights-and-guard.md for the wording you paste into Claude Code):
 *  scrub  strip comments; empty string literals in one left-to-right pass, keeping the literal values;
 *         a quoted identifier that contains a quote, a semicolon, OR, or AND is rejected outright.
 *  1  exactly one statement (no semicolons other than a trailing one)
 *  2  begins with SELECT or WITH; none of INSERT UPDATE DELETE DROP ALTER CREATE GRANT REVOKE CALL EXECUTE COPY USE MERGE TRUNCATE
 *  3  only the catalog's table after FROM / JOIN (CTE names defined in the same query are fine)
 *  4  no denied column anywhere; no SELECT *, no t.*, no FN(*) except COUNT(*)
 *  5  scoped users (all_stores false): the WHERE clause has STORE_COLUMN IN (...) or = '...' whose values are a subset
 *     of scope.stores, and no OR at the top level of the WHERE clause (OR 1=1 would switch the filter off)
 *  6  restricted users (tier user): no CTE, subquery, UNION, JOIN, or OR anywhere
 *  7  cap LIMIT at 5000 and append one if missing, on the comment-stripped text
 * No SQL parser library. Scrub, then plain regular expressions.
 */
import type { Catalog } from "./catalog";
import type { Scope } from "@/lib/rights/types";

export const MAX_LIMIT = 5000;
export type GuardResult = { ok: boolean; reason: string; sql: string };

export function validate(sql: string, scope: Scope, catalog: Pick<Catalog, "binding" | "deny_columns">): GuardResult {
  void sql; void scope; void catalog;
  throw new Error("NotImplemented: ask/guard.ts validate(). Make guard.test.ts pass.");
}
