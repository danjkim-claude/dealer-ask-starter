/** Everything a sign-in must prove, in one place, so the web route and the tests share it. */
import { getUser, setTotp, setPassword, appendAudit } from "@/lib/rights/store";
import { checkPassword, hashPassword } from "./password";
import { checkCode, newSecret, otpauthUri } from "./totp";

export type LoginResult = { ok: true; email: string } | { ok: false; reason: "bad_credentials" | "enroll_required" | "bad_code" | "disabled" };

export async function verifyLogin(email: string, password: string, code: string, opts: { audit?: boolean } = { audit: true }): Promise<LoginResult> {
  const u = await getUser(email);
  if (!u || !checkPassword(password, u.passwordHash)) return { ok: false, reason: "bad_credentials" };
  if (u.tier === "disabled") return { ok: false, reason: "disabled" };
  if (!u.totpSecret) return { ok: false, reason: "enroll_required" };
  if (!checkCode(code, u.totpSecret)) return { ok: false, reason: "bad_code" };
  if (opts.audit !== false) await appendAudit(u.email, "sign_in", { method: "password+totp" });
  return { ok: true, email: u.email };
}

/** Step one of enrollment: password proves the person, a fresh secret is parked in totp_pending. */
export async function startEnroll(email: string, password: string): Promise<{ ok: true; uri: string; secret: string } | { ok: false }> {
  const u = await getUser(email);
  if (!u || !checkPassword(password, u.passwordHash)) return { ok: false };
  const secret = newSecret();
  await setTotp(u.email, { totpPending: secret });
  return { ok: true, uri: otpauthUri(u.email, secret), secret };
}

/** Step two: a correct code from the app proves the phone has the secret; it becomes the real one.
 *  The password was already proven in step one, which is the only way a pending secret gets parked. */
export async function confirmEnroll(email: string, code: string): Promise<boolean> {
  const u = await getUser(email);
  if (!u || !u.totpPending) return false;
  if (!checkCode(code, u.totpPending)) return false;
  await setTotp(u.email, { totpSecret: u.totpPending, totpPending: null });
  await appendAudit(u.email, "sign_in", { method: "totp_enrolled" });
  return true;
}

export async function changePassword(email: string, current: string, next: string): Promise<boolean> {
  const u = await getUser(email);
  if (!u || !checkPassword(current, u.passwordHash) || next.length < 10) return false;
  await setPassword(u.email, hashPassword(next));
  return true;
}
