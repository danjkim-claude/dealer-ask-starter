import "./env";
import { initSchema, proveReadOnly } from "@/lib/db/init";
import { db } from "@/lib/db/client";
(async () => {
  const r = await db();
  await initSchema();
  console.log(`schema ready on ${r.engine}`);
  console.log(`read-only proof: ${await proveReadOnly()}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
