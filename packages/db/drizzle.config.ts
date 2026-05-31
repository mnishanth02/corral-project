import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// `pnpm --filter @corral/db db:*` runs with cwd = packages/db. Load the monorepo
// root .env first, then an optional package-local .env override.
config({ path: resolve(process.cwd(), "../../.env") });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for drizzle-kit. Set it in .env or the environment.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
