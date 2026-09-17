# 04 · A dashboard tile and the Users page (run while the real-data section is covered)

A new tile that can only ever show what the guard allows, a test that proves it, and the Users page exercised by hand.

## Paste this

```
Read app/dashboard/page.tsx, lib/dashboard/tiles.ts, lib/dashboard/q.ts, lib/dashboard/bindings.ts and docs/03-tables/inventory_gl_staff.md. Then, without asking me anything:

1. Add one tile to the dashboard: used-vehicle days supply for the signed-in person's stores, computed as used units on the latest inventory snapshot divided by used units sold per day over the last 30 days (the docs have the query as one join; split it into simple per-table queries, because the guard allows one catalog table and no joins). It must run through q() so the guard validates it with the person's scope, it must show the snapshot date it used, and it must appear only for people with the sales feature. Match the style of the existing tiles.
2. Add a test file lib/dashboard/tiles.test.ts on the in-process database (see lib/dashboard/q.test.ts for the pattern) proving that gm.kia's days supply query returns one store and that a scope with only the service feature never runs it.
3. Run npm run verify, then npm run build. Commit with the message "Dashboard: used days supply tile" and push to origin main.
4. Finish with a five-line summary: the days supply number for Ridgeline Kia, the snapshot date it used, and where in the code a tile would be refused if it asked for the wrong store.
```

## Then, in the browser, on the live site (you, not Claude)

1. Sign in as your own account. Open Users. Add `gm.hyundai@ridgeline.example`: tier user, sales and service, store CR1, home CR1, a password, and tick the demo authenticator box. Save.
2. Sign out. Sign in as gm.hyundai (code from `npm run users -- code gm.hyundai@ridgeline.example`). One store, the new tile, no Users link.
3. Back as yourself, open Users and read the last rights change aloud: who, whom, before, after.

## Check

- The new tile appears for gm.kia and for you, and not for service.east.
- `npm run verify` is green and the site redeployed (the tile is live).
- One `rights_change` row names you as the actor and gm.hyundai as the target.
