"use client";
import { useActionState } from "react";
import { askAction, type AskState } from "./actions";

export default function AskForm({ examples }: { examples: string[] }) {
  const [state, action, pending] = useActionState<AskState, FormData>(askAction, {});
  const r = state.result;
  return (
    <>
      <form className="stack" action={action} style={{ maxWidth: "40rem" }}>
        <label>Ask about your store<textarea id="question" name="question" rows={2} defaultValue={state.question ?? examples[0]} required /></label>
        <button type="submit" disabled={pending}>{pending ? "Working…" : "Ask"}</button>
      </form>
      <p className="sub" style={{ color: "var(--muted)", fontSize: ".9rem" }}>Try: {examples.slice(1, 4).join(" · ")}</p>
      {r && (
        <div className="card">
          <p style={{ whiteSpace: "pre-wrap" }}>{r.text}</p>
          {r.outcome === "answered" && (
            <>
              <details><summary>How this was computed</summary><pre>{r.sql}</pre></details>
              <p className="sub" style={{ color: "var(--muted)", fontSize: ".85rem" }}>verify: {r.verify}{r.issues.length ? ` · first draft rejected: ${r.issues.join(" ")}` : ""} · rows: {r.rows.length}</p>
            </>
          )}
          {r.outcome !== "answered" && <span className="pill warn">{r.outcome.replace("_", " ")}</span>}
        </div>
      )}
    </>
  );
}
