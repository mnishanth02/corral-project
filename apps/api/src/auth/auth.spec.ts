import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const validEnv = {
  DATABASE_URL: "postgres://corral:corral@localhost:5432/corral",
  REDIS_URL: "redis://localhost:6379",
  CORS_ORIGINS: "http://localhost:5173,http://localhost:5174",
  API_PORT: "3000",
  NODE_ENV: "test",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_TRUSTED_ORIGINS: "http://localhost:5173,http://localhost:5174",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
};

type AuthOptionsForTest = {
  session?: {
    cookieCache?: {
      enabled?: boolean;
    };
  };
};

describe("Better Auth server options", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const [key, value] of Object.entries(validEnv)) {
      vi.stubEnv(key, value);
    }
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mounts auth under /api/auth with trusted console origins", async () => {
    const { auth } = await import("./auth.js");

    expect(auth.options.baseURL).toBe("http://localhost:3000");
    expect(auth.options.basePath).toBe("/api/auth");
    expect(auth.options.trustedOrigins).toEqual(["http://localhost:5173", "http://localhost:5174"]);
  }, 30_000);

  it("enables verified email signup while keeping public Google signup disabled", async () => {
    const { auth } = await import("./auth.js");

    expect(auth.options.emailAndPassword?.disableSignUp).toBe(false);
    expect(auth.options.emailAndPassword?.requireEmailVerification).toBe(true);
    expect(auth.options.emailAndPassword?.minPasswordLength).toBe(10);
    expect(auth.options.emailAndPassword?.autoSignIn).toBe(false);
    expect(auth.options.emailVerification?.sendOnSignUp).toBe(true);
    expect(auth.options.socialProviders?.google?.disableSignUp).toBe(true);
    expect(auth.options.socialProviders?.google?.disableImplicitSignUp).toBe(true);
    expect(auth.options.account?.accountLinking?.enabled).toBe(true);
    expect(auth.options.account?.accountLinking?.trustedProviders).toContain("google");
    expect(auth.options.account?.accountLinking?.requireLocalEmailVerified).toBe(false);
  });

  it("keeps session cookie caching disabled for immediate revocation", async () => {
    const { auth } = await import("./auth.js");
    const options = auth.options as AuthOptionsForTest;

    expect(options.session?.cookieCache?.enabled).not.toBe(true);
  });
});
