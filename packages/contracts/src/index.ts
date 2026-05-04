export type ProductTier = "basic" | "verified" | "enhanced";
export type VerificationDecision = "allow" | "deny" | "review";
export type ProviderStatus = "active" | "revoked" | "superseded" | "expired";
export type KycLevel = "basic" | "enhanced";

export type ProviderArtifact = {
  kind: string;
  mediaType: string;
  value: string;
};

export type ProviderPresentationPayload = {
  kind: "verifyflow_provider_presentation";
  providerId: string;
  providerRunId: string;
  artifact: ProviderArtifact;
};

export type OnboardingClaims = {
  subjectReference: string;
  fullLegalName: string;
  dateOfBirth: string;
  countryOfResidence: string;
  documentCountry: string;
  kycLevel: KycLevel;
  verifiedAt: string;
  expiresAt: string;
};

export type UserProfile = {
  userId: string;
  email: string;
  tier: ProductTier;
  latestVerification?: VerificationSummary;
};

export type VerificationSummary = {
  verificationId: string;
  providerRunId?: string;
  decision: VerificationDecision;
  reasonCodes: string[];
  evaluatedAt: string;
  providerStatus: ProviderStatus;
};

export type MeResponse = {
  user: UserProfile;
};

export type OnboardingSessionRequest = {
  claims: OnboardingClaims;
};

export type OnboardingSessionResponse = {
  onboardingSessionId: string;
  claims: OnboardingClaims;
};

export type StartProviderCheckRequest = {
  onboardingSessionId: string;
};

export type StartProviderCheckResponse = {
  providerId: string;
  providerRunId: string;
  kycLevel: KycLevel;
  expiresAt: string;
  presentationPayload: ProviderPresentationPayload;
};

export type CreateVerificationRequest = {
  presentationPayload: ProviderPresentationPayload;
};

export type CreateVerificationResponse = {
  verification: VerificationSummary;
  tier: ProductTier;
};

export type UpgradeTierRequest = {
  onboardingSessionId: string;
};

export type UpgradeTierResponse = {
  providerRunId: string;
  presentationPayload: ProviderPresentationPayload;
  verification: VerificationSummary;
  tier: ProductTier;
};

export type FunnelSummaryResponse = {
  events: Array<{
    step: string;
    outcome: string;
    count: number;
  }>;
};

export type ApiError = {
  error: {
    code: string;
    message: string;
  };
};

export function parsePresentationPayload(value: string): ProviderPresentationPayload {
  const parsed: unknown = JSON.parse(value);
  assertPresentationPayload(parsed);
  return parsed;
}

export function assertPresentationPayload(value: unknown): asserts value is ProviderPresentationPayload {
  if (!isRecord(value) || value.kind !== "verifyflow_provider_presentation") {
    throw new Error("Expected VerifyFlow provider presentation payload.");
  }

  if (typeof value.providerId !== "string" || value.providerId.trim() === "") {
    throw new Error("Presentation payload is missing providerId.");
  }

  if (typeof value.providerRunId !== "string" || value.providerRunId.trim() === "") {
    throw new Error("Presentation payload is missing providerRunId.");
  }

  assertProviderArtifact(value.artifact);
}

export function assertProviderArtifact(value: unknown): asserts value is ProviderArtifact {
  if (!isRecord(value)) {
    throw new Error("Provider artifact must be an object.");
  }

  if (typeof value.kind !== "string" || value.kind.trim() === "") {
    throw new Error("Provider artifact kind is required.");
  }

  if (typeof value.mediaType !== "string" || value.mediaType.trim() === "") {
    throw new Error("Provider artifact mediaType is required.");
  }

  if (typeof value.value !== "string" || value.value.trim() === "") {
    throw new Error("Provider artifact value is required.");
  }
}

export function assertOnboardingClaims(value: unknown): asserts value is OnboardingClaims {
  if (!isRecord(value)) {
    throw new Error("Onboarding claims must be an object.");
  }

  const requiredStrings = [
    "subjectReference",
    "fullLegalName",
    "dateOfBirth",
    "countryOfResidence",
    "documentCountry",
    "verifiedAt",
    "expiresAt"
  ] as const;

  for (const field of requiredStrings) {
    if (typeof value[field] !== "string" || value[field].trim() === "") {
      throw new Error(`${field} is required.`);
    }
  }

  if (value.kycLevel !== "basic" && value.kycLevel !== "enhanced") {
    throw new Error("kycLevel must be basic or enhanced.");
  }

  const countryOfResidence = value.countryOfResidence as string;
  const documentCountry = value.documentCountry as string;

  if (!/^[A-Z]{2}$/.test(countryOfResidence)) {
    throw new Error("countryOfResidence must be an ISO 3166-1 alpha-2 code.");
  }

  if (!/^[A-Z]{2}$/.test(documentCountry)) {
    throw new Error("documentCountry must be an ISO 3166-1 alpha-2 code.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
