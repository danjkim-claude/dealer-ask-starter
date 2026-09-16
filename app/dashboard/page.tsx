import { requireScope } from "@/lib/auth/require";
import { can } from "@/lib/auth/can";
import { salesMtd, serviceLast30 } from "@/lib/dashboard/tiles";
import { today } from "@/lib/dashboard/q";
import Bars from "@/components/Bars";

const money = (v: number) => "$" + Math.round(v).toLocaleString("en-US");

/** Every tile below is a query that went through the same guard as the ask box, with this person's scope. */
export default async function Dashboard() {
  const scope = await requireScope();
  const t = today();
  const sales = can(scope, "sales") ? await salesMtd(scope) : null;
  const service = can(scope, "service") ? await serviceLast30(scope) : null;
  const units = sales?.reduce((s, r) => s + r.units, 0) ?? 0;
  const gross = sales?.reduce((s, r) => s + r.total_gross, 0) ?? 0;
  const late = sales?.filter((r) => r.late) ?? [];
  return (
    <>
      <h1>{scope.allStores ? "Ridgeline Auto Group" : sales?.map((r) => r.name).join(", ") || scope.stores.join(", ")}</h1>
      <p className="lede">Month to date through {t}. {scope.allStores ? "All stores." : `Your store${scope.stores.length > 1 ? "s" : ""}: ${scope.stores.join(", ")}.`}</p>
      {late.map((r) => <div className="flag" key={r.store_code}><b>{r.name}</b> did not report after {r.available_end}. Its numbers below stop there; they are not zero.</div>)}
      {sales && (
        <>
          <h2>Sales</h2>
          <div className="tiles">
            <div className="tile"><div className="label">Units MTD</div><div className="big">{units.toLocaleString("en-US")}</div><div className="sub">retail and lease, funded</div></div>
            <div className="tile"><div className="label">Total gross MTD</div><div className="big">{money(gross)}</div><div className="sub">front plus F&amp;I</div></div>
            <div className="tile"><div className="label">Gross per unit</div><div className="big">{units ? money(gross / units) : "—"}</div><div className="sub">total gross ÷ units</div></div>
            {can(scope, "finance") && <div className="tile"><div className="label">F&amp;I per unit</div><div className="big">{units ? money(sales.reduce((s, r) => s + r.fi_gross, 0) / units) : "—"}</div><div className="sub">finance feature</div></div>}
          </div>
          {sales.length > 1 && <div className="card"><div className="label">Units MTD by store</div><Bars items={sales.map((r) => ({ label: r.name, value: r.units, flag: r.late ? `through ${r.available_end}` : undefined }))} /></div>}
        </>
      )}
      {service && (
        <>
          <h2>Service, last 30 days</h2>
          <div className="tiles">
            <div className="tile"><div className="label">ROs closed</div><div className="big">{service.reduce((s, r) => s + r.ros, 0).toLocaleString("en-US")}</div><div className="sub">all pay types</div></div>
            <div className="tile"><div className="label">Customer-pay labor rate</div><div className="big">{service.length ? money(service.reduce((s, r) => s + r.cp_rate, 0) / service.length) : "—"}</div><div className="sub">per hour, customer pay only</div></div>
          </div>
          {service.length > 1 && <div className="card"><div className="label">ROs closed by store</div><Bars items={service.map((r) => ({ label: r.name, value: r.ros }))} /></div>}
        </>
      )}
      {!sales && !service && <div className="denied">Your record has no reporting feature yet. Ask your administrator for sales or service.</div>}
    </>
  );
}
