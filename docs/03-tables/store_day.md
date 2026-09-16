# store_day

**One row per rooftop per calendar day**, pre-aggregated from finalized retail and lease deals. Unique on `store_code, report_date`. 1,477 rows. This is the GM scorecard and the fastest way to answer units, gross, PVR, MTD, and pace.

## Columns

| Column | Meaning |
|---|---|
| `store_code`, `report_date` | key |
| `unit_count`, `deal_count` | that day's units and deals (equal in this pack) |
| `new_units`, `used_units` | split |
| `front_gross`, `fi_gross` | numeric |
| `total_gross` | **TEXT with thousands separators**, e.g. `28,571.41`. Cast it. |
| `doc_fee` | numeric |

## Facts

```sql
SELECT store_code,
       SUM(unit_count) AS units, SUM(new_units) AS new_units, SUM(used_units) AS used_units,
       SUM(front_gross) AS front_gross, SUM(fi_gross) AS fi_gross,
       SUM(REPLACE(total_gross, ',', '')::numeric) AS total_gross,
       SUM(fi_gross) / NULLIF(SUM(unit_count), 0) AS pvr,
       COUNT(*) FILTER (WHERE unit_count > 0) AS selling_days,
       MIN(report_date) AS available_start, MAX(report_date) AS available_end
FROM store_day
WHERE report_date BETWEEN DATE '2026-09-01' AND DATE '2026-09-05'
GROUP BY store_code ORDER BY store_code;
```

## Gotchas (measured)

- **`total_gross` is text.** Every nonzero value carries a comma. `SUM(total_gross)` errors in Postgres and silently truncates in engines that coerce. Always `REPLACE(total_gross, ',', '')::numeric`, or sum `front_gross + fi_gross`.
- **A missing day is not zero.** CR2 has no rows after 2026-09-02 (367 rows vs 370 for the other stores). A "last 7 days across all stores" total must report CR2's covered dates separately and say it did not report after the 2nd.
- **Sundays are real zero rows.** 208 of them. Units per calendar day understates pace; divide by selling days (`unit_count > 0`) or exclude Sundays.
- **Never `COUNT(*)`.** It counts days. Sum the columns.
- **Ties to `sales_deals` to the cent** on every posted day when the sale filter is applied there. If a number here disagrees with a deal-level query, the deal-level query is missing the filter.

## Refusals

- Anything by salesperson, model, lender, or product: not in this table. Use `sales_deals`.
- Year-over-year for any day before 2025-09-01: out of range.

## Questions this table answers

- Units and total gross by store, month to date.
- PVR by store for the last 30 days.
- New versus used mix this month against last month.
- Units per selling day pace, by store.
- Which store had the best gross per unit in August?
