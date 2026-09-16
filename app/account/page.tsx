import { requireScope } from "@/lib/auth/require";
import { changePassword } from "@/lib/auth/verify-login";
import { redirect } from "next/navigation";

export default async function Account({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const scope = await requireScope(); const sp = await searchParams;
  async function change(form: FormData) {
    "use server";
    const s = await requireScope();
    const ok = await changePassword(s.email, String(form.get("current") ?? ""), String(form.get("next") ?? ""));
    redirect(ok ? "/account?ok=1" : "/account?err=1");
  }
  return (
    <>
      <h1>Account</h1>
      <p className="lede">{scope.email} · tier {scope.tier} · features {scope.features.join(", ") || "none"} · {scope.allStores ? "all stores" : scope.stores.join(", ")}</p>
      {sp.ok && <p className="ok">Password changed.</p>}{sp.err && <p className="err">Current password did not match, or the new one is under 10 characters.</p>}
      <form className="stack" action={change}>
        <label>Current password<input id="current" name="current" type="password" required /></label>
        <label>New password, 10 characters or more<input id="next" name="next" type="password" minLength={10} required /></label>
        <button type="submit">Change password</button>
      </form>
    </>
  );
}
