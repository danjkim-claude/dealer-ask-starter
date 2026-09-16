# Data sources and grains

Every table comes from one module of the DMS. Knowing which module owns a number tells you how fresh it is, what it cannot contain, and which other table it reconciles to. **Grain** is the answer to "what is one row?" Get grain wrong and every metric downstream is wrong.

| Table | DMS module | One row is | Unique key | Store column | Time column | Freshness |
|---|---|---|---|---|---|---|
| `stores` | setup | one rooftop | `store_code` | `store_code` | — | static |
| `staff` | employee master | one employee assignment | `staff_id` | `store_code` | `active_from`, `active_to` | on change |
| `sales_deals` | desking / F&I (deal jacket) | one deal: retail, lease, wholesale, or unwound | `deal_number` | `store_code` | `deal_date` | nightly |
| `store_day` | sales daily scorecard | one rooftop × one calendar day, pre-aggregated from finalized retail and lease deals | `store_code, report_date` | `store_code` | `report_date` | nightly; a store that has not posted has no row |
| `service_ros` | service | one repair order | `ro_number` | `store_code` | `open_date`, `close_date` | nightly; open ROs have no close date |
| `service_day` | service daily summary | one rooftop × one close date, pre-aggregated from closed ROs | `store_code, report_date` | `store_code` | `report_date` | nightly |
| `inventory_snapshot` | vehicle inventory | one unit in stock × one weekly snapshot (Mondays) | `snapshot_date, stock_number` | `store_code` | `snapshot_date` | weekly |
| `gl_monthly` | accounting | one rooftop × one month × one department line | `store_code, month, department, line` | `store_code` | `month` | monthly close |

Row counts as built: sales_deals 10,244 · store_day 1,477 · service_ros 46,674 · service_day 1,480 · inventory_snapshot 79,958 · gl_monthly 572 · staff 87 · stores 4.

## How the tables link

```
sales_deals.stock_number  ──►  inventory_snapshot.stock_number   (the unit that sold; 477 fast-turn units never hit a Monday snapshot)
sales_deals  ──rollup──►  store_day                     (finalized retail + lease only; ties to the cent on every posted day)
service_ros  ──rollup──►  service_day                   (closed ROs by close_date; ties exactly)
sales_deals + service_ros  ──►  gl_monthly gross rows   (department gross by month)
staff.staff_id  ──►  sales_deals.salesperson_id, fi_manager_id; service_ros.advisor_id, technician_id
```

## Two grains you must never confuse

**Deal grain** (`sales_deals`, `service_ros`, `inventory_snapshot`): one row per thing. `COUNT(*)` counts things. Filters on type and status matter: a sale is `sale_type IN ('R','L') AND status = 'F'`; inventory is one snapshot at a time.

**Day grain** (`store_day`, `service_day`): one row per store per day, already summed. `SUM(unit_count)` counts units. `COUNT(*)` counts days, which is never what anyone asked. A missing day is a store that has not posted; a Sunday is a real row with zeros.

## Which table answers which question

| Question shape | Use | Not |
|---|---|---|
| Units, gross, PVR by store or day, MTD, pace | `store_day` | `sales_deals` (slower, and you must re-apply the sale filter) |
| Anything by salesperson, F&I manager, model, lender, product, trade, days to sell, year over year | `sales_deals` joined to `staff` | `store_day` (no such dimensions) |
| ELR, hours per RO, CP/warranty/internal mix, by advisor or tech, open ROs | `service_ros` | `service_day` only has store totals |
| RO count and labor by store and day | `service_day` | |
| Days supply, aged units, price drops, stock by model | `inventory_snapshot` (latest snapshot) + `sales_deals` for the sales rate | |
| Absorption, expense to gross, floor-plan interest | `gl_monthly` | |
| Leads, response time, close rate, cost per lead, marketing | nothing here; decline | |
