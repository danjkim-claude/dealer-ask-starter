# 05 · Take-home: Google or Microsoft sign-in, restricted to your company domain

In the room, sign-in was email, password, and an authenticator code. At home, most groups want people to use the account
they already have. This prompt adds Google Workspace or Microsoft Entra sign-in next to the existing one, and blocks every
email domain except yours. The rights table does not change: a valid login with no row still lands on "signed in, not authorized".

Before you run it, create the app: Google Cloud console → OAuth client (web application), or Microsoft Entra admin center
→ App registration (single tenant). Redirect URI: `https://<your-app>.vercel.app/api/auth/callback/google` or
`.../api/auth/callback/microsoft-entra-id`. Put the client id, secret (and tenant id for Microsoft) into Vercel's
environment variables and into `.env.local`.

## Paste this

```
Read auth.ts, lib/auth/require.ts, app/login/page.tsx and lib/rights/scope.ts. Then, without asking me anything:

1. Add PROVIDER sign-in to auth.ts with Auth.js (Google, or Microsoft Entra ID; use the env var names GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET or AUTH_MICROSOFT_ENTRA_ID_ID/AUTH_MICROSOFT_ENTRA_ID_SECRET/AUTH_MICROSOFT_ENTRA_ID_TENANT_ID). Keep the existing password plus authenticator sign-in working.
2. Add an ALLOWED_EMAIL_DOMAINS environment variable (comma separated). In the signIn callback, refuse any provider login whose email domain is not on the list, and write one audit row for the refusal. Never let a provider login through when the list is empty.
3. Show a "Sign in with PROVIDER" button on the login page only when the provider's variables are set.
4. Add tests for the domain check in lib/auth/domains.test.ts: an allowed domain passes, a lookalike domain fails, an empty list fails closed.
5. Run npm run verify and npm run build. Do not run any git command: this laptop may not have git, and publishing is done by hand in GitHub Desktop. Instead, finish by telling me in one line to open GitHub Desktop, type the commit message "Sign-in: PROVIDER with allowed domains", click Commit to main, then click Push origin. Say that the live site rebuilds about a minute after that push.
6. Finish with a five-line summary: what a person from another company sees when they try, and what an approved person with no rights row sees.
```

Replace PROVIDER with Google or Microsoft before you paste.

## Check

- You can sign in with your work account and land on your dashboard.
- A personal Gmail or Outlook address is refused before it reaches the rights table.
- A colleague on your domain who is not in Users sees "signed in, not authorized".
