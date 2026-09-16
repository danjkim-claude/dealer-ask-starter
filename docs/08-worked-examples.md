# Worked examples: question, scope, SQL, rows, narration

As-of date is 2026-09-05. Rights file is the one in `07-rights-and-scope.md`. Every narration below uses only numbers in the rows.

## 1. A GM asks about their store, month to date

**Asker** gm.kia (stores CR2, features sales, service). **Question** "How many units have we delivered this month, and what's PVR?"

```sql
SELECT store_code,
       SUM(unit_count) AS units, SUM(new_units) AS new_units, SUM(used_units) AS used_units,
       SUM(fi_gross) / NULLIF(SUM(unit_count), 0) AS pvr,
       MIN(report_date) AS available_start, MAX(report_date) AS available_end
FROM store_day
WHERE store_code IN ('CR2') AND report_date BETWEEN DATE '2026-09-01' AND DATE '2026-09-05'
GROUP BY store_code;
```

Rows: `CR2 | 8 | 4 | 4 | 1405.00 | 2026-09-01 | 2026-09-02`

**Narration.** Ridgeline Kia has delivered 8 units month to date, 4 new and 4 used, at a PVR of $1,405. That covers September 1 through September 2 only; the store has not posted since the 2nd, so the last three days are not in this figure.

## 2. The owner asks for the group, and one store is late

**Asker** owner (all stores). **Question** "Total gross by store for the last 7 days."

```sql
SELECT store_code, SUM(unit_count) AS units,
       SUM(REPLACE(total_gross, ',', '')::numeric) AS total_gross,
       MIN(report_date) AS available_start, MAX(report_date) AS available_end
FROM store_day
WHERE store_code IN ('CR1','CR2','CR3','CR4') AND report_date BETWEEN DATE '2026-08-30' AND DATE '2026-09-05'
GROUP BY store_code ORDER BY store_code;
```

Rows: CR1 45 units $147,479.28 (08-30 to 09-05) · CR2 15 units $54,448.80 (08-30 to **09-02**) · CR3 56 units $173,733.71 · CR4 52 units $178,142.60

**Narration.** From August 30 through September 5, Ridgeline Chevrolet led with $178,143 total gross on 52 units, Ridgeline Ford posted $173,734 on 56, and Ridgeline Hyundai $147,479 on 45. Ridgeline Kia shows $54,449 on 15 units, but only through September 2; it has not reported the last three days, so its figure is not comparable to the others yet.

**What a wrong answer looks like.** "The group did $553,804 for the week" with no mention of Kia's gap. The number is arithmetic on the rows, and it is still misleading.

## 3. The same GM asks for all stores

**Asker** gm.kia. **Question** "Total gross last 7 days across all stores."

The planner writes the query from example 2 with `store_code IN ('CR2')`, because "all stores" means all stores this user may see. If it writes the four-store filter instead, the guard rejects it: *Store CR1, CR3, CR4 is outside your access (CR2).* The answer is example 1's shape with one added sentence: "This covers Ridgeline Kia, the store on your access."

## 4. Units by salesperson, with the roster

**Asker** regional (store_admin over CR3 and CR4). **Question** "Who sold the most at Ford in August?"

```sql
SELECT s.display_name, s.active_to IS NULL AS still_here,
       COUNT(*) AS units, SUM(d.front_gross) AS front_gross,
       SUM(d.front_gross) / NULLIF(COUNT(*), 0) AS front_gross_per_unit
FROM sales_deals d JOIN staff s ON s.staff_id = d.salesperson_id
WHERE d.store_code IN ('CR3') AND d.sale_type IN ('R','L') AND d.status = 'F'
  AND d.deal_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31'
GROUP BY 1, 2 ORDER BY units DESC LIMIT 5;
```

Rows (top five): E. Nguyen 38 units, $83,799 front, $2,205 per unit · A. Nguyen 37, $76,764, $2,075 · B. Young 36, $79,363, $2,205 · D. Cole 31, $53,305, $1,720 · N. Fox 29, $62,665, $2,161

**Narration.** In August at Ridgeline Ford, E. Nguyen led with 38 units and $83,799 front gross, $2,205 per unit. A. Nguyen delivered 37 and B. Young 36, with B. Young matching the $2,205 per unit. D. Cole's 31 units came at $1,720 per unit, the lowest of the top five. Deals August 1 through 31. The join to the roster runs because a store admin may use joins; a restricted `user` tier asking the same question gets store-level units from the scorecard without names, unless the rights file is changed.

## 5. Service: labor rate the right way

**Asker** owner. **Question** "What's Chevrolet's labor rate for August?"

```sql
SELECT pay_type, COUNT(*) AS ro_count,
       SUM(labor_sales) / NULLIF(SUM(labor_hours), 0) AS effective_labor_rate,
       SUM(labor_hours) / NULLIF(COUNT(*), 0) AS hours_per_ro,
       MIN(close_date) AS available_start, MAX(close_date) AS available_end
FROM service_ros
WHERE store_code IN ('CR4') AND close_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31'
GROUP BY pay_type ORDER BY pay_type;
```

Rows: C 641 ROs $167.15/hr 1.72 hrs · I 126 $94.68 1.80 · W 240 $134.85 1.74

**Narration.** On repair orders closed in August, Ridgeline Chevrolet collected $167.15 per hour on customer pay across 641 ROs, $134.85 on warranty across 240, and $94.68 on internal work across 126. Hours per RO ran 1.72 customer pay, 1.74 warranty, 1.80 internal. The three rates are kept separate; a blended figure would not be a rate the shop charges anyone.

## 6. Inventory: one snapshot, and say which

**Asker** owner. **Question** "How much aged inventory do we have?"

```sql
WITH latest AS (SELECT MAX(snapshot_date) AS d FROM inventory_snapshot)
SELECT i.store_code, COUNT(*) AS units, COUNT(*) FILTER (WHERE days_in_stock >= 60) AS aged_60_plus,
       AVG(days_in_stock) AS avg_days_in_stock, MAX(i.snapshot_date) AS available_end
FROM inventory_snapshot i, latest WHERE i.snapshot_date = latest.d
GROUP BY i.store_code ORDER BY i.store_code;
```

Rows: CR1 362 units, 78 aged, 36.7 avg days · CR2 259, 55, 35.4 · CR3 559, 151, 40.4 · CR4 408, 67, 33.8

**Narration.** As of the August 31 inventory snapshot, Ridgeline Ford carries the most aged stock: 151 of 559 units are 60 days or older, and average days in stock is 40.4. Ridgeline Hyundai has 78 aged units of 362, Ridgeline Chevrolet 67 of 408, and Ridgeline Kia 55 of 259. The snapshot is five days before today; units sold since are not reflected.

## 7. A refusal, and a redirect out of the DMS

**Asker** owner. **Question** "What's our close rate on internet leads?"

No query. The planner returns an empty SQL with the reason: *Leads, response times, and close rates live in the CRM, not the DMS. This assistant is wired to DMS data only. I can show units by store, by salesperson, or by day.*

## 8. Days supply across two tables

**Asker** owner. **Question** "What's our used days supply?"

```sql
WITH latest AS (SELECT MAX(snapshot_date) AS d FROM inventory_snapshot),
stock AS (SELECT store_code, COUNT(*) AS units_in_stock FROM inventory_snapshot, latest
          WHERE snapshot_date = latest.d AND new_used = 'U' GROUP BY store_code),
rate AS (SELECT store_code, COUNT(*) / 30.0 AS used_per_day FROM sales_deals
         WHERE new_used = 'U' AND sale_type IN ('R','L') AND status = 'F'
           AND deal_date BETWEEN DATE '2026-08-02' AND DATE '2026-08-31' GROUP BY store_code)
SELECT s.store_code, s.units_in_stock, r.used_per_day, s.units_in_stock / r.used_per_day AS days_supply
FROM stock s JOIN rate r USING (store_code) ORDER BY 1;
```

Rows: CR1 134 used in stock, 2.87 per day, 46.7 days · CR2 110, 1.80, 61.1 · CR3 213, 3.20, 66.6 · CR4 162, 2.97, 54.6

**Narration.** Used days supply, taking stock on the August 31 snapshot over the used sales rate for August 2 through 31: Ridgeline Ford is at 66.6 days with 213 used units against 3.2 sold per day, Ridgeline Kia 61.1 days, Ridgeline Chevrolet 54.6, and Ridgeline Hyundai 46.7. Two dates are in play, the snapshot and the sales window, and both are stated because the answer depends on them.

## 9. The wrong query, for the room

"How many units did we sell in August?" written with `deal_type` instead of `sale_type`:

```sql
SELECT COUNT(*) FILTER (WHERE deal_type IN ('R','L')) AS wrong_units,
       COUNT(*) FILTER (WHERE sale_type IN ('R','L') AND status = 'F') AS units
FROM sales_deals WHERE deal_date BETWEEN DATE '2026-08-01' AND DATE '2026-08-31';
```

Rows: `960 | 865`. The wrong filter reports 95 extra units for the month, every one of them a wholesale or unwound deal. The daily scorecard (`store_day`) sums to 865 for the same window; when two numbers disagree, the one that ties to the scorecard is the one that applied the sale filter.
