# Every trap in this pack, with the number that proves it

These are planted on purpose. Each mirrors something real dealers hit in DMS data. An assistant that gets these right is trustworthy; one that does not will report a confident wrong number.

| # | Table | Trap | Measured | Right move |
|---|---|---|---|---|
| 1 | sales_deals | Wholesale carries `deal_type = 'R'` | 1,058 of 10,244 rows; counting on `deal_type` over-states units 12.2% | Filter `sale_type IN ('R','L')` |
| 2 | sales_deals | Unwound deals with negative gross | 60 rows, `status = 'U'` | Add `AND status = 'F'` |
| 3 | sales_deals | Negative front gross on real retail deals | 425 of 9,126 (4.7%) | Include them; they are real |
| 4 | sales_deals | GAP divided by all units | 18.5% of sales are cash and carry no GAP | Divide by financed deals |
| 5 | sales_deals | Departed salespeople still own deals | 12 staff have left | Join `staff`, filter or label `active_to` |
| 6 | store_day | `total_gross` is text with commas | 100% of nonzero rows | `REPLACE(total_gross, ',', '')::numeric` |
| 7 | store_day | A store stopped posting | CR2 has no rows after 2026-09-02; 367 rows vs 370 | Report per-store coverage; "did not report", never zero |
| 8 | store_day | Sundays are zero rows | 208 rows | Divide by selling days |
| 9 | service_ros | Pay types blended into one rate | CP $167.04, warranty $134.91, internal $95.00, blended $150.65 | Rate by pay type |
| 10 | service_ros | Open ROs have no close date | 254 open: CR1 59, CR2 43, CR3 78, CR4 74 | Say which date basis you used |
| 11 | service_ros | Internal recon counted as shop revenue | 9,470 internal_recon ROs | Customer pay plus warranty for standing |
| 12 | service_ros | Multi-day ROs | 20.1% close on a later day than they open | Open-date and close-date counts differ |
| 13 | service_ros | Two advisors who left still own ROs | 2 | Label via `staff.active_to` |
| 14 | inventory_snapshot | Summing across snapshots | 53 snapshots of the same units | One snapshot per question |
| 15 | inventory_snapshot | Latest snapshot lags the as-of date | 2026-08-31 vs 2026-09-05 | State the snapshot date |
| 16 | inventory_snapshot | Fast turns never snapped | 477 sold units in no snapshot | Age from snapshots is slightly overstated |
| 17 | gl_monthly | Gross and expense share one amount column | 11 line types | Filter on `line` |
| 18 | gl_monthly | Partial month | September 2026 has 5 days | Never compare to a full month silently |
| 19 | gl_monthly | Wholesale department gross is negative | every month, every store | It is a department, not a sale |
| 20 | all | "Today" | as-of 2026-09-05, not the clock | Read `manifest.json` |
| 21 | all | Questions from another system | leads, close rate, cost per lead, appointments | Decline; name the CRM or ad platform |

## Things this pack cannot answer, and the honest sentence to say

- **Net profit, balance sheet ratios, cash, working capital.** "The ledger extract here carries department gross and five expense lines, not a full statement."
- **Holdback, incentives, true new-car gross.** "Front gross is what the DMS recorded."
- **Chargebacks, net F&I.** "No cancellation data."
- **Leads, response time, close rate, appointments, cost per lead, marketing attribution.** "That lives in the CRM and the ad platforms, not the DMS. This assistant is wired to DMS data only."
- **Duplicate customers, retention, return visits.** "No customer identity in this data, by design."
- **Technician proficiency, parts margin.** "No clocked hours; no parts cost."
- **Market pricing, days supply against market.** "No market data."
- **Anything before 2025-09-01.** "Out of range."
