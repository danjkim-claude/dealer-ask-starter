/** Drizzle definitions for the app tables. The DDL in schema.sql is the source of truth; keep both in step. */
import { pgTable, text, boolean, timestamp, serial, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  email: text("email").primaryKey(),
  passwordHash: text("password_hash"),
  totpSecret: text("totp_secret"),
  totpPending: text("totp_pending"),
  tier: text("tier").notNull().default("user"),
  features: text("features").array().notNull().default(sql`'{}'::text[]`),
  stores: text("stores").array().notNull().default(sql`'{}'::text[]`),
  allStores: boolean("all_stores").notNull().default(false),
  homeStore: text("home_store"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const askAudit = pgTable("ask_audit", {
  id: serial("id").primaryKey(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  actor: text("actor").notNull(),
  kind: text("kind").notNull(),
  entry: jsonb("entry").notNull(),
});

export type UserRow = typeof users.$inferSelect;
