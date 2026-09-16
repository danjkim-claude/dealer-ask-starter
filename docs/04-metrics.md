# Metric definitions

Each metric names its formula, its table, its unit, and what it does not prove. When two definitions can answer the same words ("how many did we sell"), say which one you used.

| Metric | Formula | Table | Unit | Boundary |
|---|---|---|---|---|
| Units | count of deals with `sale_type IN ('R','L') AND status='F'`; or `SUM(unit_count)` | sales_deals / store_day | units | Excludes wholesale and unwound. |
| New / used units | same, split on `new_used` | both | units | |
| Front gross | `SUM(front_gross)` over sales | both | $ | Not net of holdback or incentives. |
| F&I gross (back gross) | `SUM(fi_gross)` | both | $ | Before chargebacks. |
| Total gross | front + F&I | both | $ | `store_day.total_gross` is text; cast it. |
| PVR | F&I gross / units | both | $/unit | Per retail and lease unit, not per financed unit. |
| Gross per unit | total gross / units | both | $/unit | |
| Selling days | days with `unit_count > 0` | store_day | days | Sundays are zero rows. |
| Units per selling day (pace) | units / selling days | store_day | units/day | MTD pace × remaining selling days is a projection; label it. |
| GAP penetration | `SUM(gap_attached) / SUM(financed)` | sales_deals | % | Of financed deals only. |
| VSC penetration | `SUM(vsc_attached) / units` | sales_deals | % | |
| Financed share | `SUM(financed) / units` | sales_deals | % | |
| Captive share | deals with `lender_type='captive'` / financed deals | sales_deals | % | |
| Trade-in rate | `SUM(has_trade) / units` | sales_deals | % | |
| Days in stock at sale | `AVG(days_in_stock_at_sale)` | sales_deals | days | |
| Units per salesperson | units grouped by `salesperson_id` joined to staff | sales_deals + staff | units | Say whether departed staff are included. |
| RO count | `COUNT(*)` closed in period; or `SUM(ro_count)` | service_ros / service_day | ROs | Say open-date or close-date basis. |
| Effective labor rate | `SUM(labor_sales) / SUM(labor_hours)` | service_ros | $/hour | By pay type, or say blended. |
| Hours per RO | `SUM(labor_hours) / COUNT(*)` | service_ros | hours | |
| Customer-pay mix | CP labor / total labor | service_ros / service_day | % | |
| Open ROs | `COUNT(*) WHERE close_date IS NULL` | service_ros | ROs | As of the as-of date. |
| Recon ROs per used unit | internal_recon ROs / used units sold, same window | service_ros + sales_deals | ratio | |
| Units in stock, aged 60+ | count on the latest snapshot | inventory_snapshot | units | One snapshot only. |
| Days supply | units in stock / (units sold last 30 days / 30) | inventory_snapshot + sales_deals | days | Two tables, two dates; state both. |
| Fixed absorption | (service + parts gross) / total expenses | gl_monthly | % | Monthly, closed months only. |
| Expense to gross | total expenses / total gross | gl_monthly | % | |
| Floor-plan interest per unit | floorplan interest / units, same month | gl_monthly + store_day | $/unit | |

## Three definitions that collide

1. **"How many did we sell?"** Units (retail + lease, finalized). Not deals on `deal_type`, not deals including wholesale.
2. **"What's our gross?"** Total gross unless the asker is a sales manager (front) or an F&I manager (back). Name it.
3. **"What's our labor rate?"** By pay type. Customer pay is the one a service director means; blended only if they say blended.

## Not computable from a DMS extract

Lead volume, response time, appointment set and show rates, close rate, cost per lead, cost per sale, marketing attribution. These are CRM and ad-platform questions. Decline them in one sentence and name the system that holds them.
