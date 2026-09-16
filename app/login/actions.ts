"use server";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { ensureBootstrap } from "@/lib/auth/bootstrap";
import { verifyLogin, startEnroll, confirmEnroll } from "@/lib/auth/verify-login";
import { qrDataUrl } from "@/lib/auth/totp";

export type LoginState = { error?: string };
export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  await ensureBootstrap();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "");
  const check = await verifyLogin(email, password, code);
  if (!check.ok) {
    if (check.reason === "enroll_required") redirect(`/login/enroll?email=${encodeURIComponent(email)}`);
    return { error: check.reason === "bad_code" ? "That code did not match. Open your authenticator app and try the current one." : check.reason === "disabled" ? "Your access is disabled." : "Email or password did not match." };
  }
  try {
    await signIn("credentials", { email, password, code, redirectTo: "/dashboard" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Sign-in failed. Try again." };
    throw e; // the redirect
  }
  return {};
}

export type EnrollState = { error?: string; qr?: string; secret?: string; email?: string; done?: boolean };
export async function enrollAction(_prev: EnrollState, form: FormData): Promise<EnrollState> {
  await ensureBootstrap();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const code = String(form.get("code") ?? "");
  if (code) {
    const ok = await confirmEnroll(email, code);
    return ok ? { done: true, email } : { error: "That code did not match. Scan the QR code again and enter the code the app shows now.", email };
  }
  const s = await startEnroll(email, password);
  if (!s.ok) return { error: "Email or password did not match.", email };
  return { qr: await qrDataUrl(s.uri), secret: s.secret, email };
}
