# Who may ask what, and how it lands in SQL

Rights are five separate things. A feature grant is not a store grant. A GM needs both.

| Concept | Values | Controls |
|---|---|---|
| `tier` | super_admin, admin, store_admin, user, disabled | system power; `user` is restricted (below) |
| `features` | sales, service, finance | which tables may be queried at all |
| `stores` | list of store codes | which rooftops a store-scoped question may touch |
| `all_stores` | true / false | group access that bypasses per-store filtering |
| `home_store` | one code | default when a question names no store |

## Feature to table

| Feature | Tables |
|---|---|
| sales | sales_deals, store_day, inventory_snapshot, staff (sales and F&I roles) |
| service | service_ros, service_day, staff (service roles) |
| finance | gl_monthly |

`stores` is readable by everyone with any feature.

## How scope lands in SQL

1. Resolve the asker to `{tier, features, stores, all_stores, home_store}` before planning anything.
2. If the table's feature is not in `features`: decline in one plain sentence. Do not answer from another table.
3. If `all_stores` is false: the WHERE clause must contain `store_code IN (...)` with values that are a subset of `stores`. "All stores" means those stores. A query without the filter, or with a store outside the set, is rejected before it runs.
4. If `tier = user` (restricted): the query must be one simple SELECT. No CTEs, subqueries, UNION, JOIN, or OR anywhere, so the store filter cannot be smuggled around. Store admins and above may use CTEs and joins, but still may not use OR at the top level of the WHERE clause.
5. Deny-listed columns are rejected wherever they appear, including inside functions. This pack has no PII columns; a real DMS export will (customer name, phone, address, VIN, payment).
6. Every query gets a LIMIT (5,000). Every run is logged: who asked, the SQL, rows returned, outcome.

## Example rights file for this pack

```yaml
users:
  owner@ridgeline.example:       {tier: admin, all_stores: true, features: [sales, service, finance]}
  gm.kia@ridgeline.example:      {tier: user, stores: [CR2], home_store: CR2, features: [sales, service]}
  service.east@ridgeline.example: {tier: user, stores: [CR1, CR2], home_store: CR1, features: [service]}
  regional@ridgeline.example:    {tier: store_admin, stores: [CR3, CR4], home_store: CR3, features: [sales, service]}
  controller@ridgeline.example:  {tier: admin, all_stores: true, features: [finance, sales]}
  former@ridgeline.example:      {tier: disabled}
```

What each can and cannot do:
- `gm.kia` asks "units across all stores": answered for CR2 only, with one sentence saying so, no lecture.
- `service.east` asks "total gross last month": declined, no sales feature. Asks "ELR by pay type": answered for CR1 and CR2.
- `regional` asks a CTE comparing CR3 and CR4: allowed. Adds `OR store_code = 'CR1'`: rejected.
- `controller` asks "open ROs by store": declined, no service feature, even with all-stores access.
- `former` asks anything: "Your access is disabled."
