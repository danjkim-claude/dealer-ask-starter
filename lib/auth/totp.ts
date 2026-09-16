/** The second factor: a shared secret and a six-digit code that changes every 30 seconds, the same scheme banks use. */
import { authenticator } from "otplib";
import QRCode from "qrcode";

export function newSecret(): string { return authenticator.generateSecret(); }
export function otpauthUri(email: string, secret: string): string { return authenticator.keyuri(email, "Dealer Ask", secret); }
export function currentCode(secret: string): string { return authenticator.generate(secret); }
export function checkCode(code: string, secret: string | null | undefined): boolean {
  if (!secret) return false;
  try { return authenticator.check((code || "").replace(/\s+/g, ""), secret); } catch { return false; }
}
export async function qrDataUrl(uri: string): Promise<string> { return QRCode.toDataURL(uri, { margin: 1, width: 220 }); }
