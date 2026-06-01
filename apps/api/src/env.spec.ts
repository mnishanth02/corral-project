import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validEnv = {
  DATABASE_URL: "postgres://corral:corral@localhost:5432/corral",
  REDIS_URL: "redis://localhost:6379",
  CORS_ORIGINS: "http://localhost:5173,http://localhost:5174",
  API_PORT: "3000",
  NODE_ENV: "test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:5173",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
};

describe("getEnv", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("validates Better Auth and OAuth configuration", async () => {
    const { getEnv } = await import("./env.js");

    expect(getEnv()).toMatchObject({
      BETTER_AUTH_SECRET: validEnv.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: validEnv.BETTER_AUTH_URL,
      GOOGLE_CLIENT_ID: validEnv.GOOGLE_CLIENT_ID,
    });
  });

  it("requires a 32 character Better Auth secret", async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short");
    const { getEnv } = await import("./env.js");

    expect(() => getEnv()).toThrow("BETTER_AUTH_SECRET must be at least 32 characters");
  });

  it("rejects invalid trusted origins", async () => {
    vi.stubEnv("BETTER_AUTH_TRUSTED_ORIGINS", "http://localhost:5173,not-a-url");
    const { getEnv } = await import("./env.js");

    expect(() => getEnv()).toThrow(
      "BETTER_AUTH_TRUSTED_ORIGINS must be a comma-separated list of absolute URLs",
    );
  });
});
