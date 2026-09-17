/**
 * `npm run setup`: a terminal wizard that writes .env.local from what you type or paste.
 * Secrets are typed with the screen masked; nothing you enter is ever printed, logged, or sent to Claude.
 * Run it in a plain terminal, not inside Claude Code.
 */
import { readFileSync, writeFileSync, existsSync, chmodSync } from "node:fs";
import { randomBytes } from "node:crypto";
import readline from "node:readline";

type Field = { name: string; secret: boolean; help: string; check?: (v: string) => string | null; generate?: () => string };
const FIELDS: Field[] = [
  { name: "DATABASE_URL", secret: true, help: "Vercel → your project → Storage → the Neon database → \".env.local\" tab → copy the DATABASE_URL value.\n  It starts with postgresql:// and is long.",
    check: (v) => /^postgres(ql)?:\/\//.test(v) ? null : "That does not start with postgresql://. Copy the whole value, without the name or quotes." },
  { name: "ANTHROPIC_API_KEY", secret: true, help: "console.anthropic.com → API keys → Create key. Paste it here; never into a prompt or a chat.",
    check: (v) => v.startsWith("sk-ant-") ? null : "Anthropic keys start with sk-ant-. Check what you pasted." },
  { name: "AUTH_SECRET", secret: true, help: "A long random string that signs the sign-in cookie. Press Enter and the wizard makes one for you.", generate: () => randomBytes(32).toString("base64") },
  { name: "BOOTSTRAP_ADMIN", secret: false, help: "Your work email. It becomes the first admin, with all stores. Use the same one you gave Vercel.",
    check: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "That does not look like an email address." },
  { name: "BOOTSTRAP_PASSWORD", secret: true, help: "A first password for that admin. Use the same one you gave Vercel; you change it after enrolling your authenticator.",
    check: (v) => v.length >= 8 ? null : "Use at least 8 characters." },
];
const FILE = ".env.local";
const ENTER = "\r", NEWLINE = "\n", CTRL_C = String.fromCharCode(3), DEL = String.fromCharCode(127), BS = String.fromCharCode(8);

function existing(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(FILE)) return out;
  for (const line of readFileSync(FILE, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

/** Piped input (tests, scripts): one shared reader so every question gets the next line. */
type Piped = { lines: string[]; waiting: ((l: string) => void)[]; ended: boolean };
let piped: Piped | null = null;
function pipedLine(): Promise<string> {
  if (!piped) {
    const p: Piped = { lines: [], waiting: [], ended: false }; piped = p;
    const rl = readline.createInterface({ input: process.stdin, terminal: false });
    rl.on("line", (l) => { const w = p.waiting.shift(); if (w) w(l.trim()); else p.lines.push(l.trim()); });
    rl.on("close", () => { p.ended = true; for (const w of p.waiting.splice(0)) w(""); });
  }
  const p: Piped = piped;
  if (p.lines.length) return Promise.resolve(p.lines.shift()!);
  if (p.ended) return Promise.resolve("");
  return new Promise((res) => p.waiting.push(res));
}

/** One line from the keyboard. Masked input shows a dot per character and never echoes what was typed. */
function askLine(prompt: string, mask: boolean): Promise<string> {
  process.stdout.write(prompt);
  const stdin = process.stdin;
  if (!stdin.isTTY) return pipedLine();
  if (!mask) {
    return new Promise((res) => {
      const rl = readline.createInterface({ input: stdin, output: process.stdout, terminal: true });
      rl.once("line", (l) => { rl.close(); res(l.trim()); });
    });
  }
  return new Promise((res) => {
    let buf = "";
    stdin.setRawMode(true); stdin.resume(); stdin.setEncoding("utf8");
    const done = (v: string) => { stdin.setRawMode(false); stdin.pause(); stdin.off("data", on); process.stdout.write("\n"); res(v); };
    const on = (chunk: string) => {
      for (const c of chunk) {
        if (c === ENTER || c === NEWLINE) return done(buf.trim());
        if (c === CTRL_C) { process.stdout.write("\n"); process.exit(130); }
        if (c === DEL || c === BS) { if (buf) { buf = buf.slice(0, -1); process.stdout.write(BS + " " + BS); } continue; }
        if (c < " ") continue;
        buf += c; process.stdout.write("•");
      }
    };
    stdin.on("data", on);
  });
}

async function main() {
  const have = existing();
  const values: Record<string, string> = { ...have };
  console.log(`\nDealer Ask setup. This writes ${FILE} on this laptop. Nothing you type is shown, stored anywhere else, or sent to Claude.\n`);
  for (const f of FIELDS) {
    console.log(`${f.name}\n  ${f.help}`);
    const kept = have[f.name]?.trim() ? " (already set; press Enter to keep it)" : f.generate ? " (press Enter to generate one)" : "";
    for (;;) {
      const v = await askLine(`  ${f.secret ? "paste or type, masked" : "type"}${kept}: `, f.secret);
      if (!v && have[f.name]?.trim()) { console.log("  kept.\n"); break; }
      if (!v && f.generate) { values[f.name] = f.generate(); console.log("  generated.\n"); break; }
      if (!v) { console.log("  This one is required."); continue; }
      const problem = f.check?.(v);
      if (problem) { console.log(`  ${problem}`); continue; }
      values[f.name] = v; console.log(`  ok (${v.length} characters).\n`); break;
    }
  }
  const names = FIELDS.map((f) => f.name);
  const extra = Object.keys(have).filter((k) => !names.includes(k)).map((k) => `${k}=${have[k]}`);
  const body = ["# Written by npm run setup. Local only; git ignores this file. Never paste it anywhere.", ...names.map((n) => `${n}=${values[n]}`), ...extra, ""].join("\n");
  writeFileSync(FILE, body); try { chmodSync(FILE, 0o600); } catch { /* windows */ }
  console.log(`Wrote ${FILE}: ${names.filter((n) => values[n]?.trim()).length} of ${names.length} set. Next: npm run check:env, then open Claude Code and paste prompt 01.`);
}
main().catch((e) => { console.error(e instanceof Error ? e.message : String(e)); process.exit(1); });
