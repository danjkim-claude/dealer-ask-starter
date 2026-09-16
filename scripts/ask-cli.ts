/** npm run ask -- --user gm.kia@ridgeline.example "How many units MTD?"   [--mock] [--lie] */
import "./env";
import { answer } from "@/lib/ask/ask";
(async () => {
  const a = process.argv.slice(2);
  const user = a[a.indexOf("--user") + 1];
  const question = a.filter((x, i) => !x.startsWith("--") && a[i - 1] !== "--user").join(" ");
  if (!user || !question) { console.error('usage: npm run ask -- --user <email> "question" [--mock] [--lie]'); process.exit(2); }
  const r = await answer(user, question, { mock: a.includes("--mock"), lie: a.includes("--lie") });
  console.log(r.text);
  if (r.outcome === "answered") {
    console.log("\nHow this was computed:\n" + r.sql);
    console.log(`\n[verify: ${r.verify}${r.issues.length ? ` · first-pass issues: ${JSON.stringify(r.issues)}` : ""} · rows: ${r.rows.length}${r.tokens ? ` · tokens: ${r.tokens}` : ""}]`);
  } else console.log(`\n[${r.outcome}]`);
})().catch((e) => { console.error(e.message); process.exit(1); });
