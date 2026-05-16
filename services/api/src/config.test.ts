import { describe, expect, it } from "vitest";

import { loadApiConfig } from "./config.js";

const baseEnv = {
  DATABASE_URL: "postgres://verifyflow:verifyflow@localhost:55432/verifyflow",
  VERIFYFLOW_WEB_ORIGIN: "http://localhost:3000",
  VERIFYFLOW_WEB_API_TOKEN: "test-token"
};

describe("api config", () => {
  it("allows mock provider mode outside production", () => {
    const config = loadApiConfig({
      ...baseEnv,
      NODE_ENV: "development",
      KYC_PROVIDER_MODE: "mock"
    });

    expect(config.provider.mode).toBe("mock");
  });

  it("rejects mock provider mode in production", () => {
    expect(() => loadApiConfig({
      ...baseEnv,
      NODE_ENV: "production",
      KYC_PROVIDER_MODE: "mock"
    })).toThrow("mock is not allowed in production");
  });
});
