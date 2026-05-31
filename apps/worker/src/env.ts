import { resolve } from "node:path";
import { parseEnv, z } from "@corral/config/env";
import { config } from "dotenv";

// Load the monorepo root .env (local dev), then an optional app-local override.
// Real environment variables (Docker/Railway/DO) always take precedence.
config({ path: resolve(process.cwd(), "../../.env") });
config();

const envSchema = z.object({
  REDIS_URL: z
    .string()
    .url()
    .refine((value) => value.startsWith("redis://") || value.startsWith("rediss://"), {
      message: "REDIS_URL must use the redis:// or rediss:// protocol",
    }),
  WORKER_PORT: z.coerce.number().int().positive().default(3100),
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type WorkerEnv = z.infer<typeof envSchema>;

export const getEnv = (): WorkerEnv => parseEnv(envSchema, process.env);
