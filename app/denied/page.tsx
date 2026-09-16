import { currentEmail } from "@/lib/auth/require";
import { resolve } from "@/lib/rights/scope";
export default async function Denied({ searchParams }: { searchParams: Promise<{ feature?: string; admin?: string }> }) {
  const sp = await searchParams; const email = await currentEmail(); const scope = email ? await resolve(email) : null;
  const why = sp.feature ? `Your access does not include ${sp.feature} reporting.` : sp.admin ? "Only an administrator can open the Users page." : scope && !scope.ok ? scope.reason : "You are signed in, but you are not set up to use this assistant.";
  return (<><h1>Signed in, not authorized</h1><div className="denied"><p>{email ?? "Nobody"} is signed in. {why}</p><p>Identity is not authorization: a login proves who you are; the rights record decides what you may see. Ask your administrator to add or change your record.</p></div></>);
}
