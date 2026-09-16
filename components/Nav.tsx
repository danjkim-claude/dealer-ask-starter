import Link from "next/link";
import { auth, signOut } from "@/auth";
import { resolve } from "@/lib/rights/scope";
import { can } from "@/lib/auth/can";

/** The menu is derived from the same rights record that gates each page, so a link never implies access the page would refuse. */
export default async function Nav() {
  const session = await auth();
  const email = session?.user?.email ?? null;
  const scope = email ? await resolve(email) : null;
  return (
    <header className="top">
      <span className="brand">Dealer Ask</span>
      {scope?.ok && (
        <nav>
          <Link href="/dashboard">Dashboard</Link>
          {(can(scope, "sales") || can(scope, "service")) && <Link href="/ask">Ask</Link>}
          {scope.tier === "admin" && <Link href="/admin/users">Users</Link>}
          <Link href="/account">Account</Link>
        </nav>
      )}
      <span className="who">
        {email ? (
          <>
            <span>{email}{scope?.ok ? ` · ${scope.allStores ? "all stores" : scope.stores.join(", ")}` : ""}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}><button className="quiet" type="submit">Sign out</button></form>
          </>
        ) : <Link href="/login">Sign in</Link>}
      </span>
    </header>
  );
}
