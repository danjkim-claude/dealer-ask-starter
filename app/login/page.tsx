import LoginForm from "./LoginForm";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ enrolled?: string }> }) {
  const sp = await searchParams;
  return (
    <>
      <h1>Sign in</h1>
      <p className="lede">Your email, your password, and the six-digit code from your authenticator app.</p>
      {sp.enrolled && <p className="ok">Authenticator enrolled. Sign in with the current code.</p>}
      <LoginForm />
      <p style={{ marginTop: "1rem" }}>First time here? <a href="/login/enroll">Set up your authenticator app</a>.</p>
    </>
  );
}
