# 06 · Take-home: your own data

Same catalog, same guard, same loop. Only the table changes. Two ways in.

## An export (a monthly DMS report as CSV)

```
Read CLAUDE.md, lib/db/schema.sql and lib/db/load-pack.ts. I have an export at ~/Downloads/EXPORT.csv. Without asking me anything:

1. List its columns and flag any that could identify a customer: names, phone, email, address, VIN, payment or amount-financed fields. Do not print any values from the flagged columns. Write a copy without those columns to data/own/staged.csv and confirm what you dropped.
2. Add a table for it to lib/db/schema.sql with sensible Postgres types, extend the loader to load data/own/staged.csv into it, run npm run db:init and the load, and show me the row count.
3. Write data/own/PROFILE.md from real read-only queries: row count, column types and null rates, min and max of every date column, distinct counts of low-cardinality columns, rows per store, and the unique key with proof.
4. Write catalog/own.yaml the way catalog/store_day.yaml was written: grain, binding, 5 to 8 facts with exact expressions, gotchas with measured numbers, at least one refusal, deny_columns naming the dropped columns so the guard blocks them if a future export brings them back, five example questions.
5. Add a binding for the new table to lib/dashboard/bindings.ts. Run npm run verify. Show me one npm run ask answer against the new catalog for a person who may see that store.
6. Commit and push.
```

## A live warehouse (Snowflake, BigQuery, Postgres) with a read-only role

```
Read CLAUDE.md and lib/db/client.ts. I have a read-only connection to DESCRIBE_IT (a Snowflake account with role RO_ROLE, or a Postgres URL in env OWN_DATABASE_URL). Without asking me anything:

1. Add a second runner in lib/db/client.ts for that source, chosen by an OWN_DATABASE_URL (or Snowflake) environment variable, that only ever runs inside a read-only transaction or session. Never embed a credential in a file; read it from the environment.
2. Prove the credential is read-only: attempt a CREATE TABLE through the new runner and show me the permission error.
3. Bind to the single view or table I name: VIEW_NAME. Write data/own/PROFILE.md from real queries with a LIMIT on anything that returns rows. Do not select any column that could identify a person; list them by name only.
4. Write catalog/own.yaml for it, deny-listing those columns. Add the binding to lib/dashboard/bindings.ts. Run npm run verify and show me one npm run ask answer.
5. Commit and push. Do not commit any environment file.
```

The production version of this is a Snowflake reporting mart read by a reader role, refreshed nightly, with the pages
never touching the raw DMS tables. Same shape as the pack, bigger.
