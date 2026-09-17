"use client";
import { useActionState } from "react";
import { enrollAction, type EnrollState } from "../actions";

export default function EnrollForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<EnrollState, FormData>(enrollAction, { email });
  if (state.done) return <p className="ok">Done. <a href="/login?enrolled=1">Sign in</a> with your password and the current code.</p>;
  return (
    <form className="stack" action={action}>
      {state.qr ? (
        <>
          <input type="hidden" name="email" value={state.email ?? email} />
          <p><b>{state.email}</b>: scan this with your authenticator app, then type the code it shows.</p>
          <img src={state.qr} alt="QR code for your authenticator app" width={220} height={220} />
          <details style={{ fontSize: ".85rem", color: "var(--muted)" }}><summary>Cannot scan the code?</summary><p className="sub" style={{ fontSize: ".85rem", color: "var(--muted)", marginTop: ".4rem" }}>Enter this key by hand: <code>{state.secret}</code><br />Treat it like a password: anyone who has it can generate your six-digit codes. Do not screenshot this.</p></details>
          <label>Code from the app<input id="code" name="code" inputMode="numeric" required /></label>
          <button type="submit" disabled={pending}>Confirm</button>
        </>
      ) : (
        <>
          <label>Email<input id="email" name="email" type="email" defaultValue={state.email ?? email} required /></label>
          <label>Password<input id="password" name="password" type="password" required /></label>
          <button type="submit" disabled={pending}>{pending ? "Working…" : "Show my QR code"}</button>
        </>
      )}
      {state.error && <p className="err">{state.error}</p>}
    </form>
  );
}
