import type { OnboardingClaims, ProviderArtifact, VerificationSummary } from "@verifyflow/contracts";

import type { ApiConfig, HttpProviderConfig } from "./config.js";
import { MockKycProviderClient } from "./mock-provider-client.js";
import type { KycProviderClient, ProviderCheckResponse } from "./repository.js";

type ProviderRole = "issue" | "verify";

export function createKycProviderClient(config: ApiConfig["provider"]): KycProviderClient {
  return config.mode === "mock" ? new MockKycProviderClient(config) : new HttpKycProviderClient(config);
}

export class HttpKycProviderClient implements KycProviderClient {
  constructor(private readonly config: HttpProviderConfig) {}

  async startCheck(claims: OnboardingClaims, idempotencyKey: string): Promise<ProviderCheckResponse> {
    const token = await this.getAccessToken("issue");
    const response = await this.postJson(this.config.issueUrl, token, {
      templateId: this.config.templateId,
      ...claims
    }, idempotencyKey);
    const payload = response as {
      credentialId?: string;
      providerRunId?: string;
      issuedAt: string;
      expiresAt: string;
      credentialArtifact?: ProviderArtifact;
      artifact?: ProviderArtifact;
    };
    const providerRunId = payload.providerRunId ?? payload.credentialId;
    const artifact = payload.artifact ?? payload.credentialArtifact;

    if (providerRunId === undefined || artifact === undefined) {
      throw new Error("Provider check response is missing providerRunId or artifact.");
    }

    return {
      providerId: this.config.providerId,
      providerRunId,
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
      artifact
    };
  }

  async verifyPresentation(providerRunId: string, artifact: ProviderArtifact, idempotencyKey: string): Promise<VerificationSummary> {
    const token = await this.getAccessToken("verify");
    const response = await this.postJson(this.config.verifyUrl, token, {
      policyId: this.config.policyId,
      providerRunId,
      credentialId: providerRunId,
      artifact,
      credentialArtifact: artifact
    }, idempotencyKey);
    const payload = response as VerificationSummary & {
      credentialId?: string;
      credentialStatus?: VerificationSummary["providerStatus"];
    };

    return {
      verificationId: payload.verificationId,
      providerRunId: payload.providerRunId ?? payload.credentialId ?? providerRunId,
      decision: payload.decision,
      reasonCodes: payload.reasonCodes,
      evaluatedAt: payload.evaluatedAt,
      providerStatus: payload.providerStatus ?? payload.credentialStatus ?? "active"
    };
  }

  async supersedeRun(providerRunId: string, supersededByProviderRunId: string, idempotencyKey: string): Promise<void> {
    const token = await this.getAccessToken("issue");
    await this.postJson(this.config.supersedeUrlTemplate.replace("{providerRunId}", encodeURIComponent(providerRunId)), token, {
      status: "superseded",
      supersededByProviderRunId,
      supersededByCredentialId: supersededByProviderRunId
    }, idempotencyKey);
  }

  private async getAccessToken(role: ProviderRole): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: role === "issue" ? this.config.issueClientId : this.config.verifyClientId,
      client_secret: role === "issue" ? this.config.issueClientSecret : this.config.verifyClientSecret
    });
    const scope = role === "issue" ? this.config.issueScope : this.config.verifyScope;
    if (scope.trim() !== "") {
      body.set("scope", scope);
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Provider ${role} token request failed.`);
    }

    const payload = await response.json() as { access_token?: unknown };
    if (typeof payload.access_token !== "string" || payload.access_token.trim() === "") {
      throw new Error(`Provider ${role} token response did not include an access token.`);
    }

    return payload.access_token;
  }

  private async postJson(url: string, token: string, body: unknown, idempotencyKey: string): Promise<unknown> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Provider request failed with status ${String(response.status)}.`);
    }

    return response.json();
  }
}
