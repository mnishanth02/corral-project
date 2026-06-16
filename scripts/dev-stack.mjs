#!/usr/bin/env node
import { execFile, execFileSync, spawn } from "node:child_process";
import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(repoRoot, ".env");
const envExamplePath = resolve(repoRoot, ".env.example");
const isWindows = process.platform === "win32";
const pnpmCommand = isWindows ? "pnpm.cmd" : "pnpm";

const defaultPorts = {
  POSTGRES_PORT: 5432,
  REDIS_PORT: 6379,
  API_PORT: 3000,
  WORKER_PORT: 3100,
  WEB_PORT: 5273,
  CONSOLE_PORT: 5274,
};

const serviceNames = {
  postgres: "Postgres",
  redis: "Redis",
  api: "API",
  worker: "Worker",
  web: "Web",
  console: "Console",
};

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

ensureLocalEnv();

const fileEnv = parseEnvFile(envPath);
const baseEnv = { ...fileEnv, ...process.env };
const reservedPorts = new Set();

const selected = {
  postgres: await selectPort({
    key: "POSTGRES_PORT",
    preferred: numberFromEnv(baseEnv, "POSTGRES_PORT", defaultPorts.POSTGRES_PORT),
    reservedPorts,
    existingPort: await getComposePublishedPort("postgres", 5432),
  }),
  redis: await selectPort({
    key: "REDIS_PORT",
    preferred: numberFromEnv(baseEnv, "REDIS_PORT", defaultPorts.REDIS_PORT),
    reservedPorts,
    existingPort: await getComposePublishedPort("redis", 6379),
  }),
  api: await selectPort({
    key: "API_PORT",
    preferred: numberFromEnv(baseEnv, "API_PORT", defaultPorts.API_PORT),
    reservedPorts,
  }),
  worker: await selectPort({
    key: "WORKER_PORT",
    preferred: numberFromEnv(baseEnv, "WORKER_PORT", defaultPorts.WORKER_PORT),
    reservedPorts,
  }),
  web: await selectPort({
    key: "WEB_PORT",
    preferred: numberFromEnv(baseEnv, "WEB_PORT", defaultPorts.WEB_PORT),
    reservedPorts,
  }),
  console: await selectPort({
    key: "CONSOLE_PORT",
    preferred: numberFromEnv(baseEnv, "CONSOLE_PORT", defaultPorts.CONSOLE_PORT),
    reservedPorts,
  }),
};

const urls = {
  api: `http://localhost:${selected.api.port}`,
  worker: `http://localhost:${selected.worker.port}`,
  web: `http://localhost:${selected.web.port}`,
  console: `http://localhost:${selected.console.port}`,
  postgres: `localhost:${selected.postgres.port}`,
  redis: `localhost:${selected.redis.port}`,
};

const frontendOrigins = [urls.web, urls.console].join(",");
const runtimeEnv = {
  ...baseEnv,
  POSTGRES_PORT: String(selected.postgres.port),
  REDIS_PORT: String(selected.redis.port),
  API_PORT: String(selected.api.port),
  WORKER_PORT: String(selected.worker.port),
  WEB_PORT: String(selected.web.port),
  CONSOLE_PORT: String(selected.console.port),
  DATABASE_URL: databaseUrlForPort(baseEnv, selected.postgres.port),
  REDIS_URL: redisUrlForPort(baseEnv, selected.redis.port),
  VITE_API_URL: urls.api,
  CORS_ORIGINS: frontendOrigins,
  BETTER_AUTH_URL: urls.api,
  BETTER_AUTH_TRUSTED_ORIGINS: frontendOrigins,
};

printPlannedPorts(selected, runtimeEnv);

await startDockerCompose(runtimeEnv);

if (!options.skipBuild) {
  await runStep(
    "Build workspace runtime dependencies",
    pnpmCommand,
    [
      "exec",
      "turbo",
      "run",
      "build",
      "--filter=@corral/config",
      "--filter=@corral/schema",
      "--filter=@corral/db",
    ],
    { env: runtimeEnv },
  );
}

if (!options.skipMigrate) {
  await runStep("Apply database migrations", pnpmCommand, ["db:migrate"], { env: runtimeEnv });
}

const canSeedAdmin = Boolean(
  runtimeEnv.AUTH_BOOTSTRAP_ADMIN_EMAIL && runtimeEnv.AUTH_BOOTSTRAP_ADMIN_PASSWORD,
);

if (!options.skipSeed && canSeedAdmin) {
  await runStep(
    "Seed bootstrap admin",
    pnpmCommand,
    ["--filter", "@corral/api", "auth:seed-admin"],
    { env: runtimeEnv },
  );
}

let shuttingDown = false;

const children = [
  spawnManaged("api", pnpmCommand, ["--filter", "@corral/api", "dev"], runtimeEnv),
  spawnManaged("worker", pnpmCommand, ["--filter", "@corral/worker", "dev"], runtimeEnv),
  spawnManaged(
    "web",
    pnpmCommand,
    [
      "--filter",
      "@corral/web",
      "exec",
      "vite",
      "--port",
      String(selected.web.port),
      "--strictPort",
    ],
    runtimeEnv,
  ),
  spawnManaged(
    "console",
    pnpmCommand,
    [
      "--filter",
      "@corral/console",
      "exec",
      "vite",
      "--port",
      String(selected.console.port),
      "--strictPort",
    ],
    runtimeEnv,
  ),
];

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    console.error(
      `\n${labelFor(child.label)} exited unexpectedly${formatExit(code, signal)}. Stopping the dev stack...`,
    );
    stopChildren(children, child);
    process.exitCode = code ?? 1;
  });
}

printReadySummary({ urls, runtimeEnv, canSeedAdmin, skippedSeed: options.skipSeed });

process.on("SIGINT", () => shutdown("SIGINT", children));
process.on("SIGTERM", () => shutdown("SIGTERM", children));

function parseArgs(args) {
  const parsed = {
    help: false,
    skipBuild: false,
    skipMigrate: false,
    skipSeed: false,
  };

  for (const arg of args) {
    switch (arg) {
      case "--help":
      case "-h":
        parsed.help = true;
        break;
      case "--skip-build":
        parsed.skipBuild = true;
        break;
      case "--skip-migrate":
        parsed.skipMigrate = true;
        break;
      case "--skip-seed":
        parsed.skipSeed = true;
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        printHelp();
        process.exit(1);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Corral dev stack launcher

Usage:
  pnpm dev:stack [options]
  ./scripts/dev-stack.sh [options]

Options:
  --skip-build      Do not build compiled workspace runtime dependencies first.
  --skip-migrate    Do not run pnpm db:migrate before starting apps.
  --skip-seed       Do not run the bootstrap admin seed command.
  -h, --help        Show this help message.

Environment overrides:
  POSTGRES_PORT, REDIS_PORT, API_PORT, WORKER_PORT, WEB_PORT, CONSOLE_PORT
`);
}

function ensureLocalEnv() {
  if (existsSync(envPath)) {
    return;
  }

  if (!existsSync(envExamplePath)) {
    throw new Error("Missing .env and .env.example; cannot create local environment file.");
  }

  copyFileSync(envExamplePath, envPath);
  console.log("Created .env from .env.example for local development.");
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  const env = {};
  const content = readFileSync(filePath, "utf8");

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");

    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function numberFromEnv(env, key, fallback) {
  const value = Number(env[key] ?? fallback);

  if (Number.isInteger(value) && value > 0 && value < 65536) {
    return value;
  }

  return fallback;
}

async function selectPort({ key, preferred, reservedPorts, existingPort }) {
  if (existingPort && !reservedPorts.has(existingPort)) {
    reservedPorts.add(existingPort);
    return {
      key,
      port: existingPort,
      preferred,
      source: "docker-compose",
      shifted: existingPort !== preferred,
    };
  }

  const port = await findAvailablePort(preferred, reservedPorts);
  reservedPorts.add(port);

  return {
    key,
    port,
    preferred,
    source: "probe",
    shifted: port !== preferred,
  };
}

async function findAvailablePort(preferred, reservedPorts) {
  for (let port = preferred; port < 65536; port += 1) {
    if (reservedPorts.has(port)) {
      continue;
    }

    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No available port found at or after ${preferred}.`);
}

function isPortAvailable(port) {
  return new Promise((resolvePort) => {
    const server = createServer();

    server.once("error", () => resolvePort(false));
    server.once("listening", () => {
      server.close(() => resolvePort(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

async function getComposePublishedPort(service, containerPort) {
  const result = await execCapture("docker", ["compose", "port", service, String(containerPort)], {
    allowFailure: true,
  });

  if (result.code !== 0) {
    return undefined;
  }

  return parsePublishedPort(result.stdout);
}

function parsePublishedPort(output) {
  const line = output
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .at(-1);

  if (!line) {
    return undefined;
  }

  const match = line.match(/:(\d+)$/) ?? line.match(/(\d+)$/);
  const port = match ? Number(match[1]) : Number.NaN;

  return Number.isInteger(port) ? port : undefined;
}

function databaseUrlForPort(env, port) {
  const fallback = `postgres://${env.POSTGRES_USER ?? "corral"}:${env.POSTGRES_PASSWORD ?? "corral"}@localhost:${port}/${env.POSTGRES_DB ?? "corral"}`;
  return urlWithPort(env.DATABASE_URL, port, fallback);
}

function redisUrlForPort(env, port) {
  return urlWithPort(env.REDIS_URL, port, `redis://localhost:${port}`);
}

function urlWithPort(value, port, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value);
    url.hostname ||= "localhost";
    url.port = String(port);
    return url.toString();
  } catch {
    return fallback;
  }
}

function printPlannedPorts(selectedPorts, env) {
  console.log("\nCorral dev stack port plan");
  console.log("──────────────────────────");

  for (const [service, info] of Object.entries(selectedPorts)) {
    const serviceLabel = serviceNames[service] ?? service;
    const suffix = info.shifted
      ? `preferred ${info.preferred} was busy; using ${info.port}`
      : `using ${info.port}`;
    const source = info.source === "docker-compose" ? " existing compose mapping" : "";
    console.log(`• ${serviceLabel.padEnd(9)} ${suffix}${source}`);
  }

  console.log(
    `\nPostgres connection: localhost:${selectedPorts.postgres.port}/${env.POSTGRES_DB ?? "corral"}`,
  );
  console.log(`Redis connection:    localhost:${selectedPorts.redis.port}`);
}

async function startDockerCompose(env) {
  const withWait = await runStep(
    "Start Docker Compose infra",
    "docker",
    ["compose", "up", "-d", "--wait"],
    { env, allowFailure: true },
  );

  if (withWait === 0) {
    return;
  }

  console.warn("Docker Compose did not accept or complete --wait; retrying without --wait.");
  await runStep("Start Docker Compose infra", "docker", ["compose", "up", "-d"], { env });
}

function runStep(label, command, args, { env = process.env, allowFailure = false } = {}) {
  console.log(`\n▶ ${label}`);
  console.log(`  ${command} ${args.join(" ")}`);

  return new Promise((resolveStep, rejectStep) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      shell: isWindows,
      stdio: "inherit",
    });

    child.on("error", (error) => {
      if (allowFailure) {
        console.warn(`  ${label} failed to start: ${error.message}`);
        resolveStep(1);
        return;
      }

      rejectStep(error);
    });

    child.on("exit", (code) => {
      if (code === 0 || allowFailure) {
        resolveStep(code ?? 0);
        return;
      }

      rejectStep(new Error(`${label} failed with exit code ${code}.`));
    });
  });
}

function execCapture(command, args, { allowFailure = false } = {}) {
  return new Promise((resolveExec, rejectExec) => {
    execFile(command, args, { cwd: repoRoot, env: process.env }, (error, stdout, stderr) => {
      if (error && !allowFailure) {
        rejectExec(error);
        return;
      }

      resolveExec({
        code: error?.code ?? 0,
        stdout: stdout.toString(),
        stderr: stderr.toString(),
      });
    });
  });
}

function spawnManaged(label, command, args, env) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env,
    shell: isWindows,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.label = label;
  pipeWithPrefix(child.stdout, label, process.stdout);
  pipeWithPrefix(child.stderr, label, process.stderr);

  child.on("error", (error) => {
    console.error(`${labelFor(label)} failed to start: ${error.message}`);
  });

  return child;
}

function pipeWithPrefix(stream, label, output) {
  let buffer = "";

  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      output.write(`${labelFor(label)} ${line}\n`);
    }
  });

  stream.on("end", () => {
    if (buffer) {
      output.write(`${labelFor(label)} ${buffer}\n`);
    }
  });
}

function printReadySummary({ urls: finalUrls, runtimeEnv: env, canSeedAdmin, skippedSeed }) {
  console.log("\nCorral dev stack launching");
  console.log("──────────────────────────");
  console.log(`Web:       ${finalUrls.web}`);
  console.log(`Console:   ${finalUrls.console}`);
  console.log(`API:       ${finalUrls.api}/health`);
  console.log(`Worker:    ${finalUrls.worker}/health`);
  console.log(`Postgres:  ${finalUrls.postgres}`);
  console.log(`Redis:     ${finalUrls.redis}`);

  console.log("\nLogin details");
  console.log("─────────────");

  if (env.AUTH_BOOTSTRAP_ADMIN_EMAIL && env.AUTH_BOOTSTRAP_ADMIN_PASSWORD) {
    console.log(`Console login: ${finalUrls.console}/login`);
    console.log(`Email:         ${env.AUTH_BOOTSTRAP_ADMIN_EMAIL}`);
    console.log(`Password:      ${env.AUTH_BOOTSTRAP_ADMIN_PASSWORD}`);
    console.log(`Seed status:   ${seedStatus(canSeedAdmin, skippedSeed)}`);
  } else {
    console.log("Bootstrap admin credentials are not configured in .env.");
    console.log(
      "Set AUTH_BOOTSTRAP_ADMIN_EMAIL and AUTH_BOOTSTRAP_ADMIN_PASSWORD to print them here.",
    );
  }

  console.log(
    "\nPress Ctrl+C to stop app processes. Docker Compose infra stays up for faster restarts.",
  );
}

function seedStatus(canSeedAdmin, skippedSeed) {
  if (skippedSeed) {
    return "skipped by --skip-seed";
  }

  return canSeedAdmin ? "seed command completed" : "not run";
}

function labelFor(label) {
  return `[${label}]`.padEnd(11);
}

function formatExit(code, signal) {
  if (signal) {
    return ` from signal ${signal}`;
  }

  return ` with exit code ${code}`;
}

function stopChildren(children, except) {
  for (const child of children) {
    if (child === except || child.killed) {
      continue;
    }

    stopChild(child);
  }
}

function stopChild(child) {
  if (isWindows) {
    stopWindowsProcessTree(child);
    return;
  }

  child.kill("SIGTERM");
}

function stopWindowsProcessTree(child) {
  if (!child.pid) {
    return;
  }

  try {
    execFileSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } catch {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

function shutdown(signal, children) {
  console.log(`\nReceived ${signal}. Stopping app processes...`);
  shuttingDown = true;
  stopChildren(children);
  console.log(
    "Docker Compose infra is still running. Use `docker compose down` when you want to stop it.",
  );
  process.exit(0);
}
