import { optionalEnv, parseCsv, requiredEnv, type EnvSource } from "@verifyflow/config";

export type ApiConfig = {
  port: number;
  databaseUrl: string;
  webOrigin: string;
  webApiToken: string;
  inviteAllowlist: string[];
  provider: ProviderConfig;
};

export function loadApiConfig(env: EnvSource = process.env): ApiConfig {
  const providerMode = providerModeFromEnv(env);
  if (providerMode === "mock" && optionalEnv(env, "NODE_ENV", "development") === "production") {
    throw new Error("KYC_PROVIDER_MODE=mock is not allowed in production.");
  }

  return {
    port: Number.parseInt(optionalEnv(env, "VERIFYFLOW_API_PORT", "4100"), 10),
    databaseUrl: requiredEnv(env, "DATABASE_URL"),
    webOrigin: requiredEnv(env, "VERIFYFLOW_WEB_ORIGIN"),
    webApiToken: requiredEnv(env, "VERIFYFLOW_WEB_API_TOKEN"),
    inviteAllowlist: parseCsv(optionalEnv(env, "VERIFYFLOW_INVITE_ALLOWLIST", "")),
    provider: providerMode === "mock" ? mockProviderConfig(env) : httpProviderConfig(env)
  };
}

export type ProviderConfig = HttpProviderConfig | MockProviderConfig;

export type HttpProviderConfig = {
  mode: "http";
  providerId: string;
  issueUrl: string;
  verifyUrl: string;
  supersedeUrlTemplate: string;
  tokenUrl: string;
  templateId: string;
  policyId: string;
  issueScope: string;
  verifyScope: string;
  issueClientId: string;
  issueClientSecret: string;
  verifyClientId: string;
  verifyClientSecret: string;
};

export type MockProviderConfig = {
  mode: "mock";
  providerId: string;
};

function providerModeFromEnv(env: EnvSource): ProviderConfig["mode"] {
  const value = optionalEnv(env, "KYC_PROVIDER_MODE", "http");
  if (value === "http" || value === "mock") {
    return value;
  }

  throw new Error("KYC_PROVIDER_MODE must be http or mock.");
}

function mockProviderConfig(env: EnvSource): MockProviderConfig {
  return {
    mode: "mock",
    providerId: optionalEnv(env, "KYC_PROVIDER_ID", "mock-provider")
  };
}

function httpProviderConfig(env: EnvSource): HttpProviderConfig {
  return {
    mode: "http",
    providerId: optionalEnv(env, "KYC_PROVIDER_ID", "local-provider"),
    issueUrl: requiredEnv(env, "KYC_PROVIDER_ISSUE_URL"),
    verifyUrl: requiredEnv(env, "KYC_PROVIDER_VERIFY_URL"),
    supersedeUrlTemplate: requiredEnv(env, "KYC_PROVIDER_SUPERSEDE_URL_TEMPLATE"),
    tokenUrl: requiredEnv(env, "KYC_PROVIDER_TOKEN_URL"),
    templateId: optionalEnv(env, "KYC_PROVIDER_TEMPLATE_ID", "passport-basic"),
    policyId: optionalEnv(env, "KYC_PROVIDER_POLICY_ID", "passport-basic"),
    issueScope: optionalEnv(env, "KYC_PROVIDER_ISSUE_SCOPE", ""),
    verifyScope: optionalEnv(env, "KYC_PROVIDER_VERIFY_SCOPE", ""),
    issueClientId: requiredEnv(env, "KYC_PROVIDER_ISSUE_CLIENT_ID"),
    issueClientSecret: requiredEnv(env, "KYC_PROVIDER_ISSUE_CLIENT_SECRET"),
    verifyClientId: requiredEnv(env, "KYC_PROVIDER_VERIFY_CLIENT_ID"),
    verifyClientSecret: requiredEnv(env, "KYC_PROVIDER_VERIFY_CLIENT_SECRET")
  };
}
