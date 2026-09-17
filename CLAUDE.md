# Dealer Ask starter

You are building an internal assistant over a dealer group's DMS data, with user rights, for a person who is not a developer.
They paste one prompt from `PROMPTS/`, walk away, and come back to a checkpoint. Work so that is true.

## How to work here
- Work on your own. Do not ask questions. When something is ambiguous, choose the option that keeps the tests passing and
  write one line about it in `NOTES.md` so the person can read what you decided.
- Before you stop, run `npm run verify` (typecheck and tests). Report the counts in one line. Before the rights block the guard is a skeleton,
  so `lib/ask/guard.test.ts`, `lib/ask/ask.test.ts` and `lib/dashboard/q.test.ts` are red; nothing else may be.
- Never print, paste, or commit a secret. `.env.local` holds the keys; you may check that a name is set, never show a value.
- Never edit anything under `SOLUTIONS/`. It is the answer key.
- **Never run a git command.** This laptop may not have git installed, and the person publishes by hand in GitHub Desktop: they type the commit message, click Commit to main, then Push origin. End a block by telling them the exact message to use. Vercel deploys every push to main; there is no separate deploy step.
- Speak plainly in your summaries: what changed, which test proved it, what the person should look at next.
- Read `DESIGN.md` before adding or changing any page. Brand colours come from the person's website (prompt 01b); meaning colours never change.
- This project is self-contained: it lives in its own folder, and everything it needs is inside it. Never write to the person's global Claude configuration, their home directory, or any path outside this folder.
- The person's own `~/.claude/CLAUDE.md` still loads alongside this file. Where the two disagree about this folder, this file wins; otherwise follow theirs.

## The data
- Read `docs/README.md`, then `docs/02-data-sources-and-grains.md` and `docs/05-question-patterns.md` before writing any query.
- **Today is 2026-09-05** (`data/pack/manifest.json` → `as_of`). Never use the machine clock for relative windows.
- The warehouse is Postgres on Neon. The Ridgeline pack's eight tables carry the CSV names. All queries run inside a
  READ ONLY transaction through `lib/db/client.ts`; never add another path to the database.
- Numbers come only from SQL. Never estimate, recall, or extrapolate a figure.
- The sale definition on `sales_deals` is `sale_type IN ('R','L') AND status = 'F'`. `store_day.total_gross` is text with
  commas: `REPLACE(total_gross, ',', '')::numeric`. Use one inventory snapshot at a time. Rate service labor by pay type.
- Every date-filtered query returns its covered dates, and every answer states them. A store with no rows did not report;
  it did not do zero.
- This is DMS data only. Leads, appointments, close rates, cost per lead, and marketing attribution live in the CRM and the
  ad platforms: decline those in one sentence and name the system that holds them.
- Check `docs/06-gotchas-and-refusals.md` before computing anything listed there. Speak dealer language (`docs/00-glossary.md`).

## The stack, and where things live
- Next.js (app router, server components and server actions), Auth.js for sign-in, Drizzle over Neon Postgres, the
  Anthropic SDK for the model, `node --test` for tests. This mirrors the production dashboard it was cut from.
- `lib/rights/` the rights record and `resolve(email)`; `lib/auth/` password, authenticator, and the server-side gates;
  `lib/ask/` catalog, guard, ask loop, verifier; `lib/dashboard/` the query helper every tile must use; `app/` the pages.
- The only way a page or the assistant reaches data is `lib/dashboard/q.ts` (pages) or `lib/ask/ask.ts` (questions).
  Both run the SQL through `lib/ask/guard.ts` with the signed-in person's scope first.
- `catalog/*.yaml` is the machine-enforced description of a table; `docs/` is the human-and-model context.

## Commands
`npm run setup` (terminal wizard, writes `.env.local`; a person runs it, never Claude) · `npm run check:env` · `npm run db:init` · `npm run db:load-pack` · `npm run db:seed-admin` · `npm run users -- list|add|code` · `npm run audit -- 20` ·
`npm run ask -- --user <email> "question" [--mock] [--lie]` · `npm run catalog:render [file]` · `npm run smoke` ·
`npm run dev` · `npm run build` · `npm test` · `npm run verify`
