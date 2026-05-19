import { describe, expect, it } from "vitest";

import type { OnboardingClaims, ProviderArtifact, VerificationSummary } from "@verifyflow/contracts";

import { buildApp } from "./app.js";
import { MemoryRepository } from "./memory-repository.js";
import { MockKycProviderClient } from "./mock-provider-client.js";
import type { KycProviderClient, ProviderCheckResponse } from "./repository.js";

const userHeaders = {
  authorization: "Bearer test-web-token",
  "x-verifyflow-user-id": "user_123",
  "x-verifyflow-user-email": "friend@example.com"
};

const nonAdminHeaders = {
  ...userHeaders,
  "x-verifyflow-user-id": "user_456",
  "x-verifyflow-user-email": "tester@example.com"
};

const appConfig = {
  webOrigin: "http://localhost:3000",
  webApiToken: "test-web-token",
  adminEmails: ["friend@example.com"]
};

describe("VerifyFlow API", () => {
  it("grants verified tier only after provider allow", async () => {
    const repository = new MemoryRepository();
    const app = await buildApp({
      config: appConfig,
      repository,
      providerClient: new FakeProviderClient("allow")
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/onboarding/sessions",
      headers: userHeaders,
      payload: { claims: basicClaims() }
    });
    const sessionBody = session.json<{ onboardingSessionId: string }>();

    const issued = await app.inject({
      method: "POST",
      url: "/v1/provider/checks",
      headers: userHeaders,
      payload: { onboardingSessionId: sessionBody.onboardingSessionId }
    });
    const issuedBody = issued.json<{ presentationPayload: unknown }>();

    const verified = await app.inject({
      method: "POST",
      url: "/v1/verifications",
      headers: userHeaders,
      payload: { presentationPayload: issuedBody.presentationPayload }
    });

    expect(verified.statusCode).toBe(200);
    expect(verified.json<{ tier: string }>().tier).toBe("verified");
    expect(repository.tierGrants).toHaveLength(1);
  });

  it("does not grant tier after provider deny", async () => {
    const repository = new MemoryRepository();
    const app = await buildApp({
      config: appConfig,
      repository,
      providerClient: new FakeProviderClient("deny")
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/onboarding/sessions",
      headers: userHeaders,
      payload: { claims: basicClaims() }
    });
    const issued = await app.inject({
      method: "POST",
      url: "/v1/provider/checks",
      headers: userHeaders,
      payload: { onboardingSessionId: session.json<{ onboardingSessionId: string }>().onboardingSessionId }
    });
    const verified = await app.inject({
      method: "POST",
      url: "/v1/verifications",
      headers: userHeaders,
      payload: { presentationPayload: issued.json<{ presentationPayload: unknown }>().presentationPayload }
    });

    expect(verified.statusCode).toBe(200);
    expect(verified.json<{ tier: string }>().tier).toBe("basic");
    expect(repository.tierGrants).toHaveLength(0);
  });

  it("fails closed when provider verification is unavailable", async () => {
    const app = await buildApp({
      config: appConfig,
      repository: new MemoryRepository(),
      providerClient: new UnavailableProviderClient()
    });

    const verified = await app.inject({
      method: "POST",
      url: "/v1/verifications",
      headers: userHeaders,
      payload: {
        presentationPayload: {
          kind: "verifyflow_provider_presentation",
          providerId: "provider_a",
          providerRunId: "run_123",
          artifact: artifact()
        }
      }
    });

    expect(verified.statusCode).toBe(400);
  });

  it("supports deterministic local mock provider upgrade and old-run supersede", async () => {
    const repository = new MemoryRepository();
    const app = await buildApp({
      config: appConfig,
      repository,
      providerClient: new MockKycProviderClient({ mode: "mock", providerId: "mock-provider" })
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/onboarding/sessions",
      headers: userHeaders,
      payload: { claims: basicClaims() }
    });
    const issued = await app.inject({
      method: "POST",
      url: "/v1/provider/checks",
      headers: userHeaders,
      payload: { onboardingSessionId: session.json<{ onboardingSessionId: string }>().onboardingSessionId }
    });
    const verified = await app.inject({
      method: "POST",
      url: "/v1/verifications",
      headers: userHeaders,
      payload: { presentationPayload: issued.json<{ presentationPayload: unknown }>().presentationPayload }
    });

    const upgradeSession = await app.inject({
      method: "POST",
      url: "/v1/onboarding/sessions",
      headers: userHeaders,
      payload: { claims: { ...basicClaims(), kycLevel: "enhanced" } }
    });
    const upgraded = await app.inject({
      method: "POST",
      url: "/v1/tiers/upgrade",
      headers: userHeaders,
      payload: { onboardingSessionId: upgradeSession.json<{ onboardingSessionId: string }>().onboardingSessionId }
    });
    const oldPayload = issued.json<{ presentationPayload: unknown }>().presentationPayload;
    const oldRecheck = await app.inject({
      method: "POST",
      url: "/v1/verifications",
      headers: userHeaders,
      payload: { presentationPayload: oldPayload }
    });

    expect(verified.json<{ tier: string }>().tier).toBe("verified");
    expect(upgraded.json<{ tier: string }>().tier).toBe("enhanced");
    expect(oldRecheck.json<{ tier: string; verification: { providerStatus: string } }>().tier).toBe("enhanced");
    expect(oldRecheck.json<{ verification: { providerStatus: string } }>().verification.providerStatus).toBe("superseded");
  });

  it("returns admin-only measurement summary without raw claims or artifacts", async () => {
    const repository = new MemoryRepository();
    const app = await buildApp({
      config: appConfig,
      repository,
      providerClient: new FakeProviderClient("allow")
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/onboarding/sessions",
      headers: userHeaders,
      payload: { claims: basicClaims() }
    });
    const issued = await app.inject({
      method: "POST",
      url: "/v1/provider/checks",
      headers: userHeaders,
      payload: { onboardingSessionId: session.json<{ onboardingSessionId: string }>().onboardingSessionId }
    });
    await app.inject({
      method: "POST",
      url: "/v1/verifications",
      headers: userHeaders,
      payload: { presentationPayload: issued.json<{ presentationPayload: unknown }>().presentationPayload }
    });

    const summary = await app.inject({
      method: "GET",
      url: "/v1/measurement/summary",
      headers: userHeaders
    });
    const body = summary.json<{
      totals: { totalSessions: number; allowRate: number };
      recentSessions: unknown[];
    }>();
    const serialized = JSON.stringify(body);

    expect(summary.statusCode).toBe(200);
    expect(body.totals.totalSessions).toBe(1);
    expect(body.totals.allowRate).toBe(100);
    expect(body.recentSessions).toHaveLength(1);
    expect(serialized).not.toContain("Example Person");
    expect(serialized).not.toContain("test-artifact");
    expect(serialized).not.toContain("friend@example.com");
  });

  it("returns admin-only measurement sessions", async () => {
    const repository = new MemoryRepository();
    const app = await buildApp({
      config: appConfig,
      repository,
      providerClient: new FakeProviderClient("allow")
    });

    const session = await app.inject({
      method: "POST",
      url: "/v1/onboarding/sessions",
      headers: userHeaders,
      payload: { claims: basicClaims() }
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/measurement/sessions",
      headers: userHeaders
    });
    const body = response.json<{ sessions: Array<{ sessionId: string; userRef: string; decision: string }> }>();

    expect(session.statusCode).toBe(200);
    expect(response.statusCode).toBe(200);
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0]?.sessionId).toMatch(/^VF-/);
    expect(body.sessions[0]?.userRef).toBe("user_user_123");
    expect(body.sessions[0]?.decision).toBe("pending");
  });

  it("rejects non-admin measurement access", async () => {
    const app = await buildApp({
      config: appConfig,
      repository: new MemoryRepository(),
      providerClient: new FakeProviderClient("allow")
    });

    const response = await app.inject({
      method: "GET",
      url: "/v1/measurement/sessions",
      headers: nonAdminHeaders
    });

    expect(response.statusCode).toBe(403);
  });
});

function basicClaims(): OnboardingClaims {
  return {
    subjectReference: "vf_user_123",
    fullLegalName: "Example Person",
    dateOfBirth: "1990-01-01",
    countryOfResidence: "US",
    documentCountry: "US",
    kycLevel: "basic",
    verifiedAt: "2026-05-02T12:00:00.000Z",
    expiresAt: "2027-05-02T12:00:00.000Z"
  };
}

function artifact(): ProviderArtifact {
  return {
    kind: "opaque_artifact",
    mediaType: "application/vnd.provider.artifact",
    value: "test-artifact"
  };
}

class FakeProviderClient implements KycProviderClient {
  constructor(private readonly decision: "allow" | "deny") {}

  async startCheck(claims: OnboardingClaims): Promise<ProviderCheckResponse> {
    return {
      providerId: "provider_a",
      providerRunId: "run_123",
      issuedAt: claims.verifiedAt,
      expiresAt: claims.expiresAt,
      artifact: artifact()
    };
  }

  async verifyPresentation(): Promise<VerificationSummary> {
    return {
      verificationId: "ver_123",
      providerRunId: "run_123",
      decision: this.decision,
      reasonCodes: [this.decision === "allow" ? "provider_active" : "provider_revoked"],
      evaluatedAt: "2026-05-02T12:01:00.000Z",
      providerStatus: this.decision === "allow" ? "active" : "revoked"
    };
  }

  async supersedeRun(): Promise<void> {}
}

class UnavailableProviderClient extends FakeProviderClient {
  constructor() {
    super("deny");
  }

  override async verifyPresentation(): Promise<VerificationSummary> {
    throw new Error("Provider verification unavailable.");
  }
}
