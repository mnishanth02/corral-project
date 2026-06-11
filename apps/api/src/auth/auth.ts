import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { getEnv, parseCsv } from "../env";
import { sendAuthEmailLink } from "./auth-email";

const env = getEnv();
const { db, schema } = require("@corral/db") as typeof import("@corral/db");

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
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmailLink("verification", { email: user.email, url });
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: !env.AUTH_ORGANIZER_SIGNUP_ENABLED,
    requireEmailVerification: true,
    minPasswordLength: 10,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmailLink("password-reset", { email: user.email, url });
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
