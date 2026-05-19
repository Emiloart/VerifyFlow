import type {
  MeasurementDecision,
  MeasurementFlowStep,
  MeasurementSessionsResponse,
  MeasurementSession,
  MeasurementSummaryResponse,
  ProductTier
} from "@verifyflow/contracts";

import type { ProviderRunRecord, VerificationAttemptRecord } from "./repository.js";

export type MeasurementOnboardingSession = {
  onboardingSessionId: string;
  userId: string;
  createdAt: string;
};

export type MeasurementTierGrant = {
  userId: string;
  tier: ProductTier;
  sourceVerificationId: string | null;
  grantedAt: string;
};

export type MeasurementFunnelEvent = {
  step: string;
  outcome: string;
  count: number;
};

export type MeasurementInput = {
  users: Array<{ userId: string }>;
  onboardingSessions: MeasurementOnboardingSession[];
  providerRuns: ProviderRunRecord[];
  verificationAttempts: VerificationAttemptRecord[];
  tierGrants: MeasurementTierGrant[];
  funnel: MeasurementFunnelEvent[];
};

const productTiers: ProductTier[] = ["basic", "verified", "enhanced"];

export function buildMeasurementSummary(input: MeasurementInput, limit: number): MeasurementSummaryResponse {
  const sessions = buildMeasurementSessions(input);
  const recentSessions = sessions.slice(0, limit);
  const completed = sessions.filter((session) => session.decision !== "pending");
  const allowCount = completed.filter((session) => session.decision === "allow").length;
  const elapsed = completed
    .map((session) => session.elapsedSeconds)
    .filter((value): value is number => typeof value === "number");
  const latestSource = input.onboardingSessions
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const latestSession = latestSource === undefined
    ? undefined
    : sessions.find((session) => session.sessionId === shortSessionId(latestSource.onboardingSessionId));

  return {
    totals: {
      totalSessions: sessions.length,
      allowRate: completed.length === 0 ? 0 : roundOne((allowCount / completed.length) * 100),
      averageFlowSeconds: elapsed.length === 0 ? null : roundOne(elapsed.reduce((total, value) => total + value, 0) / elapsed.length),
      openChecks: sessions.filter((session) => session.decision === "pending").length
    },
    ...(latestSource === undefined || latestSession === undefined ? {} : {
      latestFlow: {
        session: latestSession,
        steps: buildFlowSteps(input, latestSource)
      }
    }),
    recentSessions,
    tierCoverage: buildTierCoverage(input.users, input.tierGrants),
    funnel: input.funnel,
    nextPhase: {
      title: "Multi-provider comparison",
      description: "Deferred until the single-provider measurement dashboard is real and stable."
    }
  };
}

export function buildMeasurementSessionsResponse(input: MeasurementInput, limit: number): MeasurementSessionsResponse {
  return { sessions: buildMeasurementSessions(input).slice(0, limit) };
}

function buildMeasurementSessions(input: MeasurementInput): MeasurementSession[] {
  const runsBySession = new Map<string, ProviderRunRecord>();
  for (const run of input.providerRuns) {
    const existing = runsBySession.get(run.onboardingSessionId);
    if (existing === undefined || run.issuedAt.localeCompare(existing.issuedAt) > 0) {
      runsBySession.set(run.onboardingSessionId, run);
    }
  }

  const verificationsByRun = new Map<string, VerificationAttemptRecord>();
  for (const attempt of input.verificationAttempts) {
    if (attempt.providerRunId === undefined) {
      continue;
    }

    const existing = verificationsByRun.get(attempt.providerRunId);
    if (existing === undefined || attempt.evaluatedAt.localeCompare(existing.evaluatedAt) > 0) {
      verificationsByRun.set(attempt.providerRunId, attempt);
    }
  }

  const tierByUser = currentTierByUser(input.tierGrants);

  return input.onboardingSessions
    .map((session) => {
      const run = runsBySession.get(session.onboardingSessionId);
      const verification = run === undefined ? undefined : verificationsByRun.get(run.providerRunId);
      const decision: MeasurementDecision = verification?.decision ?? "pending";
      const elapsedSeconds = verification === undefined ? undefined : secondsBetween(session.createdAt, verification.evaluatedAt);

      return {
        sessionId: shortSessionId(session.onboardingSessionId),
        userRef: userRef(session.userId),
        ...(run === undefined ? {} : {
          providerId: run.providerId,
          providerRunId: run.providerRunId
        }),
        decision,
        ...(verification?.providerStatus === undefined ? {} : { providerStatus: verification.providerStatus }),
        tier: tierByUser.get(session.userId) ?? "basic",
        ...(elapsedSeconds === undefined ? {} : { elapsedSeconds }),
        createdAt: session.createdAt,
        ...(verification?.evaluatedAt === undefined ? {} : { evaluatedAt: verification.evaluatedAt })
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildFlowSteps(input: MeasurementInput, session: MeasurementOnboardingSession): MeasurementFlowStep[] {
  const run = input.providerRuns
    .filter((candidate) => candidate.onboardingSessionId === session.onboardingSessionId)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0];
  const verification = run === undefined ? undefined : input.verificationAttempts
    .filter((candidate) => candidate.providerRunId === run.providerRunId)
    .sort((a, b) => b.evaluatedAt.localeCompare(a.evaluatedAt))[0];
  const tierUnlocked = verification?.decision === "allow" && verification.providerStatus === "active";
  const verificationErrored = verification !== undefined && !tierUnlocked;

  return [
    { key: "sign_in", label: "Sign in", status: "done", timestamp: session.createdAt },
    { key: "onboarding", label: "Onboarding", status: "done", timestamp: session.createdAt },
    {
      key: "provider_check",
      label: "Provider check",
      status: run === undefined ? "active" : "done",
      ...(run === undefined ? {} : { timestamp: run.issuedAt })
    },
    {
      key: "presentation",
      label: "Presentation",
      status: run === undefined ? "pending" : verification === undefined ? "active" : "done",
      ...(run === undefined ? {} : { timestamp: run.issuedAt })
    },
    {
      key: "verification",
      label: "Verification",
      status: verification === undefined ? "pending" : verificationErrored ? "error" : "done",
      ...(verification === undefined ? {} : { timestamp: verification.evaluatedAt })
    },
    {
      key: "tier_unlock",
      label: "Tier unlock",
      status: tierUnlocked ? "done" : verificationErrored ? "error" : "pending",
      ...(verification === undefined ? {} : { timestamp: verification.evaluatedAt })
    }
  ];
}

function buildTierCoverage(users: Array<{ userId: string }>, tierGrants: MeasurementTierGrant[]) {
  const counts = new Map<ProductTier, number>(productTiers.map((tier) => [tier, 0]));
  const tierByUser = currentTierByUser(tierGrants);

  for (const user of users) {
    const tier = tierByUser.get(user.userId) ?? "basic";
    counts.set(tier, (counts.get(tier) ?? 0) + 1);
  }

  return productTiers.map((tier) => ({ tier, users: counts.get(tier) ?? 0 }));
}

function currentTierByUser(tierGrants: MeasurementTierGrant[]): Map<string, ProductTier> {
  const result = new Map<string, { tier: ProductTier; grantedAt: string }>();
  for (const grant of tierGrants) {
    const current = result.get(grant.userId);
    if (current === undefined || grant.grantedAt.localeCompare(current.grantedAt) > 0) {
      result.set(grant.userId, { tier: grant.tier, grantedAt: grant.grantedAt });
    }
  }

  return new Map([...result.entries()].map(([userId, grant]) => [userId, grant.tier]));
}

function secondsBetween(start: string, end: string): number | undefined {
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return undefined;
  }

  return roundOne((endMs - startMs) / 1000);
}

function shortSessionId(sessionId: string): string {
  return `VF-${sessionId.replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function userRef(userId: string): string {
  return `user_${userId.replace(/^vf_/, "").slice(0, 8)}`;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
