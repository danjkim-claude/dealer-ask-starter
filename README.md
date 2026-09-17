# Dealer Ask starter

An internal assistant over a dealer group's DMS data, with user rights, built the way the production BC Dashboard is built:
Next.js on Vercel, Neon Postgres, Auth.js sign-in with an authenticator code, and the Claude API behind an ask box that
never supplies a number itself.

This is the kit for the Claude for Dealers advanced track. Everyone builds on the same synthetic data pack, the Ridgeline
Auto Group (four rooftops, thirteen months, no customer data), so every screen in the room shows the same numbers.

## One-click start

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdanjkim-claude%2Fdealer-ask-starter&project-name=dealer-ask&repository-name=dealer-ask&env=ANTHROPIC_API_KEY,AUTH_SECRET,BOOTSTRAP_ADMIN,BOOTSTRAP_PASSWORD&envDescription=Your%20Claude%20API%20key%2C%20a%20long%20random%20string%2C%20your%20email%2C%20and%20a%20first%20password.&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

The button copies this repository into your GitHub, creates the Vercel project, attaches a Neon Postgres database
(Vercel sets `DATABASE_URL`), and asks you for the four other settings. Then, on your laptop:

```bash
git clone https://github.com/<you>/dealer-ask && cd dealer-ask
npm install
npm run setup                      # a terminal wizard asks for the five settings and writes .env.local; typing is masked, nothing is printed
npm run check:env                  # five names, each "set"; never prints a value
git pull                           # "Already up to date." proves git and your GitHub sign-in work
claude                             # answer Yes to 'trust this folder', then paste PROMPTS/01-setup-and-first-deploy.md (it runs the rest)
```

## What is in the box

| Folder | What it is | Who writes it |
|---|---|---|
| `data/pack/` | The Ridgeline DMS pack: 8 CSVs, `manifest.json` | shipped |
| `docs/` | How to understand dealership data: glossary, grains, tables, metrics, gotchas, worked examples | shipped |
| `lib/db/` | Database door: Neon in production, an in-process Postgres for tests; read-only transactions for every query | shipped |
| `lib/rights/` | The rights record (five fields per person) and `resolve(email)` | shipped; you add the people |
| `lib/auth/` | Password plus authenticator sign-in, and the server-side gates every page calls | shipped |
| `lib/ask/guard.ts` | The guard that reads generated SQL and refuses what a person may not see | **you, in the rights block** |
| `catalog/` | One YAML per table the assistant may answer from | **you, in the ask block** |
| `lib/ask/ask.ts` | The loop: plan, guard, run, narrate, verify, repair once, fall back | shipped |
| `app/` | Sign-in, dashboard, ask box, Users page | shipped; you add four report pages |
| `PROMPTS/` | The prompts you paste into Claude Code, one per block; `01b` paints the site in your group's colours | shipped |
| `DESIGN.md` | The page rules Claude follows: brand tokens, meaning colours, layout, covered dates | shipped |
| `SOLUTIONS/` | The answer key: a finished guard and two finished catalogs. Do not open until the block ends | shipped |

## Sign-in

Email, password, and a six-digit code from an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password).
Your own account enrolls for real: sign in once, scan the QR code. Demo people (the Kia GM, the service director) get a
pre-set code you can print with `npm run users -- code <email>` so you can sign in as them without four phones.
The take-home prompt swaps this for Google or Microsoft sign-in restricted to your company's email domain.

## The rules the tests enforce

- A feature grant is not a store grant. A GM needs both.
- Scope lives in SQL: the guard requires the person's store filter in the query and rejects anything else.
- Restricted people get one simple SELECT: no subqueries, unions, joins, or OR.
- Absent is not zero. Every total carries its covered dates; a store with no rows did not report.
- Every question and every rights change writes one audit row. Nothing writes to the warehouse.

## Take-home

`PROMPTS/05-take-home-oauth.md` adds Google or Microsoft sign-in with an allowed-domain list. `PROMPTS/06-own-data.md`
points the same catalog pattern at your own DMS export or warehouse view. Both keep the guard exactly as it is.
