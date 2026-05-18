import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { assertLocalTestAuthAllowed, isEmailAllowed, isLocalTestAuthEnabled, isLocalTestEmailAllowed } from "./auth-policy";

assertLocalTestAuthAllowed();

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "local-placeholder",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "local-placeholder"
    }),
    ...(isLocalTestAuthEnabled() ? [
      Credentials({
        id: "local-test",
        name: "Local test",
        credentials: {
          email: { label: "Email", type: "email" }
        },
        authorize(credentials) {
          const email = typeof credentials.email === "string" ? credentials.email.trim().toLowerCase() : "";
          if (!isLocalTestEmailAllowed(email)) {
            return null;
          }

          return {
            id: `local-test:${email}`,
            email,
            name: "Local VerifyFlow Tester"
          };
        }
      })
    ] : [])
  ],
  callbacks: {
    signIn({ user, profile }) {
      const email = typeof profile?.email === "string"
        ? profile.email.toLowerCase()
        : typeof user.email === "string" ? user.email.toLowerCase() : "";
      return email !== "" && isEmailAllowed(email);
    }
  }
});
