import { execFileSync, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const environment = { ...process.env };

if (!environment.SUPABASE_SERVICE_ROLE_KEY) {
  const supabase = resolve("node_modules/.bin/supabase");
  const status = JSON.parse(
    execFileSync(supabase, ["status", "-o", "json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
  environment.SUPABASE_SERVICE_ROLE_KEY = status.SECRET_KEY;
}

if (!environment.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Local Supabase did not report a service-role key.");
}

const playwright = resolve("node_modules/.bin/playwright");
const result = spawnSync(playwright, ["test", ...process.argv.slice(2)], {
  env: environment,
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
