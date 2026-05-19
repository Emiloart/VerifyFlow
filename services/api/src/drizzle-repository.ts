import { randomUUID } from "node:crypto";

import { desc, eq, sql, type InferSelectModel } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type { ProductTier, UserProfile } from "@verifyflow/contracts";

import { buildMeasurementSessionsResponse, buildMeasurementSummary } from "./measurement.js";
import * as dbSchema from "./db/schema.js";
import {
  funnelEvents,
  onboardingSessions,
  providerRuns,
  tierGrants,
  users,
  verificationAttempts,
  type FunnelSummaryRow
} from "./db/schema.js";
import type {
  AuthenticatedUser,
  ProviderRunInput,
  ProviderRunRecord,
  OnboardingSessionRecord,
  Repository,
  VerificationAttemptInput,
  VerificationAttemptRecord
} from "./repository.js";

type Db = PostgresJsDatabase<typeof dbSchema>;
type OnboardingSessionRow = InferSelectModel<typeof onboardingSessions>;
type ProviderRunRow = InferSelectModel<typeof providerRuns>;
type TierGrantRow = InferSelectModel<typeof tierGrants>;
type UserRow = InferSelectModel<typeof users>;
type VerificationAttemptRow = InferSelectModel<typeof verificationAttempts>;

export class DrizzleRepository implements Repository {
  constructor(private readonly db: Db) {}

  async ensureUser(user: AuthenticatedUser): Promise<void> {
    await this.db.insert(users).values({
      userId: user.userId,
      email: user.email,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: users.userId,
      set: { email: user.email, updatedAt: new Date() }
    });
  }

  async getUserProfile(user: AuthenticatedUser): Promise<UserProfile> {
    const [grant] = await this.db
      .select()
      .from(tierGrants)
      .where(eq(tierGrants.userId, user.userId))
      .orderBy(desc(tierGrants.grantedAt))
      .limit(1) as Array<{ tier: ProductTier }>;
    const [latestVerificationRow] = await this.db
      .select()
      .from(verificationAttempts)
      .where(eq(verificationAttempts.userId, user.userId))
      .orderBy(desc(verificationAttempts.evaluatedAt))
      .limit(1) as VerificationAttemptRow[];

    return {
      userId: user.userId,
      email: user.email,
      tier: grant?.tier ?? "basic",
      ...(latestVerificationRow === undefined ? {} : { latestVerification: normalizeVerificationAttempt(latestVerificationRow) })
    };
  }

  async createOnboardingSession(user: AuthenticatedUser, claims: OnboardingSessionRecord["claims"]): Promise<OnboardingSessionRecord> {
    const [record] = await this.db.insert(onboardingSessions).values({
      onboardingSessionId: randomUUID(),
      userId: user.userId,
      claims
    }).returning() as OnboardingSessionRow[];
    if (record === undefined) {
      throw new Error("Could not create onboarding session.");
    }
    return normalizeOnboardingSession(record);
  }

  async getOnboardingSession(user: AuthenticatedUser, onboardingSessionId: string): Promise<OnboardingSessionRecord | null> {
    const [record] = await this.db
      .select()
      .from(onboardingSessions)
      .where(sql`${onboardingSessions.onboardingSessionId} = ${onboardingSessionId} and ${onboardingSessions.userId} = ${user.userId}`)
      .limit(1) as OnboardingSessionRow[];
    return record === undefined ? null : normalizeOnboardingSession(record);
  }

  async createProviderRun(input: ProviderRunInput): Promise<ProviderRunRecord> {
    const [record] = await this.db.insert(providerRuns).values({
      providerRunRecordId: randomUUID(),
      ...input,
      issuedAt: new Date(input.issuedAt),
      expiresAt: new Date(input.expiresAt)
    }).returning() as ProviderRunRow[];
    if (record === undefined) {
      throw new Error("Could not create provider run.");
    }
    return normalizeProviderRun(record);
  }

  async getProviderRun(user: AuthenticatedUser, providerRunId: string): Promise<ProviderRunRecord | null> {
    const [record] = await this.db
      .select()
      .from(providerRuns)
      .where(sql`${providerRuns.providerRunId} = ${providerRunId} and ${providerRuns.userId} = ${user.userId}`)
      .limit(1) as ProviderRunRow[];
    return record === undefined ? null : normalizeProviderRun(record);
  }

  async getLatestProviderRun(user: AuthenticatedUser): Promise<ProviderRunRecord | null> {
    const [record] = await this.db
      .select()
      .from(providerRuns)
      .where(eq(providerRuns.userId, user.userId))
      .orderBy(desc(providerRuns.issuedAt))
      .limit(1) as ProviderRunRow[];
    return record === undefined ? null : normalizeProviderRun(record);
  }

  async markProviderRunSuperseded(user: AuthenticatedUser, providerRunId: string, supersededByProviderRunId: string): Promise<void> {
    await this.db
      .update(providerRuns)
      .set({ status: "superseded", supersededByProviderRunId })
      .where(sql`${providerRuns.providerRunId} = ${providerRunId} and ${providerRuns.userId} = ${user.userId}`);
  }

  async createVerificationAttempt(input: VerificationAttemptInput): Promise<VerificationAttemptRecord> {
    await this.db.insert(verificationAttempts).values({
      verificationAttemptId: randomUUID(),
      ...input,
      evaluatedAt: new Date(input.evaluatedAt)
    }).onConflictDoNothing();
    const [record] = await this.db
      .select()
      .from(verificationAttempts)
      .where(eq(verificationAttempts.verificationId, input.verificationId))
      .limit(1) as VerificationAttemptRow[];
    if (record === undefined) {
      throw new Error("Could not create verification attempt.");
    }
    return normalizeVerificationAttempt(record);
  }

  async grantTier(user: AuthenticatedUser, tier: ProductTier, sourceVerificationId: string): Promise<void> {
    await this.db.insert(tierGrants).values({
      tierGrantId: randomUUID(),
      userId: user.userId,
      tier,
      sourceVerificationId
    }).onConflictDoNothing();
  }

  async recordFunnelEvent(userId: string | undefined, step: string, outcome: string): Promise<void> {
    await this.db.insert(funnelEvents).values({
      funnelEventId: randomUUID(),
      userId,
      step,
      outcome
    });
  }

  async summarizeFunnel() {
    const rows = await this.db
      .select({
        step: funnelEvents.step,
        outcome: funnelEvents.outcome,
        count: sql<number>`count(*)::int`
      })
      .from(funnelEvents)
      .groupBy(funnelEvents.step, funnelEvents.outcome) as FunnelSummaryRow[];
    return { events: rows };
  }

  async summarizeMeasurement(limit: number) {
    return buildMeasurementSummary(await this.measurementInput(), limit);
  }

  async listMeasurementSessions(limit: number) {
    return buildMeasurementSessionsResponse(await this.measurementInput(), limit);
  }

  private async measurementInput() {
    const userRows = await this.db.select().from(users) as UserRow[];
    const onboardingRows = await this.db.select().from(onboardingSessions) as OnboardingSessionRow[];
    const providerRunRows = await this.db.select().from(providerRuns) as ProviderRunRow[];
    const verificationRows = await this.db.select().from(verificationAttempts) as VerificationAttemptRow[];
    const tierGrantRows = await this.db.select().from(tierGrants) as TierGrantRow[];

    return {
      users: userRows.map((user) => ({ userId: user.userId })),
      onboardingSessions: onboardingRows.map((session) => ({
        onboardingSessionId: session.onboardingSessionId,
        userId: session.userId,
        createdAt: session.createdAt.toISOString()
      })),
      providerRuns: providerRunRows.map(normalizeProviderRun),
      verificationAttempts: verificationRows.map(normalizeVerificationAttempt),
      tierGrants: tierGrantRows.map((grant) => ({
        userId: grant.userId,
        tier: grant.tier,
        sourceVerificationId: grant.sourceVerificationId,
        grantedAt: grant.grantedAt.toISOString()
      })),
      funnel: (await this.summarizeFunnel()).events
    };
  }
}

function normalizeProviderRun(record: ProviderRunRow): ProviderRunRecord {
  return {
    providerId: record.providerId,
    providerRunId: record.providerRunId,
    userId: record.userId,
    onboardingSessionId: record.onboardingSessionId,
    kycLevel: record.kycLevel,
    status: record.status,
    artifactDigest: record.artifactDigest,
    issuedAt: record.issuedAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    ...(record.supersededByProviderRunId === null ? {} : { supersededByProviderRunId: record.supersededByProviderRunId })
  };
}

function normalizeOnboardingSession(record: OnboardingSessionRow): OnboardingSessionRecord {
  return {
    onboardingSessionId: record.onboardingSessionId,
    userId: record.userId,
    claims: record.claims,
    createdAt: record.createdAt.toISOString()
  };
}

function normalizeVerificationAttempt(record: VerificationAttemptRow): VerificationAttemptRecord {
  return {
    userId: record.userId,
    verificationId: record.verificationId,
    ...(record.providerRunId === null ? {} : { providerRunId: record.providerRunId }),
    decision: record.decision,
    reasonCodes: record.reasonCodes,
    evaluatedAt: record.evaluatedAt.toISOString(),
    providerStatus: record.providerStatus
  };
}
