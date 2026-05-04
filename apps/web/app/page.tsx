import { signIn, auth } from "../auth";
import { Dashboard } from "./components";

export default async function HomePage() {
  const session = await auth();

  if (session?.user?.email === undefined) {
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <p className="eyebrow">Reference relying party</p>
          <h1>VerifyFlow</h1>
          <p className="muted">
            Sign in to measure a KYC provider flow from onboarding through verification and upgrade.
          </p>
          <form action={async () => {
            "use server";
            await signIn("google");
          }}>
            <button className="primary-button" type="submit">Sign in with Google</button>
          </form>
        </section>
      </main>
    );
  }

  return <Dashboard />;
}
