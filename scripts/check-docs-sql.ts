/** Run every ```sql block in docs/ against the loaded pack and report the ones Postgres rejects. */
import "./env";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { initSchema } from "@/lib/db/init";
import { loadPack } from "@/lib/db/load-pack";
import { db } from "@/lib/db/client";

function walk(dir: string): string[] { return readdirSync(dir).flatMap((f) => { const p = path.join(dir, f); return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : []; }); }
(async () => {
  process.env.DATABASE_URL ||= "pglite://memory";
  await initSchema(); await loadPack();
  const r = await db(); let n = 0, bad = 0;
  for (const f of walk("docs")) {
    const text = readFileSync(f, "utf8");
    for (const m of text.matchAll(/```sql\n([\s\S]*?)```/g)) {
      n++;
      try { const rows = await r.readOnly(m[1]); console.log(`ok   ${path.relative("docs", f)} #${n}: ${rows.length} rows`); }
      catch (e) { bad++; console.log(`FAIL ${path.relative("docs", f)} #${n}: ${(e as Error).message.split("\n")[0]}\n   ${m[1].trim().split("\n")[0]}`); }
    }
  }
  console.log(`${n} blocks, ${bad} failed`); process.exit(bad ? 1 : 0);
})();
