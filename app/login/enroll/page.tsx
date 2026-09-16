import EnrollForm from "./EnrollForm";
export default async function EnrollPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1>Set up your authenticator</h1>
      <p className="lede">One time only. Install Google Authenticator, Microsoft Authenticator, or 1Password on your phone, then scan the code this page shows.</p>
      <EnrollForm email={sp.email ?? ""} />
    </>
  );
}
