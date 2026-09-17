# 03 · The catalog and the ask loop (run while the dashboard concept is covered)

What the assistant is told about your table, in one file the guard also reads. Then six questions, four people, one planted lie.

## Paste this

```
Read data/PROFILE.md, catalog/TEMPLATE.yaml, one example in catalog/examples/ for SHAPE ONLY, and docs/03-tables/store_day.md. Then, without asking me anything:

1. Write catalog/store_day.yaml. Every number in it comes from my PROFILE.md or a query you run now through lib/db/client.ts readOnly(); never from the example files.
   - grain, unique_key with the proof as a comment; binding: table, store column, time column, freshness
   - facts: 5 to 8 named metrics a general manager would ask for, each with an exact SQL expression; money stored as text is cast; pre-aggregated rows are SUMmed, never counted
   - gotchas: at least 2, each with a number you measured (a null rate, a store that stops early, a text money column)
   - refusals: at least 1 metric someone would ask for that this table cannot honestly answer, with the evidence
   - deny_columns: any column that could identify a person, by name, even if absent today
   - example_questions: 5 plain-English questions a GM would ask
   Run npm run catalog:render and show me the block the planner will receive.
2. Run these and show me the answer, the SQL, the covered dates, and the verify status for each:
   npm run ask -- --user gm.kia@ridgeline.example "How many units did we deliver in the last 30 days?"
   npm run ask -- --user controller@ridgeline.example "Total gross last 7 days across all stores"
   npm run ask -- --user gm.kia@ridgeline.example "Total gross last 7 days across all stores"
   With a real key the third must answer for Kia only and say so in one sentence without lecturing about permissions. On the mock planner (ASK_MOCK=1) the mock deliberately asks for all four stores and the guard refuses it; that refusal is the correct result, not a failure. Tell me which of the two you got.
3. Now three that should not be answered normally. Each must be a one-sentence plain-English decline, and none may contain a number:
   npm run ask -- --user service.east@ridgeline.example "What was total gross last month?"
   npm run ask -- --user former@ridgeline.example "How many units MTD?"
   npm run ask -- --user gm.kia@ridgeline.example "What is our close rate on internet leads?"
4. The planted lie: run npm run ask -- --lie --user controller@ridgeline.example "units by store last 7 days" and show me the first-pass issues the verifier found and whether it repaired or fell back to plain rows.
5. Read the last eight rows of the ask_audit table with a small tsx script (actor, outcome, verify, sql) and print them as a table.
6. Run npm run verify. Do not run any git command: this laptop may not have git, and publishing is done by hand in GitHub Desktop. Instead, finish by telling me in one line to open GitHub Desktop, type the commit message "Catalog and ask loop", click Commit to main, then click Push origin. Say that the live site rebuilds about a minute after that push.
7. Finish with a five-line summary: the gotcha with the biggest number, which question was declined and why, and what the planted lie taught you.
```

## Check

- The controller's seven-day answer names Kia's covered dates, ending 2026-09-02, rather than showing Kia as a zero. With a real key it should also say in words that Kia did not report after that date.
- The Kia GM's "all stores" question either answers for Kia only (real key) or is refused by the guard naming CR1, CR3 and CR4 (mock). Either one is a pass.
- Three declines with no numbers in them.
- The planted lie shows at least one first-pass issue and a verify status of repaired or fallback.
- On the live site, the Ask page answers the first question for gm.kia and shows the SQL under "How this was computed".
