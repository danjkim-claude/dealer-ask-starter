# From a manager's question to a query

## 1. Fix "today"

Today is **2026-09-05** (`manifest.json` → `as_of`). Never use the machine clock. Every relative window resolves from this date:

| Phrase | Window | Note |
|---|---|---|
| today | 2026-09-05 | may not have posted yet |
| yesterday | 2026-09-04 | |
| this week / last 7 days | 2026-08-30 to 2026-09-05 | includes a Sunday (zero row) |
| month to date, this month | 2026-09-01 to 2026-09-05 | five days; say so |
| last month | 2026-08-01 to 2026-08-31 | full month |
| same period last year | shift the window back one year; must be on or after 2025-09-01 | the range starts 2025-09-01 |
| last 30 / 60 / 90 days | as-of minus N + 1 through as-of | |
| year to date | 2026-01-01 to 2026-09-05 | |
| trailing 12 months | 2025-09-01 to 2026-08-31 | full months; say "the last 12 months," never TTM |

## 2. Pick the grain

Ask what one row of the answer should be. Store-by-day questions go to `store_day` or `service_day`. Anything by person, model, product, lender, pay type, advisor, or unit goes to the deal-grain tables. Never mix: a `COUNT(*)` on a day-grain table counts days.

## 3. Apply the sale definition

On `sales_deals`: `sale_type IN ('R','L') AND status = 'F'`. Every time. On `store_day` it is already applied.

## 4. Scope to the asker's stores

Every query filters `store_code IN (...)` to the stores the asker may see (`07-rights-and-scope.md`). "All stores" means all stores the asker may see.

## 5. Return coverage

Every date-filtered query returns `MIN(time_column) AS available_start, MAX(time_column) AS available_end`, per store when grouped by store. The narration states them. A total without its covered dates is not decision-safe.

## 6. Resolve ambiguity by the wording, then say what you chose

| The asker says | Read it as | Because |
|---|---|---|
| "sold", "delivered", "units" | retail + lease finalized | wholesale is not a sale |
| "gross" with no qualifier | total gross | unless a sales or F&I title makes it front or back |
| "labor rate" | by pay type, customer pay first | blended is only right if the asker says blended |
| "how many ROs" | closed in the window | unless "open" appears |
| "inventory", "on the ground" | latest snapshot | one snapshot only |
| "per day" | per selling day | Sundays are closed |
| "my team", "my salespeople" | staff with `active_to IS NULL` | departed staff still own old deals |
| "leads", "close rate", "cost per lead" | not answerable here | CRM and ad data are not in a DMS |

## 7. Narrate only the rows

Three to six sentences. Every number is in the rows or is direct arithmetic on them. Attach each number to its own row's store and period. State covered dates. A store with no row did not report. Use dealer words, not column names. No causes, forecasts, or benchmarks unless they are in the rows.

## Dialect notes

Examples are PostgreSQL, which is what Neon runs. Translate:

| DuckDB | SQLite | BigQuery | Snowflake |
|---|---|---|---|
| `DATE '2026-09-05'` | `'2026-09-05'` | `DATE '2026-09-05'` | `'2026-09-05'::DATE` |
| `REPLACE(x, ',', '')::numeric` | `CAST(REPLACE(x, ',', '') AS REAL)` | `CAST(REPLACE(x, ',', '') AS FLOAT64)` | `TRY_TO_NUMBER(REPLACE(x, ',', ''))` |
| `COUNT(*) FILTER (WHERE c)` | `SUM(CASE WHEN c THEN 1 ELSE 0 END)` | `COUNTIF(c)` | `COUNT_IF(c)` |
| `strftime(d, '%Y-%m')` | `strftime('%Y-%m', d)` | `FORMAT_DATE('%Y-%m', d)` | `TO_CHAR(d, 'YYYY-MM')` |
| `x::DATE` | `date(x)` | `DATE(x)` | `x::DATE` |
