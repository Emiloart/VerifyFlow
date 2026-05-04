import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { auth, signOut } from "../auth";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifyFlow",
  description: "Neutral KYC flow measurement product."
};

export default async function RootLayout(props: { children: ReactNode }) {
  const session = await auth();

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
              {session?.user?.email !== undefined ? (
                <nav className="nav-links" aria-label="Main navigation">
                  <Link href="/">Tier</Link>
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
