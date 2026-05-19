import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { auth, signOut } from "../auth";
import { isAdminEmail } from "../auth-policy";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifyFlow",
  description: "Neutral KYC flow measurement product."
};

export default async function RootLayout(props: { children: ReactNode }) {
  const session = await auth();
  const email = session?.user?.email;
  const isAdmin = typeof email === "string" && isAdminEmail(email);

  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="app-frame">
            <header className="app-header">
              <Link className="brand" href="/">
                <span className="brand-mark">VF</span>
                <span>VerifyFlow</span>
              </Link>
              {email !== undefined ? (
                <nav className="nav-links" aria-label="Main navigation">
                  <Link href="/">{isAdmin ? "Dashboard" : "Tier"}</Link>
                  {isAdmin ? <Link href="/sessions">Sessions</Link> : null}
                  <Link href="/onboarding">Onboarding</Link>
                  <Link href="/payload">Payload</Link>
                  <Link href="/verify">Verify</Link>
                  <Link href="/upgrade">Upgrade</Link>
                  <Link href="/settings">Settings</Link>
                  <form action={async () => {
                    "use server";
                    await signOut();
                  }}>
                    <button className="text-button" type="submit">Sign out</button>
                  </form>
                </nav>
              ) : null}
            </header>
            {props.children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
