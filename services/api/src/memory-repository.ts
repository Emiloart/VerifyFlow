import { randomUUID } from "node:crypto";

import type { ProductTier, UserProfile } from "@verifyflow/contracts";

import { buildMeasurementSessionsResponse, buildMeasurementSummary } from "./measurement.js";
import type {
  AuthenticatedUser,
  ProviderRunInput,
  ProviderRunRecord,
  OnboardingSessionRecord,
  Repository,
  VerificationAttemptInput,
  VerificationAttemptRecord
} from "./repository.js";

export class MemoryRepository implements Repository {
  readonly users = new Map<string, AuthenticatedUser>();
  readonly onboardingSessions = new Map<string, OnboardingSessionRecord>();
  readonly providerRuns = new Map<string, ProviderRunRecord>();
  readonly verificationAttempts = new Map<string, VerificationAttemptRecord>();
  readonly tierGrants: Array<{ userId: string; tier: ProductTier; sourceVerificationId: string; grantedAt: string }> = [];
  readonly funnelEvents: Array<{ userId?: string; step: string; outcome: string }> = [];

  async ensureUser(user: AuthenticatedUser): Promise<void> {
    this.users.set(user.userId, user);
  }

  async getUserProfile(user: AuthenticatedUser): Promise<UserProfile> {
    const grants = this.tierGrants
      .filter((grant) => grant.userId === user.userId)
      .sort((a, b) => b.grantedAt.localeCompare(a.grantedAt));
    const latestVerification = [...this.verificationAttempts.values()]
      .filter((attempt) => attempt.userId === user.userId)
      .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0];

    return {
      userId: user.userId,
      email: user.email,
      tier: grants[0]?.tier ?? "basic",
      ...(latestVerification === undefined ? {} : { latestVerification })
    };
  }

  async createOnboardingSession(user: AuthenticatedUser, claims: OnboardingSessionRecord["claims"]): Promise<OnboardingSessionRecord> {
    const record = {
      onboardingSessionId: randomUUID(),
      userId: user.userId,
      claims,
      createdAt: new Date().toISOString()
    };
    this.onboardingSessions.set(record.onboardingSessionId, record);
    return record;
  }

  async getOnboardingSession(user: AuthenticatedUser, onboardingSessionId: string): Promise<OnboardingSessionRecord | null> {
    const record = this.onboardingSessions.get(onboardingSessionId);
    return record?.userId === user.userId ? record : null;
  }

  async createProviderRun(input: ProviderRunInput): Promise<ProviderRunRecord> {
    const record = { ...input };
    this.providerRuns.set(record.providerRunId, record);
    return record;
  }

  async getProviderRun(user: AuthenticatedUser, providerRunId: string): Promise<ProviderRunRecord | null> {
    const record = this.providerRuns.get(providerRunId);
    return record?.userId === user.userId ? record : null;
  }

  async getLatestProviderRun(user: AuthenticatedUser): Promise<ProviderRunRecord | null> {
    const records = [...this.providerRuns.values()]
      .filter((record) => record.userId === user.userId)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
    return records[0] ?? null;
  }

  async markProviderRunSuperseded(user: AuthenticatedUser, providerRunId: string, supersededByProviderRunId: string): Promise<void> {
    const record = await this.getProviderRun(user, providerRunId);
    if (record !== null) {
      this.providerRuns.set(providerRunId, {
        ...record,
        status: "superseded",
        supersededByProviderRunId
      });
    }
  }

  async createVerificationAttempt(input: VerificationAttemptInput): Promise<VerificationAttemptRecord> {
    const existing = this.verificationAttempts.get(input.verificationId);
    if (existing !== undefined) {
      return existing;
    }

    const record = { ...input };
    this.verificationAttempts.set(record.verificationId, record);
    return record;
  }

  async grantTier(user: AuthenticatedUser, tier: ProductTier, sourceVerificationId: string): Promise<void> {
    if (this.tierGrants.some((grant) => grant.userId === user.userId && grant.sourceVerificationId === sourceVerificationId)) {
      return;
    }

    this.tierGrants.push({
      userId: user.userId,
      tier,
      sourceVerificationId,
      grantedAt: new Date().toISOString()
    });
  }

  async recordFunnelEvent(userId: string | undefined, step: string, outcome: string): Promise<void> {
    this.funnelEvents.push({ ...(userId === undefined ? {} : { userId }), step, outcome });
  }

  async summarizeFunnel() {
    const grouped = new Map<string, number>();
    for (const event of this.funnelEvents) {
      const key = `${event.step}\u0000${event.outcome}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }

    return {
      events: [...grouped.entries()].map(([key, count]) => {
        const [step, outcome] = key.split("\u0000");
        return { step: step ?? "unknown", outcome: outcome ?? "unknown", count };
      })
    };
  }

  async summarizeMeasurement(limit: number) {
    return buildMeasurementSummary({
      users: [...this.users.values()].map((user) => ({ userId: user.userId })),
      onboardingSessions: [...this.onboardingSessions.values()].map((session) => ({
        onboardingSessionId: session.onboardingSessionId,
        userId: session.userId,
        createdAt: session.createdAt ?? new Date(0).toISOString()
      })),
      providerRuns: [...this.providerRuns.values()],
      verificationAttempts: [...this.verificationAttempts.values()],
      tierGrants: this.tierGrants.map((grant) => ({ ...grant, sourceVerificationId: grant.sourceVerificationId })),
      funnel: (await this.summarizeFunnel()).events
    }, limit);
  }

  async listMeasurementSessions(limit: number) {
    return buildMeasurementSessionsResponse({
      users: [...this.users.values()].map((user) => ({ userId: user.userId })),
      onboardingSessions: [...this.onboardingSessions.values()].map((session) => ({
        onboardingSessionId: session.onboardingSessionId,
        userId: session.userId,
        createdAt: session.createdAt ?? new Date(0).toISOString()
      })),
      providerRuns: [...this.providerRuns.values()],
      verificationAttempts: [...this.verificationAttempts.values()],
      tierGrants: this.tierGrants.map((grant) => ({ ...grant, sourceVerificationId: grant.sourceVerificationId })),
      funnel: (await this.summarizeFunnel()).events
    }, limit);
  }
}
