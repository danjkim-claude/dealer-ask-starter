"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form className="stack" action={action}>
      <label>Email<input id="email" name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input id="password" name="password" type="password" autoComplete="current-password" required /></label>
      <label>Authenticator code<input id="code" name="code" inputMode="numeric" pattern="[0-9 ]*" placeholder="123 456" required /></label>
      {state.error && <p className="err">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? "Checking…" : "Sign in"}</button>
    </form>
  );
}
