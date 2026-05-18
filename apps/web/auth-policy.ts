type AuthEnv = Record<string, string | undefined>;

export function inviteAllowlist(env: AuthEnv = process.env): Set<string> {
  return new Set((env.VERIFYFLOW_INVITE_ALLOWLIST ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}

export function isLocalTestAuthEnabled(env: AuthEnv = process.env): boolean {
  return env.VERIFYFLOW_TEST_AUTH_ENABLED === "true";
}

export function assertLocalTestAuthAllowed(env: AuthEnv = process.env): void {
  if (isLocalTestAuthEnabled(env) && env.NODE_ENV === "production") {
    throw new Error("VERIFYFLOW_TEST_AUTH_ENABLED=true is not allowed in production.");
  }
}

export function localTestAuthEmail(env: AuthEnv = process.env): string | null {
  const allowlist = inviteAllowlist(env);
  const configured = env.VERIFYFLOW_TEST_AUTH_EMAIL?.trim().toLowerCase();
  if (configured !== undefined && configured !== "" && allowlist.has(configured)) {
    return configured;
  }

  const firstAllowlistedEmail = allowlist.values().next().value;
  return typeof firstAllowlistedEmail === "string" ? firstAllowlistedEmail : null;
}

export function isEmailAllowed(email: string, env: AuthEnv = process.env): boolean {
  const allowlist = inviteAllowlist(env);
  return allowlist.size === 0 || allowlist.has(email.trim().toLowerCase());
}

export function isLocalTestEmailAllowed(email: string, env: AuthEnv = process.env): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized !== "" && inviteAllowlist(env).has(normalized);
}
