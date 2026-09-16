# inventory_snapshot, gl_monthly, staff, stores

## inventory_snapshot

**One row per unit in stock per weekly snapshot** (Mondays, 53 snapshots from 2025-09-01 to 2026-08-31). Unique on `snapshot_date, stock_number`. 79,958 rows.

```sql
-- current inventory position = the latest snapshot only
WITH latest AS (SELECT MAX(snapshot_date) AS d FROM inventory_snapshot)
SELECT i.store_code, i.new_used,
       COUNT(*) AS units,
       COUNT(*) FILTER (WHERE days_in_stock >= 60) AS aged_60_plus,
       SUM(cost) AS inventory_cost,
       AVG(days_in_stock) AS avg_days_in_stock,
       MAX(snapshot_date) AS available_start, MAX(snapshot_date) AS available_end
FROM inventory_snapshot i, latest
WHERE i.snapshot_date = latest.d
GROUP BY 1, 2 ORDER BY 1, 2;
```

```sql
-- used days supply: stock on the latest snapshot over the last-30-day used sales rate
WITH latest AS (SELECT MAX(snapshot_date) AS d FROM inventory_snapshot),
stock AS (SELECT store_code, COUNT(*) AS units_in_stock FROM inventory_snapshot, latest
          WHERE snapshot_date = latest.d AND new_used = 'U' GROUP BY store_code),
rate AS (SELECT store_code, COUNT(*) / 30.0 AS used_per_day FROM sales_deals
         WHERE new_used = 'U' AND sale_type IN ('R','L') AND status = 'F'
           AND deal_date BETWEEN DATE '2026-08-02' AND DATE '2026-08-31' GROUP BY store_code)
SELECT s.store_code, s.units_in_stock, r.used_per_day, s.units_in_stock / r.used_per_day AS days_supply
FROM stock s JOIN rate r USING (store_code) ORDER BY 1;
```

Gotchas:
- **Always filter to one snapshot.** Summing across snapshots counts the same unit up to 53 times.
- **The latest snapshot is 2026-08-31, five days before the as-of date.** Say so.
- **Fast turns never appear.** 477 units arrived and sold between Mondays and are in `sales_deals` but in no snapshot. Days-supply math from snapshots slightly overstates age.
- `price_drops` is a running count on the unit, not a per-week event.
- Aged units (60+) on the last snapshot: CR1 78 of 362, CR2 55 of 259, CR3 151 of 559, CR4 67 of 408. Ridgeline Ford is the aging story in this pack.

Refusals: market price comparison (no market data); true days supply needs a sales rate, which comes from `sales_deals` as shown.

## gl_monthly

**One row per rooftop per month per department line.** 572 rows. Departments: new_vehicle, used_vehicle, wholesale, fi, service, parts, and `total` for expense lines. Lines: `gross` for departments; `expense_personnel`, `expense_advertising_net`, `expense_rent`, `expense_floorplan_interest`, `expense_other` for `total`.

```sql
SELECT store_code, month,
       SUM(amount) FILTER (WHERE line = 'gross') AS total_gross,
       SUM(amount) FILTER (WHERE department IN ('service','parts') AND line = 'gross') AS fixed_ops_gross,
       SUM(amount) FILTER (WHERE line LIKE 'expense_%') AS total_expense,
       SUM(amount) FILTER (WHERE department IN ('service','parts') AND line = 'gross')
         / NULLIF(SUM(amount) FILTER (WHERE line LIKE 'expense_%'), 0) AS fixed_absorption
FROM gl_monthly WHERE month = '2026-08' GROUP BY 1, 2 ORDER BY 1;
```

Gotchas:
- **Gross rows and expense rows share one `amount` column.** Always filter on `line`.
- **Wholesale gross is usually negative.** It is a department, not a sale.
- **Department gross here derives from `sales_deals` and `service_ros`** for the same month; the ledger is the source of truth once the month closes. Mid-month, `store_day` is fresher.
- **Advertising is one net expense line.** There is no channel detail in a DMS; cost per lead is a marketing-system question.
- September 2026 is a partial month (5 days). Do not compare it to a full month without saying so.
- Fixed absorption in this group runs 31 to 35 percent in August, low against what a real store targets. It is a mock; treat it as a number to report, not a benchmark.

Refusals: net profit and balance-sheet ratios (no statement lines beyond these); parts sales (only parts gross).

## staff and stores

`staff`: one row per employee assignment, 87 rows. `active_to` is NULL for current staff; 12 have left. Roles: salesperson, service_advisor, technician, fi_manager. Deals and ROs keep their original person after that person leaves; rankings should say who is still here.

`stores`: `store_code`, `store_name`, `brand`, `city`, `state`. Use names in answers, never codes.
