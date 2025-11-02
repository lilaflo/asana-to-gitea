#!/usr/bin/env bun

import { AsanaToGiteaMigrator } from "./migrator.ts";
import { loadConfig } from "./config.ts";

async function main() {
  console.debug("=== Asana to Gitea Migration Tool ===\n");

  try {
    // Load configuration
    const config = await loadConfig();
    console.debug(`Target: ${config.giteaUrl}/${config.repoOwner}/${config.repoName}`);
    console.debug(`Exports directory: ${config.exportsDir}\n`);

    // Create migrator
    const migrator = new AsanaToGiteaMigrator(config);

    // Run migration
    await migrator.migrateAll();
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
}

main();
