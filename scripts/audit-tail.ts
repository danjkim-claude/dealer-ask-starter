/** The last N rows of ask_audit, newest last: who asked, what happened, and the SQL that ran. npm run audit -- 20 */
import "./env";
import { readAudit } from "@/lib/rights/store";
const n = Number(process.argv[2] || 12);
(async () => {
  const rows = (await readAudit(n)).reverse();
  for (const r of rows) {
    const e = r.entry as Record<string, unknown>;
    const sql = typeof e.sql === "string" ? e.sql.replace(/\s+/g, " ").slice(0, 70) : "";
    console.log(`${new Date(r.ts as unknown as string).toISOString().slice(0, 16).replace("T", " ")}  ${r.actor.padEnd(32)} ${r.kind.padEnd(13)} ${String(e.outcome ?? e.target ?? "").padEnd(18)} ${String(e.verify ?? "").padEnd(9)} ${sql}`);
  }
  if (!rows.length) console.log("no audit rows yet");
})().catch((e) => { console.error(e.message); process.exit(1); });
