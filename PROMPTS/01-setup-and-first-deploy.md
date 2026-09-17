# 01 · Setup and first deploy (run while the rights concept is covered)

You already did the one-click deploy and ran `npm run setup` to write `.env.local`. This prompt proves the whole road
works end to end: your laptop, the database, the model, GitHub, and the live site. It also profiles the table you will
teach the assistant about.

## Paste this

```
Read CLAUDE.md and README.md. Then, in this order, without asking me anything:

1. Run npm run check:env. It prints each of the five settings as set or blank, never a value (you cannot read .env.local, and must not try). If any is blank, stop and tell me which name to fill in. If all five are set, continue; a placeholder value is my problem, not yours.
2. Run npm install, then npm run db:init, npm run db:load-pack, npm run db:seed-admin. Show me the read-only proof line and the row counts against the manifest.
3. Run npm run smoke and show me the one line it prints.
4. Run npm test. Three files are red on purpose until the rights block, because the guard is still a skeleton: lib/ask/guard.test.ts, lib/ask/ask.test.ts and lib/dashboard/q.test.ts. Every other test must pass. Tell me the pass and fail counts and confirm only those three files failed.
5. Write data/PROFILE.md for the store_day table from real queries through a small tsx script that uses lib/db/client.ts readOnly(): row count, every column's type and null rate, min and max of report_date, rows per store with each store's last report date, distinct values of any low-cardinality column, and the unique key with proof (count vs count distinct). Do not read docs/06-gotchas-and-refusals.md; I want the profile to find things on its own. End the profile with two one-line answers in your own words: "What is one row in this table?" and "How fresh is this data?"
6. Do not run any git command: this laptop may not have git, and publishing is done by hand in GitHub Desktop. Instead, finish by telling me in one line to open GitHub Desktop, type the commit message "Setup: pack loaded, profile written", click Commit to main, then click Push origin. Say that the live site rebuilds about a minute after that push. Then remind me to open my Vercel URL from the Deploy checkpoint and sign in once it has rebuilt.
7. Finish with a five-line summary: what runs where, what the profile found that surprised you, and what I should click first on the live site.
```

## Check

- The smoke line says `claude-opus-5 ok` with token counts.
- `data/PROFILE.md` exists, names the unique key, and mentions that one store stops early and that a money column is text.
- In GitHub Desktop: the changed files are listed, you type the message Claude gave you, click Commit to main, then Push origin.
- About a minute later the live site shows the sign-in page. Sign in with your email and the first password; enroll your authenticator; you land on a dashboard that says the guard is not written yet. The tiles arrive after prompt 02.
