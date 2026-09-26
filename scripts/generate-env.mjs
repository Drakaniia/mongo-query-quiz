#!/usr/bin/env node
/**
 * Generates the type-safe `env.ts` accessors for every workspace that owns a `.env.schema`.
 *
 * We call Varlock's Node API directly instead of shelling out to `varlock codegen`: the CLI ends
 * with a forced `process.exit()`, which on Windows trips a libuv teardown assertion
 * (`Assertion failed: !(handle->flags & UV_HANDLE_CLOSING), file src\win\async.c, line 76`) and
 * reports exit code 0xc0000409 even when generation succeeded. That made `postinstall` — and
 * therefore `pnpm install` and `pnpm run dev` — fail on Windows. Running the same generation
 * in-process exits cleanly on every platform.
 */
import { internal } from "varlock";

// Keep in sync with the workspaces whose `.env.schema` declares `@generateTsTypes`. Pass explicit
// paths (e.g. `node scripts/generate-env.mjs ./apps/web/`) to generate for a single workspace.
const SCHEMA_DIRS = process.argv.slice(2);
if (SCHEMA_DIRS.length === 0) SCHEMA_DIRS.push("./apps/web/", "./apps/server/", "./packages/db/");

async function generate(dir) {
  const envGraph = await internal.loadVarlockEnvGraph({ entryFilePaths: [dir] });

  const schemaErrors = envGraph.sortedDataSources.flatMap((source) =>
    (source.errors ?? []).filter((error) => !error.isWarning),
  );
  if (schemaErrors.length > 0) {
    for (const error of schemaErrors) console.error(`  - ❌ ${error.message}`);
    throw new Error(`Schema error(s) in ${dir}`);
  }

  if (Object.keys(envGraph.configSchema).length === 0) {
    throw new Error(
      `No config items found in ${dir} — add a .env.schema file, or drop the directory from SCHEMA_DIRS.`,
    );
  }

  const { generatedCount, skippedImportOnlyCount } = await envGraph.runCodeGeneratorsIfNeeded({
    ignoreAutoFalse: true,
  });

  if (generatedCount === 0) {
    if (skippedImportOnlyCount > 0) {
      throw new Error(
        `Code-generation decorators in ${dir} were found only in imported files. Add \`executeWhenImported=true\` to the decorator in the imported file, or add a decorator to this schema directly.`,
      );
    }
    throw new Error(
      `No code-generation decorator found in ${dir}. Add \`@generateTsTypes(path=env.ts)\` (or another generator) to the .env.schema file.`,
    );
  }

  console.log(`✅ Generated ${generatedCount} env file(s) for ${dir}`);
}

let failed = false;
for (const dir of SCHEMA_DIRS) {
  try {
    await generate(dir);
  } catch (error) {
    failed = true;
    console.error(`🚨 ${error.message}`);
  }
}

if (failed) {
  process.exitCode = 1;
} else {
  console.log("✅ Code generated successfully");
}
