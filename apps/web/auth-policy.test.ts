import { describe, expect, it } from "vitest";

import { assertLocalTestAuthAllowed, isAdminEmail, isLocalTestEmailAllowed, localTestAuthEmail } from "./auth-policy.js";

describe("web auth policy", () => {
  it("uses the configured local test email only when allowlisted", () => {
    const env = {
      VERIFYFLOW_INVITE_ALLOWLIST: "friend@example.com",
      VERIFYFLOW_TEST_AUTH_EMAIL: "friend@example.com"
    };

    expect(localTestAuthEmail(env)).toBe("friend@example.com");
    expect(isLocalTestEmailAllowed("friend@example.com", env)).toBe(true);
    expect(isLocalTestEmailAllowed("other@example.com", env)).toBe(false);
  });

  it("falls back to the invite allowlist when the configured local test email is not allowlisted", () => {
    expect(localTestAuthEmail({
      VERIFYFLOW_INVITE_ALLOWLIST: "friend@example.com",
      VERIFYFLOW_TEST_AUTH_EMAIL: "other@example.com"
    })).toBe("friend@example.com");
  });

  it("rejects local test auth in production", () => {
    expect(() => assertLocalTestAuthAllowed({
      NODE_ENV: "production",
      VERIFYFLOW_TEST_AUTH_ENABLED: "true"
    })).toThrow("not allowed in production");
  });

  it("recognizes configured admin emails", () => {
    const env = { VERIFYFLOW_ADMIN_EMAILS: "admin@example.com, owner@example.com" };

    expect(isAdminEmail("ADMIN@example.com", env)).toBe(true);
    expect(isAdminEmail("friend@example.com", env)).toBe(false);
  });
});
