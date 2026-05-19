import { signIn, auth } from "../auth";
import { isAdminEmail, isLocalTestAuthEnabled, localTestAuthEmail } from "../auth-policy";
import { Dashboard, MeasurementDashboard } from "./components";

export default async function HomePage() {
  const session = await auth();
  const email = session?.user?.email;
  const testEmail = localTestAuthEmail();

  if (typeof email !== "string" || email.trim() === "") {
    return <PublicLanding testEmail={testEmail} />;
  }

  return isAdminEmail(email) ? <MeasurementDashboard /> : <Dashboard />;
}

function PublicLanding(props: { testEmail: string | null }) {
  return (
    <main className="public-landing">
      <section className="public-hero">
        <div className="public-hero-copy">
          <p className="public-kicker">Neutral KYC measurement</p>
          <h1>Verify once. Measure every KYC flow.</h1>
          <p className="public-lede">
            VerifyFlow is a focused tester console for onboarding, provider checks, presentation, verification,
            tier unlocks, and drop-off measurement without tying the product to one KYC vendor.
          </p>
          <div className="hero-actions">
            <form action={async () => {
              "use server";
              await signIn("google");
            }}>
              <button className="primary-button" type="submit">Sign in with Google</button>
            </form>
            {isLocalTestAuthEnabled() && props.testEmail !== null ? (
              <form action={async (formData) => {
                "use server";
                const email = formData.get("email");
                if (typeof email !== "string") {
                  throw new Error("Missing local test email.");
                }

                await signIn("local-test", { email, redirectTo: "/" });
              }}>
                <input type="hidden" name="email" value={props.testEmail} />
                <button className="secondary-button" type="submit">Sign in as local tester</button>
              </form>
            ) : null}
          </div>
        </div>

        <aside className="public-hero-card" aria-label="VerifyFlow flow preview">
          <span className="provider-badge">adapter-neutral</span>
          <h2>Tester loop</h2>
          <ol className="public-flow-list">
            <li><strong>Onboarding</strong><span>Normalized claims only</span></li>
            <li><strong>Provider check</strong><span>Backend adapter call</span></li>
            <li><strong>Presentation</strong><span>User-carried payload</span></li>
            <li><strong>Verification</strong><span>Fail-closed decision</span></li>
            <li><strong>Tier unlock</strong><span>Real result metrics</span></li>
          </ol>
        </aside>
      </section>

      <section className="trust-strip" aria-label="Trust boundaries">
        <div>
          <strong>Encrypted session</strong>
          <span>Invited tester access through Auth.js.</span>
        </div>
        <div>
          <strong>No data selling</strong>
          <span>First-party operational funnel events only.</span>
        </div>
        <div>
          <strong>Backend-only provider access</strong>
          <span>Provider credentials never reach the browser.</span>
        </div>
      </section>

      <section className="public-explainer" aria-label="How VerifyFlow measures KYC flows">
        <article>
          <span>01</span>
          <h2>Run the flow</h2>
          <p>Invite testers through onboarding, provider-side checks, presentation, verification, and tier unlock.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Measure drop-off</h2>
          <p>Track bounded step outcomes and completion timing from real sessions, not placeholder dashboard numbers.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Stay neutral</h2>
          <p>Swap provider adapters without giving VerifyFlow privileged access to provider internals.</p>
        </article>
      </section>
    </main>
  );
}
