import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db, schema } from "@corral/db";
import { Logger } from "@nestjs/common";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { getEnv, parseCsv } from "../env";

const env = getEnv();
const logger = new Logger("BetterAuth");

export const auth = betterAuth({
  appName: "Corral",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: parseCsv(env.BETTER_AUTH_TRUSTED_ORIGINS),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  advanced: {
    cookiePrefix: "corral",
    ...(env.BETTER_AUTH_COOKIE_DOMAIN
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: env.BETTER_AUTH_COOKIE_DOMAIN,
          },
        }
      : {}),
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      logger.log(`Email verification requested for ${user.email}: ${url}`);
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      logger.log(`Password reset requested for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      disableSignUp: true,
      disableImplicitSignUp: true,
      prompt: "select_account",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      requireLocalEmailVerified: false,
    },
  },
  plugins: [admin()],
});

export type Auth = typeof auth;
