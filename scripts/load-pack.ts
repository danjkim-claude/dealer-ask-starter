import "./env";
import { initSchema } from "@/lib/db/init";
import { loadPack, manifest } from "@/lib/db/load-pack";
import { db } from "@/lib/db/client";
(async () => {
  await initSchema();
  const t0 = Date.now();
  const counts = await loadPack();
  const want = manifest().tables; let bad = 0;
  for (const [t, n] of Object.entries(counts)) { const ok = want[t] === n; if (!ok) bad++; console.log(`${ok ? "ok " : "BAD"} ${t.padEnd(20)} ${n} rows${ok ? "" : ` (manifest says ${want[t]})`}`); }
  const r = await db();
  const [{ n }] = await r.query("SELECT COUNT(*)::int AS n FROM store_day") as { n: number }[];
  console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s on ${r.engine}; store_day has ${n} rows; as_of ${manifest().as_of}`);
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
