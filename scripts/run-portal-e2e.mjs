import { spawnSync } from "node:child_process";

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const requestedPort = process.env.PORTAL_E2E_PORT;
const portalE2EPort =
  requestedPort && /^\d{2,5}$/.test(requestedPort) ? requestedPort : "3000";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    env: options.env ?? process.env,
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    if (options.capture) {
      process.stderr.write(result.stderr ?? "");
    }
    process.exit(result.status ?? 1);
  }
  return result.stdout ?? "";
}

run(npxCommand, ["supabase", "db", "reset"]);

const statusOutput = run(
  npxCommand,
  ["supabase", "status", "-o", "env"],
  { capture: true }
);
const localEnv = Object.fromEntries(
  statusOutput
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z0-9_]+)=["']?([^"']*)["']?$/))
    .filter(Boolean)
    .map((match) => [match[1], match[2]])
);

for (const key of ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"]) {
  if (!localEnv[key]) {
    throw new Error(`Supabase local status did not provide ${key}`);
  }
}

run(
  npxCommand,
  [
    "playwright",
    "test",
    "tests/e2e/portal-workflow.spec.ts",
    "tests/e2e/portal-social-preview.spec.ts",
    "tests/e2e/pwa.spec.ts",
    "--project=e2e",
    "--workers=4",
  ],
  {
    env: {
      ...process.env,
      PORTAL_E2E: "1",
      NEXT_PUBLIC_SUPABASE_URL: localEnv.API_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: localEnv.ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: localEnv.SERVICE_ROLE_KEY,
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${portalE2EPort}`,
      PORTAL_E2E_PORT: portalE2EPort,
      SYSTEMIZE_OWNER_GMAIL: "e2e.owner@gmail.com",
    },
  }
);
