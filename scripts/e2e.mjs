// Browser walk-through of the app with screenshots. Run: node scripts/e2e.mjs http://localhost:3005 out-dir
import { chromium } from "playwright-core";
import { authenticator } from "otplib";
import { mkdirSync } from "node:fs";
const [base, out] = [process.argv[2] || "http://localhost:3005", process.argv[3] || "e2e-shots"];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const shot = (n) => page.screenshot({ path: `${out}/${n}.png`, fullPage: true });
page.on("console", (m) => { if (m.type() === "error") console.log("[browser]", m.text().slice(0, 200)); });
process.on("unhandledRejection", async (e) => { console.log("[e2e] FAILED:", String(e).split("\n")[0]); try { console.log("[e2e] page:", page.url(), (await page.textContent("main") || "").replace(/\s+/g, " ").slice(0, 300)); await shot("zz-failure"); } catch {} await browser.close(); process.exit(1); });
const log = (...a) => console.log("[e2e]", ...a);
// 1 login page
await page.goto(`${base}/login`); await shot("01-login"); log("login page", await page.title());
// 2 owner enrolls an authenticator
await page.goto(`${base}/login/enroll`);
await page.fill("#email", "owner@ridgeline.example"); await page.fill("#password", "ridgeline-owner-2026"); await page.click("main form button[type=submit]");
await page.waitForSelector("img[alt*='QR']"); await shot("02-enroll-qr");
const secret = (await page.textContent("code")).trim(); log("secret shown", secret.length, "chars");
await page.fill("#code", authenticator.generate(secret)); await page.click("main form button[type=submit]"); await page.waitForSelector("text=Done"); log("enrolled");
// 3 owner signs in
async function login(email, password, sec) { await page.goto(`${base}/login`); await page.fill("#email", email); await page.fill("#password", password); await page.fill("#code", authenticator.generate(sec)); await page.click("main form button[type=submit]"); await Promise.race([page.waitForURL(/dashboard|denied/), page.waitForSelector(".err")]); if (await page.locator(".err").count()) log("login error:", await page.textContent(".err")); }
await login("owner@ridgeline.example", "ridgeline-owner-2026", secret); log("owner at", page.url()); await page.waitForSelector("h1"); await shot("03-dashboard-owner");
log("owner h1:", await page.textContent("h1")); log("flags:", await page.locator(".flag").allTextContents());
// 4 users page: add gm.hyundai
await page.goto(`${base}/admin/users`); await shot("04-users"); 
await page.fill("#u_email", "gm.hyundai@ridgeline.example"); await page.fill("#u_stores", "CR1"); await page.fill("#u_home", "CR1"); await page.check("#u_service"); await page.fill("#u_password", "ridgeline-hyundai"); await page.check("#u_demo"); await page.click("form.card button[type=submit]");
await page.waitForSelector("text=gm.hyundai@ridgeline.example"); await shot("05-users-after-add"); log("users rows:", await page.locator("tbody tr").count());
// 5 ask (mock)
await page.goto(`${base}/ask`); await page.fill("#question", "Total gross last 7 days across all stores"); await page.click("main form button[type=submit]");
try { await page.waitForSelector(".card p", { timeout: 45000 }); } catch { log("ASK TIMEOUT; page text:", (await page.textContent("main")).replace(/\s+/g, " ").slice(0, 400)); await shot("zz-ask-timeout"); }
await shot("06-ask-owner"); log("ask:", ((await page.textContent(".card p").catch(() => "")) || "").slice(0, 160));
// 6 sign out, GM signs in
await page.click("header button"); await page.waitForURL(/login/);
await login("gm.kia@ridgeline.example", "ridgeline-kia", "JBSWY3DPEHPK3PXP"); await page.waitForSelector("h1"); await shot("07-dashboard-gm"); log("gm h1:", await page.textContent("h1"), "| nav:", await page.locator("header nav").textContent());
await page.goto(`${base}/admin/users`); await page.waitForURL(/denied/); await shot("08-denied-gm"); log("gm users page ->", page.url());
await page.goto(`${base}/ask`); await page.fill("#question", "Total gross last 7 days across all stores"); await page.click("main form button[type=submit]"); await page.waitForSelector(".card"); await shot("09-ask-gm"); log("gm ask:", (await page.textContent(".card")).slice(0, 200));
// 7 disabled user
await page.click("header button"); await page.waitForURL(/login/);
await page.goto(`${base}/login`); await page.fill("#email", "former@ridgeline.example"); await page.fill("#password", "ridgeline-former"); await page.fill("#code", authenticator.generate("JBSWY3DPEHPK3PXR")); await page.click("main form button[type=submit]"); await page.waitForSelector(".err"); log("former:", await page.textContent(".err")); await shot("10-disabled");
// 8 stranger with no row: sign in as service.east then check /ask scope denial for sales feature
await login("service.east@ridgeline.example", "ridgeline-east", "JBSWY3DPEHPK3PXQ"); await page.waitForSelector("h1"); log("service.east h1:", await page.textContent("h1")); await shot("11-dashboard-service");
await browser.close(); log("done");
