/** Prints which of the five settings are set in .env.local, never a value. Exit 1 if any is blank. */
import "./env";
const NAMES = ["DATABASE_URL", "ANTHROPIC_API_KEY", "AUTH_SECRET", "BOOTSTRAP_ADMIN", "BOOTSTRAP_PASSWORD"];
let missing = 0;
for (const n of NAMES) { const ok = !!(process.env[n] && process.env[n]!.trim()); if (!ok) missing++; console.log(`${n.padEnd(20)} ${ok ? "set" : "BLANK"}`); }
console.log(missing ? `${missing} blank. Fill it in .env.local (see .env.example) and run this again.` : "All five set.");
process.exit(missing ? 1 : 0);
