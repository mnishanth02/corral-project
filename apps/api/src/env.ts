import { resolve } from "node:path";
import { parseEnv, z } from "@corral/config/env";
import { config } from "dotenv";

// Load the monorepo root .env (local dev), then an optional app-local override.
// Real environment variables (Docker/Railway/DO) always take precedence.
config({ path: resolve(process.cwd(), "../../.env") });
config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("redis://") || value.startsWith("rediss://"), {
      message: "REDIS_URL must use the redis:// or rediss:// protocol",
    }),
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:5174")
    .refine((value) => parseCsv(value).every(isValidUrl), {
      message: "CORS_ORIGINS must be a comma-separated list of absolute URLs",
    }),
  API_PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_TRUSTED_ORIGINS: z
    .string()
    .default("http://localhost:5173,http://localhost:5174")
    .refine((value) => parseCsv(value).every(isValidUrl), {
      message: "BETTER_AUTH_TRUSTED_ORIGINS must be a comma-separated list of absolute URLs",
    }),
  BETTER_AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  AUTH_BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  AUTH_BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).optional(),
  AUTH_BOOTSTRAP_ADMIN_NAME: z.string().min(1).optional(),
});

export type ApiEnv = z.infer<typeof envSchema>;

export const getEnv = (): ApiEnv => parseEnv(envSchema, process.env);

export function parseCsv(value: string): string[] {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
