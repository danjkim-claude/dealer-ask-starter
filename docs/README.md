# Ridgeline Auto Group — mock DMS data pack

A fictional four-rooftop dealer group with 13 months of internally consistent **DMS-only** data: what a dealer management system holds. Deals and F&I, service repair orders, inventory, monthly accounting, and employees. Nothing from a CRM, a BDC tool, or an ad platform; those live in other systems and are out of scope on purpose. No customer PII anywhere: no names, phones, emails, addresses, VINs, or payment amounts. Staff names are fictional.

| | |
|---|---|
| As-of date | **2026-09-05**. Treat this as "today" for every question. Do not use the machine clock. |
| Range | 2025-09-01 to 2026-09-05 (12 full months plus 5 days of September) |
| Rooftops | CR1 Ridgeline Hyundai, CR2 Ridgeline Kia, CR3 Ridgeline Ford, CR4 Ridgeline Chevrolet |
| Tables | 8, listed in `02-data-sources-and-grains.md` |
| Files | `data/pack/*.csv` loaded into Postgres tables by `npm run db:load-pack`, plus `manifest.json` |

## Load it

- **Postgres (Neon)**: the tables carry the CSV names; every query in this kit runs inside a READ ONLY transaction through `lib/db/client.ts`.
- **SQLite**: the data pack download ships `ridgeline.sqlite`. Columns are untyped text; cast money with `CAST(x AS REAL)`.
- **Google Sheets / Excel**: import any CSV. `service_ros` and `inventory_snapshot` are the large ones.
- **BigQuery / Snowflake / Postgres**: load the CSVs with your usual loader. Dialect notes are in `05-question-patterns.md`.

## How to read this documentation, in order

1. `00-glossary.md` — the words a dealer uses, and the words never to show one.
2. `01-how-a-dealership-works.md` — departments, where the money comes from, who asks which questions.
3. `02-data-sources-and-grains.md` — what the DMS owns, what one row is, how tables link.
4. `03-tables/*.md` — one file per table: columns, facts, gotchas with measured numbers, refusals, example questions.
5. `04-metrics.md` — metric definitions, formulas, and the table each one comes from.
6. `05-question-patterns.md` — how to turn a manager's question into a query: time windows, scope, ambiguity rules.
7. `06-gotchas-and-refusals.md` — every trap planted in this pack, with the number that proves it.
8. `07-rights-and-scope.md` — who may ask what about which store, and how that lands in SQL.
9. `08-worked-examples.md` — question, SQL, rows, narration. Includes a refusal and a "did not report."

## The one rule

The model is never the source of a number. Numbers come from rows returned by SQL over these tables. Prose only narrates them. A store with no row did not report; it did not do zero. Every total states the dates it covers.

## Regenerate

The generator scripts live in the data pack download (ridgeline-data-pack.zip), not in this kit: `python3 generate.py && python3 build.py`, seed 2026, deterministic. In the kit, `npx tsx scripts/check-docs-sql.ts` runs every SQL block in these docs against the loaded database.
