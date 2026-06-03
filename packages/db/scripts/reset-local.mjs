import { resolve } from "node:path";
import process from "node:process";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: resolve(process.cwd(), "../../.env") });
config();

const yes = process.argv.includes("--yes");
const databaseUrl = process.env.DATABASE_URL;

if (!yes) {
  console.error(
    "Refusing to reset without --yes. This command drops local auth tables and Drizzle migration metadata.",
  );
  process.exit(1);
}

if (!databaseUrl) {
  console.error("DATABASE_URL is required. Set it in .env or the environment.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (!localHosts.has(url.hostname)) {
  console.error(`Refusing to reset non-local database host: ${url.hostname}`);
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

try {
  await sql.unsafe("drop schema if exists drizzle cascade");
  await sql.unsafe(
    'drop table if exists public.account, public.session, public.verification, public."user" cascade',
  );
  console.log(
    "Dropped local Drizzle metadata and auth tables. Run pnpm db:migrate to recreate them from migrations.",
  );
} finally {
  await sql.end();
}
