import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const testsDirectory = join(process.cwd(), "supabase", "tests", "database");
const container =
  process.env.SUPABASE_DB_CONTAINER ?? "supabase_db_score-signals";
const testFiles = readdirSync(testsDirectory)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (testFiles.length === 0) {
  throw new Error("No database tests were found.");
}

for (const file of testFiles) {
  const sql = readFileSync(join(testsDirectory, file), "utf8");
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      container,
      "psql",
      "--username",
      "postgres",
      "--dbname",
      "postgres",
      "--no-psqlrc",
      "--set",
      "ON_ERROR_STOP=1",
    ],
    {
      encoding: "utf8",
      input: sql,
    },
  );
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

  process.stdout.write(output);

  if (result.status !== 0) {
    throw new Error(`Database test ${file} exited with ${result.status}.`);
  }

  if (!/\b1\.\.\d+\b/.test(output)) {
    throw new Error(`Database test ${file} did not emit a pgTAP plan.`);
  }

  if (/\bnot ok \d+\b/.test(output)) {
    throw new Error(`Database test ${file} reported a failed assertion.`);
  }

  process.stdout.write(`PASS ${file}\n`);
}
