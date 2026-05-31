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
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
  API_PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ApiEnv = z.infer<typeof envSchema>;

export const getEnv = (): ApiEnv => parseEnv(envSchema, process.env);
