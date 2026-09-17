# 04 · Four report pages, and the Users page by hand (run while the rights walkthrough is covered)

Four report pages a general manager would open on a Monday: a sales scorecard, a service scorecard, an inventory page,
and a day-by-day trend. Every number on them goes through the same guard as the ask box, so a page can never show a
store the person may not see. Then you add a person on the Users page yourself, no Claude.

## Paste this

```
Read DESIGN.md, app/dashboard/page.tsx, lib/dashboard/tiles.ts, lib/dashboard/q.ts, lib/dashboard/bindings.ts, components/Nav.tsx, docs/04-metrics.md and the three files in docs/03-tables that cover store_day, service_ros and service_day, and inventory_snapshot. Then, without asking me anything:

1. Put the queries in lib/dashboard/reports.ts, one exported function per page, each taking the signed-in person's scope. Every query runs through q() with storeFilter(scope), one catalog table per query and no joins; combine results in code. Each function first checks can(scope, feature) and throws GuardRefused when the feature is missing, so a page without the feature never reaches SQL. Never use the machine clock; today() is the as-of date.
2. Build four pages, each a server component that starts with requireFeature, following DESIGN.md for layout, labels, and the covered-dates line:
   - /reports/sales (feature sales): month to date by store from store_day: units, new, used, total gross (cast the text column), gross per unit, PVR, selling days, and units per selling day. A store whose last report date is before today gets the amber "did not report after" flag.
   - /reports/service (feature service): last 30 days by store: ROs closed, customer-pay labor rate, warranty labor rate, hours per RO from service_ros; parts sales and customer-pay mix from service_day. Say which date basis you used.
   - /reports/inventory (feature sales): the latest snapshot by store, new and used separately: units, aged 60 days or more, average days in stock, inventory cost; plus used days supply, which is used units on that snapshot divided by used units sold per day over the 30 days ending on the snapshot date, from sales_deals with the sale definition. Show the snapshot date and the sales window in the lede.
   - /reports/trend (feature sales): units per day this month next to the same day last month, by store, as a table with a cumulative column for each month, from store_day. Sundays are zero rows; keep them so the days line up.
3. Add a "Reports" link for each page to components/Nav.tsx, shown only when can(scope, feature) is true for that page.
4. Add lib/dashboard/reports.test.ts on the in-process database (copy the setup from lib/dashboard/q.test.ts) proving: the Kia GM's sales scorecard returns exactly one store, CR2; a scope with only the service feature is refused by the sales scorecard function before any SQL runs; the controller's scorecard returns four stores.
5. Run npm run verify, then npm run build. Fix anything red. Do not run any git command: this laptop may not have git, and publishing is done by hand in GitHub Desktop. Instead, finish by telling me in one line to open GitHub Desktop, type the commit message "Reports: sales, service, inventory, trend", click Commit to main, then click Push origin. Say that the live site rebuilds about a minute after that push.
6. Finish with a five-line summary: Ridgeline Kia's units MTD and used days supply with the dates each one used, which page a service-only person can open, and the file and line where a page would be refused if it asked for the wrong store.
```

## Then, in the browser, on the live site (you, not Claude)

1. Sign in as your own account. Open Users. Add `gm.hyundai@ridgeline.example`: tier user, sales and service, store CR1,
   home CR1, a password, and tick the demo authenticator box. Save.
2. Sign out. Sign in as gm.hyundai (code from `npm run users -- code gm.hyundai@ridgeline.example`). One store, four
   Reports links, no Users link. Open the sales scorecard: Ridgeline Hyundai only.
3. Sign out. Sign in as service.east (code from `npm run users -- code service.east@ridgeline.example`). One Reports
   link, Service. Type `/reports/sales` into the address bar: you land on the denied page.
4. Back as yourself, open Users and read the last rights change aloud: who, whom, before, after.

## Check

- Four Reports links for you and for gm.kia; one for service.east; `/reports/sales` sends service.east to the denied page.
- The sales scorecard flags Ridgeline Kia as not reporting after 2026-09-02; the inventory page says the snapshot is 2026-08-31.
- `npm run verify` is green, you published in GitHub Desktop, and the site redeployed (the Reports links are live).
- One `rights_change` row names you as the actor and gm.hyundai as the target.
