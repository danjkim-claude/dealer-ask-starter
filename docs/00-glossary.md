# Dealer language

Rule: if a term is not said out loud on a sales desk, in a service drive, or in a 20-group meeting, it does not appear in an answer. Numbers never change in translation, only the framing.

## Words dealers use

| Term | Meaning, as a dealer says it | In this pack |
|---|---|---|
| **Unit** | One vehicle delivered to a retail or lease customer. | `sales_deals` rows with `sale_type IN ('R','L')`; `store_day.unit_count` |
| **Deal** | The transaction. Usually one unit; can carry two. | `sales_deals` row |
| **Front gross / front end** | What the store makes on the car itself, before F&I. | `front_gross` |
| **Back gross / back end / F&I gross** | What F&I adds after the car: service contract, GAP, reserve. | `fi_gross` |
| **Total gross** | Front plus back. | `store_day.total_gross` (text column, see gotchas) |
| **PVR (per vehicle retailed)** | Average F&I gross per unit. The F&I yardstick. | `SUM(fi_gross) / units` |
| **Gross per unit** | Total gross divided by units. | `(front + fi) / units` |
| **Product penetration / attach rate** | Share of deals carrying a product. | `gap_attached`, `vsc_attached` |
| **VSC** | Vehicle service contract, the extended warranty product. | `vsc_attached`, `vsc_gross` |
| **GAP** | Guaranteed asset protection, sold on financed deals only. | `gap_attached`, `gap_gross` |
| **Captive / outside / cash** | Who financed the deal: the brand's own lender, a bank or credit union, or nobody. | `lender_type` |
| **Doc fee** | Documentation fee charged on every retail deal. | `doc_fee` |
| **Wholesale / blow it out** | Sell a unit out the back door to another dealer or auction rather than keep aging it. Not a unit. | `sale_type = 'W'` |
| **Unwound deal** | A delivered deal that came back and was reversed. | `status = 'U'` |
| **Trade** | The customer's vehicle taken in on the deal. | `has_trade` |
| **Days in stock / aging / days supply** | How long inventory sits. Day-60 units are the reprice-or-wholesale list. | `inventory_snapshot.days_in_stock`, `days_in_stock_at_sale` |
| **Floor plan** | The loan that finances inventory. Interest is an expense line. | `gl_monthly` line `expense_floorplan_interest` |
| **RO (repair order)** | One service visit's ticket. | `service_ros` row |
| **CP / warranty / internal** | The three pay types on service work: customer pay, factory warranty, and the store's own recon. Never blend their rates. | `pay_type` C, W, I |
| **Effective labor rate (ELR)** | What the shop actually collects per labor hour. | `labor_sales / labor_hours` |
| **Hours per RO** | Labor hours sold per ticket. | `labor_hours / ro_count` |
| **Advisor / tech** | The service advisor who writes the ticket; the technician who turns the hours. | `advisor_id`, `technician_id` |
| **Recon** | Reconditioning a used unit before retail; billed as an internal RO. | `ro_type = 'internal_recon'` |
| **Fixed ops / the back of the house** | Service and parts, the recurring-gross side. | `service_*`, `gl_monthly` service and parts rows |
| **Absorption** | How much of the store's expenses fixed-ops gross covers before a car is sold. | `04-metrics.md` |
| **Month end / close** | When accounting locks the month. | `gl_monthly.month` |
| **Rooftop / store** | One dealership location. | `store_code` |

## Words never to show a dealer

| Never | Say instead |
|---|---|
| TTM | "the last 12 months" |
| null, NULL | "did not report", "no figure recorded" |
| dedup, normalized, cast, coalesce | (drop it; it is our plumbing) |
| VARCHAR, DOUBLE | (drop it) |
| table or column names (`store_day`, `fi_gross`) | "the daily scorecard", "F&I gross" |
| stddev, variance, right-censored | "how much it bounces month to month" |
| "improved" for a negative moving toward zero | "less negative" |
| Any number not in the returned rows | (do not write it) |
