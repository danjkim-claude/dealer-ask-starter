import test, { before } from "node:test";
import assert from "node:assert/strict";
import { initSchema } from "@/lib/db/init";
import { upsertUser, setPassword } from "@/lib/rights/store";
import { hashPassword } from "./password";
import { currentCode } from "./totp";
import { verifyLogin, startEnroll, confirmEnroll } from "./verify-login";

const EMAIL = "owner@ridgeline.example";
before(async () => {
  process.env.DATABASE_URL = "pglite://memory";
  await initSchema();
  await upsertUser("system", { email: EMAIL, tier: "admin", features: ["sales"], stores: [], allStores: true, homeStore: null });
  await setPassword(EMAIL, hashPassword("correct horse battery"));
});

test("wrong password is refused without saying which part was wrong", async () => {
  const r = await verifyLogin(EMAIL, "nope", "000000"); assert.ok(!r.ok && r.reason === "bad_credentials");
});
test("right password before enrollment asks for enrollment, never lets you in", async () => {
  const r = await verifyLogin(EMAIL, "correct horse battery", "000000"); assert.ok(!r.ok && r.reason === "enroll_required");
});
test("enrollment needs the password and then a correct code from the phone", async () => {
  assert.ok(!(await startEnroll(EMAIL, "wrong")).ok);
  const s = await startEnroll(EMAIL, "correct horse battery"); assert.ok(s.ok);
  if (!s.ok) return;
  assert.match(s.uri, /^otpauth:\/\/totp\//);
  assert.equal(await confirmEnroll(EMAIL, "123456"), false);
  assert.equal(await confirmEnroll(EMAIL, currentCode(s.secret)), true);
});
test("after enrollment a sign-in needs password and the current code", async () => {
  const bad = await verifyLogin(EMAIL, "correct horse battery", "000000"); assert.ok(!bad.ok && bad.reason === "bad_code");
  const { getUser } = await import("@/lib/rights/store");
  const u = await getUser(EMAIL);
  const ok = await verifyLogin(EMAIL, "correct horse battery", currentCode(u!.totpSecret!)); assert.ok(ok.ok);
});
