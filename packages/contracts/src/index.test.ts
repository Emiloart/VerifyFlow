import { describe, expect, it } from "vitest";

import { assertOnboardingClaims, parsePresentationPayload } from "./index.js";

describe("contracts", () => {
  it("parses a valid provider presentation payload", () => {
    const payload = parsePresentationPayload(JSON.stringify({
      kind: "verifyflow_provider_presentation",
      providerId: "provider_a",
      providerRunId: "run_123",
      artifact: {
        kind: "opaque_artifact",
        mediaType: "application/vnd.provider.artifact",
        value: "test-artifact"
      }
    }));

    expect(payload.providerRunId).toBe("run_123");
  });

  it("rejects malformed country codes", () => {
    expect(() => assertOnboardingClaims({
      subjectReference: "user_123",
      fullLegalName: "Example Person",
      dateOfBirth: "1990-01-01",
      countryOfResidence: "USA",
      documentCountry: "US",
      kycLevel: "basic",
      verifiedAt: "2026-05-02T12:00:00.000Z",
      expiresAt: "2027-05-02T12:00:00.000Z"
    })).toThrow("countryOfResidence");
  });
});
