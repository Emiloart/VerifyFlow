import type {
  ProviderArtifact,
  ProviderStatus,
  FunnelSummaryResponse,
  KycLevel,
  MeasurementSessionsResponse,
  MeasurementSummaryResponse,
  OnboardingClaims,
  ProductTier,
  UserProfile,
  VerificationSummary
} from "@verifyflow/contracts";

export type AuthenticatedUser = {
  userId: string;
  email: string;
};

export type OnboardingSessionRecord = {
  onboardingSessionId: string;
  userId: string;
  claims: OnboardingClaims;
  createdAt?: string;
};

export type ProviderRunRecord = {
  providerId: string;
  providerRunId: string;
  userId: string;
  onboardingSessionId: string;
  kycLevel: KycLevel;
  status: ProviderStatus;
  artifactDigest: string;
  issuedAt: string;
  expiresAt: string;
  supersededByProviderRunId?: string;
};

export type VerificationAttemptRecord = VerificationSummary & {
  userId: string;
};

export type ProviderRunInput = {
  providerId: string;
  userId: string;
  onboardingSessionId: string;
  providerRunId: string;
  kycLevel: KycLevel;
  status: ProviderStatus;
  artifactDigest: string;
  issuedAt: string;
  expiresAt: string;
};

export type VerificationAttemptInput = VerificationAttemptRecord;

export type Repository = {
  ensureUser(user: AuthenticatedUser): Promise<void>;
  getUserProfile(user: AuthenticatedUser): Promise<UserProfile>;
  createOnboardingSession(user: AuthenticatedUser, claims: OnboardingClaims): Promise<OnboardingSessionRecord>;
  getOnboardingSession(user: AuthenticatedUser, onboardingSessionId: string): Promise<OnboardingSessionRecord | null>;
  createProviderRun(input: ProviderRunInput): Promise<ProviderRunRecord>;
  getProviderRun(user: AuthenticatedUser, providerRunId: string): Promise<ProviderRunRecord | null>;
  getLatestProviderRun(user: AuthenticatedUser): Promise<ProviderRunRecord | null>;
  markProviderRunSuperseded(user: AuthenticatedUser, providerRunId: string, supersededByProviderRunId: string): Promise<void>;
  createVerificationAttempt(input: VerificationAttemptInput): Promise<VerificationAttemptRecord>;
  grantTier(user: AuthenticatedUser, tier: ProductTier, sourceVerificationId: string): Promise<void>;
  recordFunnelEvent(userId: string | undefined, step: string, outcome: string): Promise<void>;
  summarizeFunnel(): Promise<FunnelSummaryResponse>;
  summarizeMeasurement(limit: number): Promise<MeasurementSummaryResponse>;
  listMeasurementSessions(limit: number): Promise<MeasurementSessionsResponse>;
};

export type ProviderCheckResponse = {
  providerId: string;
  providerRunId: string;
  issuedAt: string;
  expiresAt: string;
  artifact: ProviderArtifact;
};

export type KycProviderClient = {
  startCheck(claims: OnboardingClaims, idempotencyKey: string): Promise<ProviderCheckResponse>;
  verifyPresentation(providerRunId: string, artifact: ProviderArtifact, idempotencyKey: string): Promise<VerificationSummary>;
  supersedeRun(providerRunId: string, supersededByProviderRunId: string, idempotencyKey: string): Promise<void>;
};
