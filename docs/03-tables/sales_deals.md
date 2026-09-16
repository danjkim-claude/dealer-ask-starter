# sales_deals

**One row per deal** written in the DMS: retail, lease, wholesale, or an unwound deal. Unique on `deal_number`. 10,244 rows, 2025-09-01 to 2026-09-05.

## Columns

| Column | Meaning |
|---|---|
| `deal_number` | DMS deal id, unique group-wide |
| `store_code` | rooftop |
| `deal_date` | delivery date |
| `deal_type` | `R` retail, `L` lease. Wholesale deals ALSO carry `R` here. |
| `sale_type` | `R` retail, `L` lease, `W` wholesale. The real sale filter. |
| `status` | `F` finalized, `U` unwound (came back). |
| `new_used` | `N` / `U` |
| `stock_number` | the unit; joins to `inventory_snapshot` |
| `model_year`, `make`, `model` | the vehicle |
| `front_gross` | gross on the vehicle. Can be negative. Wholesale rows are usually negative. |
| `fi_gross` | F&I gross including product gross. Zero on wholesale. |
| `doc_fee` | documentation fee |
| `gap_attached`, `gap_gross`, `vsc_attached`, `vsc_gross` | F&I products |
| `lender_type` | `captive`, `outside`, `cash`, `none` (wholesale) |
| `term_months`, `financed` | financing |
| `has_trade` | a trade was taken |
| `days_in_stock_at_sale` | deal_date minus the unit's arrival |
| `salesperson_id`, `fi_manager_id` | join to `staff.staff_id` |

## The sale filter

A **sale** is `sale_type IN ('R','L') AND status = 'F'`. That is 9,126 of 10,244 rows.

- `deal_type` alone matches all 10,244 rows, because wholesale carries `R`. Counting on `deal_type` over-states units by 12.2 percent (1,058 wholesale plus 60 unwound rows) and drags their negative front gross into the total.
- Unwound deals (`status = 'U'`, 60 rows) carry negative gross and must be excluded from unit counts.

## Facts

```sql
-- units, front gross, F&I gross, PVR, gross per unit (the sale filter is mandatory)
SELECT store_code,
       COUNT(*)                                   AS units,
       SUM(front_gross)                           AS front_gross,
       SUM(fi_gross)                              AS fi_gross,
       SUM(fi_gross) / NULLIF(COUNT(*), 0)        AS pvr,
       (SUM(front_gross) + SUM(fi_gross)) / NULLIF(COUNT(*), 0) AS gross_per_unit,
       SUM(gap_attached) * 1.0 / NULLIF(SUM(financed), 0)      AS gap_penetration_of_financed,
       SUM(vsc_attached) * 1.0 / NULLIF(COUNT(*), 0)           AS vsc_penetration,
       MIN(deal_date) AS available_start, MAX(deal_date) AS available_end
FROM sales_deals
WHERE sale_type IN ('R','L') AND status = 'F'
  AND deal_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31'
GROUP BY store_code ORDER BY store_code;
```

```sql
-- by salesperson: join staff, and only count people active in the window
SELECT s.display_name, COUNT(*) AS units, SUM(d.front_gross) AS front_gross,
       SUM(d.front_gross) / NULLIF(COUNT(*), 0) AS front_gross_per_unit
FROM sales_deals d JOIN staff s ON s.staff_id = d.salesperson_id
WHERE d.store_code IN ('CR3') AND d.sale_type IN ('R','L') AND d.status = 'F'
  AND d.deal_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31'
GROUP BY s.display_name ORDER BY units DESC;
```

## Gotchas (measured)

- **Wholesale hides under deal_type R.** 1,058 rows. Filter on `sale_type`, never `deal_type`.
- **Negative front gross is real on retail.** 425 finalized retail/lease deals (4.7%) have negative front gross: aged units, packs, and pricing to move. Averages include them.
- **GAP penetration is of financed deals**, not all deals. 18.5% of sales are cash and carry no GAP (0 of them do). Dividing by all units understates penetration.
- **Salesperson credit needs the roster.** 12 staff have left; their deals stay. A ranking for "my current team" must filter `staff.active_to IS NULL`.
- **Model-year mix shifts across the range.** Comparing a model's units year over year across the 2025/2026 changeover mixes model years.

## Refusals

- **Holdback, factory incentives, pack**: not in this feed. Front gross here is what the DMS recorded; do not reconstruct "true" gross.
- **Chargebacks**: no cancellation data. Net F&I gross after chargebacks cannot be computed.
- **Lead source, close rate, marketing attribution**: CRM data, not DMS. Not here.
- **Customer anything**: there are no customer columns by design.

## Questions this table answers

- How many units did each store deliver in August, new versus used?
- What is PVR by F&I manager this month?
- GAP penetration on financed deals by store, last 90 days.
- Which salesperson at Ridgeline Ford has the most units year to date?
- Average days in stock at sale for used units, by store, last quarter.
- Trade-in rate by store last month.
