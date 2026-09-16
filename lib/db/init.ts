import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "./client";

/** Create every table if it does not exist. Safe to run repeatedly. */
export async function initSchema(): Promise<void> {
  const ddl = readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf8");
  const r = await db();
  await r.exec(ddl);
}

/** Prove the Ask path cannot write: a CREATE TABLE inside readOnly() must fail. Returns the database's own error text. */
export async function proveReadOnly(): Promise<string> {
  const r = await db();
  try {
    await r.readOnly("CREATE TABLE should_not_exist (x int)");
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error("readOnly() allowed a CREATE TABLE. The database path is not read-only.");
}
