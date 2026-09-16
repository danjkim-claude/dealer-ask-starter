# 02 · Rights and the guard (run while the Ask concept is covered)

The people in your rights table, then the guard that enforces what they may see, in SQL. The test file is red. Make it green.

## Paste this

```
Read lib/rights/types.ts, lib/rights/scope.ts, scripts/users.ts, lib/ask/guard.ts and lib/ask/guard.test.ts. Then, without asking me anything:

1. Add these people with npm run users -- add ... (demo authenticator secrets are fine for them; my own account stays as it is):
   - gm.kia@ridgeline.example: tier user, features sales,service, stores CR2, home CR2, password ridgeline-kia
   - regional@ridgeline.example: tier store_admin, features sales,service, stores CR3,CR4, home CR3, password ridgeline-regional
   - service.east@ridgeline.example: tier user, features service, stores CR1,CR2, home CR1, password ridgeline-east
   - controller@ridgeline.example: tier admin, features finance,sales, stores ALL, password ridgeline-controller
   - former@ridgeline.example: tier disabled, password ridgeline-former
   Run npm run users -- list and show it to me.
2. Implement validate() in lib/ask/guard.ts so every test in lib/ask/guard.test.ts passes. Follow the rules in the file header exactly: scrub first (strip comments, empty string literals in one left-to-right pass keeping the literal values, reject any quoted identifier containing a quote, a semicolon, OR, or AND), then one statement, SELECT or WITH only with no write verbs, only the catalog table after FROM or JOIN, no denied column anywhere, no SELECT * or FN(*) except COUNT, a store filter that is a subset of the person's stores with no OR at the top level of WHERE, simple queries only for restricted people, and a LIMIT capped at 5000 appended on the comment-stripped text. No SQL parser library. Plain regular expressions on the scrubbed text. Run npm test and fix until green.
3. Add three tests of your own to lib/ask/guard.test.ts, each named [REGRESSION GUARD] with a one-line comment on what it protects: a second store code hidden inside a quoted alias, a subquery from the GM that reaches another store, and a denied column reached through a function such as UPPER(). All three must be rejected. Run npm test again.
4. Run npm run verify. Commit with the message "Rights: five people and a green guard" and push to origin main.
5. Finish with a five-line summary: how many tests pass, the three holes your own tests close, and one rejection reason a general manager could read aloud.
```

## Check

- `npm test` is green, including the three tests you wrote.
- `npm run users -- list` shows six people. Your admin, the two GMs, the regional, the controller, and one disabled.
- Sign in on the live site as gm.kia (code from `npm run users -- code gm.kia@ridgeline.example`): one store, no Users link.
