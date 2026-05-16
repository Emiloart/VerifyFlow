import { randomUUID } from "node:crypto";

import type { OnboardingClaims, ProviderArtifact, ProviderStatus, VerificationDecision, VerificationSummary } from "@verifyflow/contracts";

import type { MockProviderConfig } from "./config.js";
import type { KycProviderClient, ProviderCheckResponse } from "./repository.js";

type MockRun = {
  providerRunId: string;
  kycLevel: OnboardingClaims["kycLevel"];
  issuedAt: string;
  expiresAt: string;
  status: ProviderStatus;
};

type MockArtifactEnvelope = MockRun & {
  providerId: string;
  artifactVersion: 1;
};

export class MockKycProviderClient implements KycProviderClient {
  private readonly runs = new Map<string, MockRun>();
  private readonly idempotentStarts = new Map<string, ProviderCheckResponse>();
  private readonly idempotentVerifications = new Map<string, VerificationSummary>();

  constructor(private readonly config: MockProviderConfig) {}

  async startCheck(claims: OnboardingClaims, idempotencyKey: string): Promise<ProviderCheckResponse> {
    const existing = this.idempotentStarts.get(idempotencyKey);
    if (existing !== undefined) {
      return existing;
    }

    const run: MockRun = {
      providerRunId: `mock_run_${randomUUID()}`,
      kycLevel: claims.kycLevel,
      issuedAt: claims.verifiedAt,
      expiresAt: claims.expiresAt,
      status: initialStatus(claims)
    };
    this.runs.set(run.providerRunId, run);

    const response = {
      providerId: this.config.providerId,
      providerRunId: run.providerRunId,
      issuedAt: run.issuedAt,
      expiresAt: run.expiresAt,
      artifact: artifactForRun(this.config.providerId, run)
    };
    this.idempotentStarts.set(idempotencyKey, response);
    return response;
  }

  async verifyPresentation(providerRunId: string, artifact: ProviderArtifact, idempotencyKey: string): Promise<VerificationSummary> {
    const existing = this.idempotentVerifications.get(idempotencyKey);
    if (existing !== undefined) {
      return existing;
    }

    const envelope = parseMockArtifact(artifact);
    const run = this.runs.get(providerRunId) ?? {
      providerRunId: envelope.providerRunId,
      kycLevel: envelope.kycLevel,
      issuedAt: envelope.issuedAt,
      expiresAt: envelope.expiresAt,
      status: envelope.status
    };

    if (envelope.providerId !== this.config.providerId || envelope.providerRunId !== providerRunId) {
      return this.rememberVerification(idempotencyKey, providerRunId, "deny", "mock_artifact_mismatch", "revoked");
    }

    const status = effectiveStatus(run);
    const decision: VerificationDecision = status === "active" ? "allow" : "deny";
    const reasonCode = status === "active" ? "mock_provider_active" : `mock_provider_${status}`;
    return this.rememberVerification(idempotencyKey, providerRunId, decision, reasonCode, status);
  }

  async supersedeRun(providerRunId: string): Promise<void> {
    const run = this.runs.get(providerRunId);
    if (run !== undefined) {
      this.runs.set(providerRunId, { ...run, status: "superseded" });
    }
  }

  private rememberVerification(
    idempotencyKey: string,
    providerRunId: string,
    decision: VerificationDecision,
    reasonCode: string,
    providerStatus: ProviderStatus
  ): VerificationSummary {
    const result = {
      verificationId: `mock_ver_${randomUUID()}`,
      providerRunId,
      decision,
      reasonCodes: [reasonCode],
      evaluatedAt: new Date().toISOString(),
      providerStatus
    };
    this.idempotentVerifications.set(idempotencyKey, result);
    return result;
  }
}

function initialStatus(claims: OnboardingClaims): ProviderStatus {
  const name = claims.fullLegalName.toLowerCase();
  if (name.includes("revoked")) {
    return "revoked";
  }

  if (Date.parse(claims.expiresAt) <= Date.now()) {
    return "expired";
  }

  return "active";
}

function effectiveStatus(run: MockRun): ProviderStatus {
  if (run.status !== "active") {
    return run.status;
  }

  return Date.parse(run.expiresAt) <= Date.now() ? "expired" : "active";
}

function artifactForRun(providerId: string, run: MockRun): ProviderArtifact {
  const envelope: MockArtifactEnvelope = {
    artifactVersion: 1,
    providerId,
    ...run
  };

  return {
    kind: "mock_provider_artifact",
    mediaType: "application/vnd.verifyflow.mock-provider+json",
    value: Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url")
  };
}

function parseMockArtifact(artifact: ProviderArtifact): MockArtifactEnvelope {
  if (artifact.kind !== "mock_provider_artifact") {
    throw new Error("Mock provider artifact kind is invalid.");
  }

  const parsed = JSON.parse(Buffer.from(artifact.value, "base64url").toString("utf8")) as Partial<MockArtifactEnvelope>;
  if (
    parsed.artifactVersion !== 1 ||
    typeof parsed.providerId !== "string" ||
    typeof parsed.providerRunId !== "string" ||
    (parsed.kycLevel !== "basic" && parsed.kycLevel !== "enhanced") ||
    typeof parsed.issuedAt !== "string" ||
    typeof parsed.expiresAt !== "string" ||
    (parsed.status !== "active" && parsed.status !== "revoked" && parsed.status !== "superseded" && parsed.status !== "expired")
  ) {
    throw new Error("Mock provider artifact payload is invalid.");
  }

  return parsed as MockArtifactEnvelope;
}
