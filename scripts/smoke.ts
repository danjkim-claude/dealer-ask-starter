/** One tiny call to the runtime model. Prints the model and token counts, nothing else. */
import "./env";
import Anthropic from "@anthropic-ai/sdk";
(async () => {
  if (process.env.ASK_MOCK === "1") {
    console.log("mock mode (ASK_MOCK=1): no model call made. Unset ASK_MOCK in .env.local and rerun to test your real key.");
    return;
  }
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY is not set in this terminal."); process.exit(1); }
  const model = process.env.ASK_MODEL || "claude-opus-5";
  const r = await new Anthropic().messages.create({ model, max_tokens: 10, messages: [{ role: "user", content: "Reply with the single word: ok" }] });
  console.log(`${r.model} ok \u00b7 input ${r.usage.input_tokens} tokens \u00b7 output ${r.usage.output_tokens} tokens`);
})().catch((e) => {
  if (e.status === 401) console.error("Your Anthropic key was rejected (401). Check ANTHROPIC_API_KEY in .env.local; run npm run setup to re-enter it.");
  else if (e.status === 400 && /credit|balance/i.test(String(e.message))) console.error("Your Anthropic account has no credit (400). Add $5 at console.anthropic.com under Billing.");
  else console.error(e.status ? `${e.status}: ${e.message}` : e.message);
  process.exit(1);
});
