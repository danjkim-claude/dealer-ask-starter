import { requireAdmin } from "@/lib/auth/require";
import { listUsers, readAudit } from "@/lib/rights/store";
import { saveUser } from "./actions";

/** User rights management: a form over the rights record. One audit line per save. Nothing here touches the warehouse. */
export default async function UsersPage() {
  await requireAdmin();
  const users = await listUsers();
  const audit = await readAudit(10, "rights_change");
  return (
    <>
      <h1>Users</h1>
      <p className="lede">Five fields per person: tier, features, stores, all stores, home store. A feature grant is not a store grant; a GM needs both.</p>
      <table>
        <thead><tr><th>Email</th><th>Tier</th><th>Features</th><th>Stores</th><th>Home</th><th>2FA</th></tr></thead>
        <tbody>{users.map((u) => (
          <tr key={u.email}><td>{u.email}</td><td><span className={`pill${u.tier === "disabled" ? " warn" : ""}`}>{u.tier}</span></td><td>{u.features.join(", ") || "—"}</td><td>{u.allStores ? "all stores" : u.stores.join(", ") || "—"}</td><td>{u.homeStore ?? "—"}</td><td>{u.totpSecret ? "enrolled" : "not yet"}</td></tr>
        ))}</tbody>
      </table>
      <h2>Add or change a person</h2>
      <form className="card stack" action={saveUser} style={{ maxWidth: "36rem" }}>
        <label>Email<input id="u_email" name="email" type="email" required /></label>
        <div className="row">
          <label>Tier<select id="u_tier" name="tier" defaultValue="user"><option>user</option><option>store_admin</option><option>admin</option><option>disabled</option></select></label>
          <label>Home store<input id="u_home" name="home_store" placeholder="CR2" /></label>
        </div>
        <label>Stores, comma separated<input id="u_stores" name="stores" placeholder="CR1, CR2" /></label>
        <div className="checks">
          <label><input id="u_all" name="all_stores" type="checkbox" /> all stores</label>
          <label><input id="u_sales" name="f_sales" type="checkbox" defaultChecked /> sales</label>
          <label><input id="u_service" name="f_service" type="checkbox" /> service</label>
          <label><input id="u_finance" name="f_finance" type="checkbox" /> finance</label>
        </div>
        <div className="row">
          <label>Set a password<input id="u_password" name="password" type="text" placeholder="leave blank to keep" /></label>
          <label className="checks"><input id="u_demo" name="demo_2fa" type="checkbox" /> demo user: pre-set authenticator (npm run users -- code)</label>
        </div>
        <button type="submit">Save</button>
      </form>
      <h2>Last rights changes</h2>
      <table>
        <thead><tr><th>When</th><th>Who</th><th>Whom</th><th>Before</th><th>After</th></tr></thead>
        <tbody>{audit.map((a) => { const e = a.entry as { target: string; before: Record<string, unknown> | null; after: Record<string, unknown> }; return (
          <tr key={a.id}><td>{new Date(a.ts as unknown as string).toISOString().slice(0, 16).replace("T", " ")}</td><td>{a.actor}</td><td>{e.target}</td><td>{e.before ? <code>{JSON.stringify(e.before)}</code> : <span className="pill">new person</span>}</td><td><code>{JSON.stringify(e.after)}</code></td></tr>
        ); })}</tbody>
      </table>
    </>
  );
}
