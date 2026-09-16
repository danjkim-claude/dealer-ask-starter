/** One tiny call to the runtime model. Prints the model and token counts, nothing else. */
import "./env";
import Anthropic from "@anthropic-ai/sdk";
(async () => {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY is not set in this terminal."); process.exit(1); }
  const model = process.env.ASK_MODEL || "claude-opus-5";
  const r = await new Anthropic().messages.create({ model, max_tokens: 10, messages: [{ role: "user", content: "Reply with the single word: ok" }] });
  console.log(`${r.model} ok · input ${r.usage.input_tokens} tokens · output ${r.usage.output_tokens} tokens`);
})().catch((e) => { console.error(e.status ? `${e.status}: ${e.message}` : e.message); process.exit(1); });
