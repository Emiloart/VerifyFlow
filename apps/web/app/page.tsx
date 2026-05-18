import { signIn, auth } from "../auth";
import { isLocalTestAuthEnabled, localTestAuthEmail } from "../auth-policy";
import { Dashboard } from "./components";

export default async function HomePage() {
  const session = await auth();
  const testEmail = localTestAuthEmail();

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
          {isLocalTestAuthEnabled() && testEmail !== null ? (
            <form action={async (formData) => {
              "use server";
              const email = formData.get("email");
              if (typeof email !== "string") {
                throw new Error("Missing local test email.");
              }

              await signIn("local-test", { email, redirectTo: "/" });
            }}>
              <input type="hidden" name="email" value={testEmail} />
              <button className="secondary-button" type="submit">Sign in as local tester</button>
            </form>
          ) : null}
        </section>
      </main>
    );
  }

  return <Dashboard />;
}
