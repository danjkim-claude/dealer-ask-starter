"use server";
import { requireScope } from "@/lib/auth/require";
import { answer, type Answer } from "@/lib/ask/ask";

export type AskState = { question?: string; result?: Answer };
export async function askAction(_prev: AskState, form: FormData): Promise<AskState> {
  const scope = await requireScope();
  const question = String(form.get("question") ?? "").trim().slice(0, 500);
  if (!question) return {};
  const result = await answer(scope.email, question, { mock: process.env.ASK_MOCK === "1" });
  return { question, result };
}
