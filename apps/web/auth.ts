import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function inviteAllowlist(): Set<string> {
  return new Set((process.env.VERIFYFLOW_INVITE_ALLOWLIST ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt"
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "local-placeholder",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "local-placeholder"
    })
  ],
  callbacks: {
    signIn({ profile }) {
      const email = typeof profile?.email === "string" ? profile.email.toLowerCase() : "";
      const allowlist = inviteAllowlist();
      return allowlist.size === 0 || allowlist.has(email);
    }
  }
});

