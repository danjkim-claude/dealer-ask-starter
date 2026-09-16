# How a franchise dealership makes money, and who asks what

A rooftop is four businesses under one roof. Each has its own manager, its own report, and its own definition of a good month. The DMS is the system that records all four.

## The four businesses

**New vehicle sales (variable ops).** The franchise. Units come from the factory, sit on the lot on a floor-plan loan, and are sold retail or lease. Front gross on new cars is thin; the factory pays incentives and holdback that this pack does not model. The new-car manager watches units, front gross per unit, days supply, and mix.

**Used vehicle sales (variable ops).** Trade-ins and auction buys, reconditioned in the shop (internal ROs), then retailed. Front gross is higher than new. Aging kills it: a unit past 60 days gets repriced or wholesaled. The used-car manager watches days in stock, price drops, and turn.

**F&I (finance and insurance).** After the car is sold, the F&I manager arranges financing and sells products: service contracts (VSC), GAP, maintenance plans. Back gross per unit is PVR. Penetration rates and lender mix are the levers. Chargebacks (product cancellations) claw gross back later; this pack does not model them.

**Fixed ops (service and parts).** Repair orders by pay type: customer pay, warranty, internal. Labor and parts gross recur whether or not a car sells. Effective labor rate, hours per RO, and technician hours are the levers. Absorption asks whether fixed-ops gross covers the store's expenses.

**Accounting** posts everything to the general ledger at month end: department gross and the expense lines.

## What the DMS does not hold

Leads, appointments, and BDC activity live in the CRM. Ad spend lives with the platforms and the agency. Customer identity is in both the DMS and the CRM, and is deliberately absent here. Questions about lead sources, response times, close rates, cost per lead, or marketing attribution cannot be answered from this pack; say so plainly rather than approximating from deals.

## The flow of a sale, and where it shows up in the DMS

1. A unit arrives and is stocked (`inventory_snapshot` from the next Monday).
2. A deal is written on that unit (`sales_deals`, linked by `stock_number`), by a salesperson (`staff`).
3. F&I adds products and financing (`fi_gross`, `gap_attached`, `vsc_attached`, `lender_type`, `term_months`).
4. The DMS closes the day; the daily scorecard rolls up (`store_day`).
5. If the unit is used, it was reconditioned first on an internal RO (`service_ros`, `ro_type = 'internal_recon'`).
6. At month end, gross by department and expenses post to the ledger (`gl_monthly`).

## Who asks what

| Person | The questions they live by | Tables they need |
|---|---|---|
| Dealer principal / owner | Am I making money by store? Does fixed ops cover my overhead? Which store is off? | `gl_monthly`, `store_day`, `service_day` |
| General manager | Units, gross, PVR, month to date vs last month, per salesperson, per day pace. | `store_day`, `sales_deals`, `staff` |
| New / used car manager | Days supply, aged units, price drops, front gross per unit by new/used, days to sell. | `inventory_snapshot`, `sales_deals` |
| F&I director | PVR, product penetration, financed share, lender mix, by F&I manager. | `sales_deals` |
| Service director | RO count, ELR by pay type, hours per RO, open ROs, advisor and tech performance. | `service_ros`, `service_day` |
| Controller | Expense to gross, floor-plan interest, absorption, month over month. | `gl_monthly` |

## Rhythms that shape questions

- Stores are closed Sunday. "Per selling day" divides by open days, not calendar days.
- Month end is the accounting boundary. "This month" means month to date as of the as-of date; "last month" means the full prior calendar month.
- The DMS posts nightly. A store that has not posted has no row for that day; it did not do zero.
- ROs open and close on different days; inventory is snapped weekly; the ledger is monthly.
