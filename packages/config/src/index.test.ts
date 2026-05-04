import { describe, expect, it } from "vitest";

import { parseCsv, requiredEnv } from "./index.js";

describe("config", () => {
  it("requires non-empty environment values", () => {
    expect(() => requiredEnv({}, "DATABASE_URL")).toThrow("DATABASE_URL");
  });

  it("parses comma-separated allowlists", () => {
    expect(parseCsv("a@example.com, b@example.com")).toEqual(["a@example.com", "b@example.com"]);
  });
});

