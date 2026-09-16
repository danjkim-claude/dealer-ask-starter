# service_ros

**One row per repair order.** Unique on `ro_number`. 46,674 rows. 254 are still open (no `close_date`) as of the as-of date: CR1 59, CR2 43, CR3 78, CR4 74.

## Columns

| Column | Meaning |
|---|---|
| `ro_number`, `store_code` | key, rooftop |
| `open_date`, `close_date` | close is NULL while the RO is open; 20.1% of closed ROs closed on a later day than they opened |
| `advisor_id`, `technician_id` | join to `staff.staff_id` |
| `pay_type` | `C` customer pay, `W` warranty, `I` internal (recon on the store's own inventory) |
| `ro_type` | maintenance 20,835 · repair 13,532 · internal_recon 9,470 · recall 2,837 |
| `labor_hours` | billed hours |
| `labor_sales`, `parts_sales` | dollars; `parts_sales` is 0 on 12.2% of ROs |

## Facts

```sql
SELECT store_code, pay_type,
       COUNT(*) AS ro_count,
       SUM(labor_sales) AS labor_sales, SUM(parts_sales) AS parts_sales, SUM(labor_hours) AS labor_hours,
       SUM(labor_sales) / NULLIF(SUM(labor_hours), 0) AS effective_labor_rate,
       SUM(labor_hours) / NULLIF(COUNT(*), 0) AS hours_per_ro,
       MIN(close_date) AS available_start, MAX(close_date) AS available_end
FROM service_ros
WHERE close_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31'
GROUP BY 1, 2 ORDER BY 1, 2;
```

```sql
-- by advisor, customer pay only, with the roster so departed advisors are labelled
SELECT s.display_name, s.active_to IS NULL AS still_here,
       COUNT(*) AS ro_count, SUM(r.labor_hours) / COUNT(*) AS hours_per_ro,
       SUM(r.labor_sales) / NULLIF(SUM(r.labor_hours), 0) AS cp_labor_rate
FROM service_ros r JOIN staff s ON s.staff_id = r.advisor_id
WHERE r.store_code IN ('CR4') AND r.pay_type = 'C'
  AND r.close_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31'
GROUP BY 1, 2 ORDER BY ro_count DESC;
```

## Gotchas (measured)

- **Never blend pay types into one labor rate.** Customer pay collects $167.04 per hour, warranty $134.91, internal $95.00. The blended figure ($150.65) is not what the shop charges anyone. Report ELR by pay type, or say "blended".
- **Open ROs have no close date.** Filtering on `close_date` drops them; filtering on `open_date` counts work not yet billed. Say which you used. 254 open as of 2026-09-05.
- **Internal ROs are the store paying itself.** 9,470 recon tickets inflate RO count and hours with no outside revenue. Fixed-ops standing questions usually mean customer pay plus warranty.
- **Parts sales of zero are real** on 12.2% of ROs (labor-only tickets), not missing data.
- **Two advisors who left still own ROs.** Rankings must label or exclude them via `staff.active_to`.

## Refusals

- Technician proficiency (flagged over clocked hours): no clock data.
- Parts gross and margin: no parts cost in this feed.
- Customer retention or return visits: no customer identity.
- Appointments and shows: CRM or scheduler data, not DMS.

## Questions this table answers

- Effective labor rate by pay type and store, last month.
- Hours per RO by advisor at Ridgeline Chevrolet, last 30 days.
- Customer-pay mix of labor dollars by store, year to date.
- How many ROs are open right now by store?
- Warranty RO count by month, trailing six months.
- Recon tickets per used unit sold, by store.
