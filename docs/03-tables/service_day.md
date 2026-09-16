# service_day

**One row per rooftop per close date**, pre-aggregated from closed ROs. Unique on `store_code, report_date`. 1,480 rows. Ties exactly to `service_ros` grouped by `close_date`.

## Columns

`store_code`, `report_date`, `ro_count`, `labor_sales`, `parts_sales`, `labor_hours`, `cp_labor_sales`, `warranty_labor_sales`, `internal_labor_sales`.

## Facts

```sql
SELECT store_code,
       SUM(ro_count) AS ro_count, SUM(labor_sales) AS labor_sales, SUM(parts_sales) AS parts_sales,
       SUM(labor_sales) / NULLIF(SUM(labor_hours), 0) AS blended_elr,
       SUM(cp_labor_sales) / NULLIF(SUM(labor_sales), 0) AS cp_mix,
       MIN(report_date) AS available_start, MAX(report_date) AS available_end
FROM service_day
WHERE report_date >= DATE '2026-08-01' AND report_date <= DATE '2026-08-31'
GROUP BY 1 ORDER BY 1;
```

## Gotchas

- Pre-aggregated: SUM the columns, never `COUNT(*)`.
- No Sunday rows (shop closed). Days-based averages divide by rows present.
- Open ROs are not here until they close. Today's number will grow.
- Blended ELR only. Pay-type rates need `service_ros`.

## Questions this table answers

Store-level RO count, labor and parts sales, blended ELR, customer-pay mix, by day or month.
