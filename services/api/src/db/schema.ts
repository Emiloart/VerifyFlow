import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import type { OnboardingClaims, ProductTier, VerificationDecision } from "@verifyflow/contracts";

export const users = pgTable("users", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const onboardingSessions = pgTable("onboarding_sessions", {
  onboardingSessionId: uuid("onboarding_session_id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId),
  claims: jsonb("claims").$type<OnboardingClaims>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdx: index("onboarding_sessions_user_idx").on(table.userId)
}));

export const providerRuns = pgTable("provider_runs", {
  providerRunRecordId: uuid("provider_run_record_id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId),
  onboardingSessionId: uuid("onboarding_session_id").notNull().references(() => onboardingSessions.onboardingSessionId),
  providerId: text("provider_id").notNull(),
  providerRunId: text("provider_run_id").notNull(),
  kycLevel: text("kyc_level", { enum: ["basic", "enhanced"] }).notNull(),
  status: text("status", { enum: ["active", "revoked", "superseded", "expired"] }).notNull(),
  artifactDigest: text("artifact_digest").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  supersededByProviderRunId: text("superseded_by_provider_run_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  providerRunIdx: uniqueIndex("provider_runs_provider_run_id_idx").on(table.providerRunId),
  userIdx: index("provider_runs_user_idx").on(table.userId)
}));

export const verificationAttempts = pgTable("verification_attempts", {
  verificationAttemptId: uuid("verification_attempt_id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId),
  verificationId: text("verification_id").notNull(),
  providerRunId: text("provider_run_id"),
  decision: text("decision", { enum: ["allow", "deny", "review"] }).$type<VerificationDecision>().notNull(),
  reasonCodes: jsonb("reason_codes").$type<string[]>().notNull(),
  evaluatedAt: timestamp("evaluated_at", { withTimezone: true }).notNull(),
  providerStatus: text("provider_status", { enum: ["active", "revoked", "superseded", "expired"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  verificationIdx: uniqueIndex("verification_attempts_verification_id_idx").on(table.verificationId),
  userIdx: index("verification_attempts_user_idx").on(table.userId)
}));

export const tierGrants = pgTable("tier_grants", {
  tierGrantId: uuid("tier_grant_id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.userId),
  tier: text("tier", { enum: ["basic", "verified", "enhanced"] }).$type<ProductTier>().notNull(),
  sourceVerificationId: text("source_verification_id"),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  userIdx: index("tier_grants_user_idx").on(table.userId),
  sourceIdx: uniqueIndex("tier_grants_source_verification_idx").on(table.sourceVerificationId)
}));

export const funnelEvents = pgTable("funnel_events", {
  funnelEventId: uuid("funnel_event_id").primaryKey(),
  userId: text("user_id").references(() => users.userId),
  step: text("step").notNull(),
  outcome: text("outcome").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (table) => ({
  stepIdx: index("funnel_events_step_idx").on(table.step)
}));

export const auditEvents = pgTable("audit_events", {
  auditEventId: uuid("audit_event_id").primaryKey(),
  userId: text("user_id").references(() => users.userId),
  action: text("action").notNull(),
  resourceId: text("resource_id"),
  outcome: text("outcome").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export type FunnelSummaryRow = {
  step: string;
  outcome: string;
  count: number;
};
