import { createHash, randomUUID } from "node:crypto";

import cors from "@fastify/cors";
import { assertOnboardingClaims, assertPresentationPayload, type ProductTier } from "@verifyflow/contracts";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";

import type { ApiConfig } from "./config.js";
import type { AuthenticatedUser, KycProviderClient, Repository } from "./repository.js";

type AppDeps = {
  config: Pick<ApiConfig, "webOrigin" | "webApiToken">;
  repository: Repository;
  providerClient: KycProviderClient;
};

type AuthenticatedRequest = FastifyRequest & {
  user: AuthenticatedUser;
};

export async function buildApp(deps: AppDeps): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      redact: [
        "req.headers.authorization",
        "req.body",
        "res.body",
        "*.artifact",
        "*.presentationPayload"
      ]
    }
  });

  await app.register(cors, {
    origin: deps.config.webOrigin,
    credentials: false
  });

  app.setErrorHandler(async (error, _request, reply) => {
    const message = error instanceof Error ? error.message : "Request failed.";
    const statusCode = message.includes("not found") ? 404 : 400;
    await reply.status(statusCode).send({
      error: {
        code: statusCode === 404 ? "not_found" : "invalid_request",
        message
      }
    });
  });

  app.get("/healthz", async () => ({ status: "ok" }));

  app.addHook("preHandler", async (request, reply) => {
    if (request.url === "/healthz") {
      return;
    }

    const auth = request.headers.authorization;
    if (auth !== `Bearer ${deps.config.webApiToken}`) {
      await reply.status(401).send({ error: { code: "unauthenticated", message: "VerifyFlow API token is invalid." } });
      return;
    }

    const userId = headerValue(request.headers["x-verifyflow-user-id"]);
    const email = headerValue(request.headers["x-verifyflow-user-email"]);

    if (userId === undefined || email === undefined) {
      await reply.status(401).send({ error: { code: "unauthenticated", message: "VerifyFlow user context is missing." } });
      return;
    }

    (request as AuthenticatedRequest).user = { userId, email };
    await deps.repository.ensureUser({ userId, email });
  });

  app.get("/v1/me", async (request) => {
    const user = (request as AuthenticatedRequest).user;
    const profile = await deps.repository.getUserProfile(user);
    return { user: profile };
  });

  app.post("/v1/onboarding/sessions", async (request) => {
    const user = (request as AuthenticatedRequest).user;
    const body = request.body as { claims?: unknown };
    assertOnboardingClaims(body.claims);
    const session = await deps.repository.createOnboardingSession(user, body.claims);
    await deps.repository.recordFunnelEvent(user.userId, "onboarding_session", "created");
    return { onboardingSessionId: session.onboardingSessionId, claims: session.claims };
  });

  app.post("/v1/provider/checks", async (request) => {
    const user = (request as AuthenticatedRequest).user;
    const onboardingSessionId = readStringField(request.body, "onboardingSessionId");
    const session = await requireOnboardingSession(deps.repository, user, onboardingSessionId);
    const issued = await deps.providerClient.startCheck(session.claims, idempotencyKey(request, "issue"));
    const presentationPayload = {
      kind: "verifyflow_provider_presentation" as const,
      providerId: issued.providerId,
      providerRunId: issued.providerRunId,
      artifact: issued.artifact
    };
    await deps.repository.createProviderRun({
      providerId: issued.providerId,
      userId: user.userId,
      onboardingSessionId,
      providerRunId: issued.providerRunId,
      kycLevel: session.claims.kycLevel,
      status: "active",
      artifactDigest: digestArtifact(issued.artifact.value),
      issuedAt: issued.issuedAt,
      expiresAt: issued.expiresAt
    });
    await deps.repository.recordFunnelEvent(user.userId, "provider_check", "created");
    return {
      providerId: issued.providerId,
      providerRunId: issued.providerRunId,
      kycLevel: session.claims.kycLevel,
      expiresAt: issued.expiresAt,
      presentationPayload
    };
  });

  app.post("/v1/verifications", async (request) => {
    const user = (request as AuthenticatedRequest).user;
    const presentationPayload = (request.body as { presentationPayload?: unknown }).presentationPayload;
    assertPresentationPayload(presentationPayload);
    const result = await deps.providerClient.verifyPresentation(
      presentationPayload.providerRunId,
      presentationPayload.artifact,
      idempotencyKey(request, "verify")
    );
    const attempt = await deps.repository.createVerificationAttempt({ ...result, userId: user.userId });
    const nextTier = await applyTierGrant(deps.repository, user, attempt);
    await deps.repository.recordFunnelEvent(user.userId, "verification", result.decision);
    return { verification: attempt, tier: nextTier };
  });

  app.post("/v1/tiers/upgrade", async (request) => {
    const user = (request as AuthenticatedRequest).user;
    const onboardingSessionId = readStringField(request.body, "onboardingSessionId");
    const session = await requireOnboardingSession(deps.repository, user, onboardingSessionId);
    const claims = { ...session.claims, kycLevel: "enhanced" as const };
    const previous = await deps.repository.getLatestProviderRun(user);
    const issued = await deps.providerClient.startCheck(claims, idempotencyKey(request, "upgrade-issue"));
    const presentationPayload = {
      kind: "verifyflow_provider_presentation" as const,
      providerId: issued.providerId,
      providerRunId: issued.providerRunId,
      artifact: issued.artifact
    };

    await deps.repository.createProviderRun({
      providerId: issued.providerId,
      userId: user.userId,
      onboardingSessionId,
      providerRunId: issued.providerRunId,
      kycLevel: "enhanced",
      status: "active",
      artifactDigest: digestArtifact(issued.artifact.value),
      issuedAt: issued.issuedAt,
      expiresAt: issued.expiresAt
    });

    if (previous !== null && previous.status === "active") {
      await deps.providerClient.supersedeRun(previous.providerRunId, issued.providerRunId, idempotencyKey(request, "upgrade-supersede"));
      await deps.repository.markProviderRunSuperseded(user, previous.providerRunId, issued.providerRunId);
    }

    const result = await deps.providerClient.verifyPresentation(issued.providerRunId, issued.artifact, idempotencyKey(request, "upgrade-verify"));
    const attempt = await deps.repository.createVerificationAttempt({ ...result, userId: user.userId });
    const tier = await applyTierGrant(deps.repository, user, attempt);
    await deps.repository.recordFunnelEvent(user.userId, "tier_upgrade", result.decision);
    return { providerRunId: issued.providerRunId, presentationPayload, verification: attempt, tier };
  });

  app.get("/v1/funnel/summary", async () => deps.repository.summarizeFunnel());

  return app;
}

async function requireOnboardingSession(repository: Repository, user: AuthenticatedUser, onboardingSessionId: string) {
  const session = await repository.getOnboardingSession(user, onboardingSessionId);
  if (session === null) {
    throw new Error("onboarding session not found");
  }

  return session;
}

async function applyTierGrant(repository: Repository, user: AuthenticatedUser, attempt: { providerRunId?: string; decision: string; providerStatus: string; verificationId: string }): Promise<ProductTier> {
  const profile = await repository.getUserProfile(user);
  if (attempt.decision !== "allow" || attempt.providerStatus !== "active" || attempt.providerRunId === undefined) {
    return profile.tier;
  }

  const providerRun = await repository.getProviderRun(user, attempt.providerRunId);
  if (providerRun === null) {
    return profile.tier;
  }

  const nextTier: ProductTier = providerRun.kycLevel === "enhanced" ? "enhanced" : "verified";
  await repository.grantTier(user, nextTier, attempt.verificationId);
  return nextTier;
}

function readStringField(body: unknown, field: string): string {
  if (typeof body !== "object" || body === null || !Object.hasOwn(body, field)) {
    throw new Error(`${field} is required.`);
  }

  const value = (body as Record<string, unknown>)[field];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required.`);
  }

  return value;
}

function idempotencyKey(request: FastifyRequest, suffix: string): string {
  const supplied = headerValue(request.headers["idempotency-key"]);
  return supplied === undefined ? `${suffix}-${randomUUID()}` : `${supplied}-${suffix}`;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function digestArtifact(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
