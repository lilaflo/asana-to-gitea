import { GiteaClient } from "./gitea/client.ts";
import type { AsanaExport, AsanaTask } from "./types/asana.ts";
import type { Config } from "./types/config.ts";
import type { MigrationState, MigrationTask } from "./types/migration.ts";
import { convertTaskToIssue, groupTasksBySection } from "./utils/task-converter.ts";
import {
  loadMigrationState,
  saveMigrationState,
  isTaskMigrated,
  addMigratedTask,
} from "./utils/migration-state.ts";
import { buildExistingAsanaIdsSet } from "./utils/duplicate-detector.ts";
import * as path from "path";

export class AsanaToGiteaMigrator {
  private client: GiteaClient;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new GiteaClient(
      config.giteaUrl,
      config.giteaToken,
      config.repoOwner,
      config.repoName
    );
  }

  /**
   * Load an Asana export JSON file
   */
  private async loadExport(filePath: string): Promise<AsanaExport> {
    const file = Bun.file(filePath);
    const json = await file.json();
    return json as AsanaExport;
  }

  /**
   * Get all export files from the exports directory
   */
  async getExportFiles(): Promise<string[]> {
    const files: string[] = [];
    const exportsDir = this.config.exportsDir;

    const dir = Bun.file(exportsDir);

    // Read directory using Node.js fs API available in Bun
    const { readdir } = await import("fs/promises");
    const entries = await readdir(exportsDir);

    for (const entry of entries) {
      if (entry.endsWith(".json")) {
        files.push(path.join(exportsDir, entry));
      }
    }

    return files;
  }

  /**
   * Create a project label for categorizing issues by section
   */
  private async createSectionLabel(sectionName: string): Promise<number> {
    try {
      const existingLabels = await this.client.getLabels();
      const existing = existingLabels.find((l) => l.name === sectionName);

      if (existing) {
        console.debug(`Label "${sectionName}" already exists`);
        return existing.id;
      }

      const label = await this.client.createLabel({
        name: sectionName,
        color: this.generateColorForSection(sectionName),
        description: `Tasks from Asana section: ${sectionName}`,
      });

      console.debug(`Created label: ${sectionName}`);
      return label.id;
    } catch (error) {
      console.error(`Failed to create label ${sectionName}:`, error);
      throw error;
    }
  }

  /**
   * Generate a consistent color for a section name
   */
  private generateColorForSection(sectionName: string): string {
    const colors = [
      "5319e7", // purple
      "0075ca", // blue
      "008672", // teal
      "d73a4a", // red
      "cfd3d7", // gray
      "a2eeef", // light blue
      "7057ff", // indigo
      "d876e3", // pink
      "008b02", // green
      "e99695", // light red
    ];

    // Simple hash to generate consistent color
    let hash = 0;
    for (let i = 0; i < sectionName.length; i++) {
      hash = sectionName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * Migrate a single export file to a Gitea project
   */
  async migrateExport(filePath: string, migrationState: MigrationState): Promise<void> {
    console.debug(`\nMigrating: ${filePath}`);

    // Load the export
    const asanaExport = await this.loadExport(filePath);
    const tasks = asanaExport.data;

    if (tasks.length === 0) {
      console.debug("No tasks found in export, skipping");
      return;
    }

    // Get project name from first task
    const projectName = tasks[0].projects[0]?.name || path.basename(filePath, ".json");

    console.debug(`Project: ${projectName} (${tasks.length} tasks)`);

    // Load existing issues from Gitea to check for duplicates
    console.debug("Checking for existing issues...");
    const existingIssues = await this.client.getIssues("all");
    const existingAsanaIds = buildExistingAsanaIdsSet(existingIssues);
    console.debug(`Found ${existingAsanaIds.size} previously migrated tasks in Gitea`);

    // Group tasks by section
    const tasksBySection = groupTasksBySection(tasks);
    console.debug(`Found ${tasksBySection.size} sections`);

    // Create "asana" label for all imported issues
    let asanaLabelId: number | undefined;
    try {
      const existingLabels = await this.client.getLabels();
      const asanaLabel = existingLabels.find((l) => l.name === "asana");

      if (asanaLabel) {
        asanaLabelId = asanaLabel.id;
        console.debug('Label "asana" already exists');
      } else {
        const label = await this.client.createLabel({
          name: "asana",
          color: "1d76db",
          description: "Imported from Asana",
        });
        asanaLabelId = label.id;
        console.debug('Created label "asana"');
      }
    } catch (error) {
      console.error("Failed to create asana label:", error);
    }

    // Create "Project: <NAME>" label
    let projectLabelId: number | undefined;
    try {
      const projectLabelName = `Project: ${projectName}`;
      const existingLabels = await this.client.getLabels();
      const projectLabel = existingLabels.find((l) => l.name === projectLabelName);

      if (projectLabel) {
        projectLabelId = projectLabel.id;
        console.debug(`Label "${projectLabelName}" already exists`);
      } else {
        const label = await this.client.createLabel({
          name: projectLabelName,
          color: "0e8a16",
          description: `Tasks from Asana project: ${projectName}`,
        });
        projectLabelId = label.id;
        console.debug(`Created label "${projectLabelName}"`);
      }
    } catch (error) {
      console.error(`Failed to create project label for ${projectName}:`, error);
    }

    // Create labels for each section (skip generic/untitled sections)
    const sectionLabelMap = new Map<string, number>();
    const skipSectionLabels = ["Untitled section", "Uncategorized", "(no section)"];

    for (const sectionName of tasksBySection.keys()) {
      // Skip creating labels for generic section names
      if (skipSectionLabels.includes(sectionName)) {
        console.debug(`Skipping label creation for generic section: ${sectionName}`);
        continue;
      }

      try {
        const labelId = await this.createSectionLabel(sectionName);
        sectionLabelMap.set(sectionName, labelId);
      } catch (error) {
        console.error(`Failed to create label for section ${sectionName}:`, error);
      }
    }

    // Migrate tasks as issues
    let successCount = 0;
    let failureCount = 0;
    let skipCount = 0;

    for (const [sectionName, sectionTasks] of tasksBySection) {
      console.debug(`\nMigrating section: ${sectionName} (${sectionTasks.length} tasks)`);
      const sectionLabelId = sectionLabelMap.get(sectionName);

      for (const task of sectionTasks) {
        // Check if task already migrated (state file check - fast)
        if (isTaskMigrated(migrationState, task.gid)) {
          console.debug(`  ⊘ Skipped (in state): ${task.name}`);
          skipCount++;
          continue;
        }

        // Check if task exists in Gitea (body parsing check - reliable)
        if (existingAsanaIds.has(task.gid)) {
          console.debug(`  ⊘ Skipped (in Gitea): ${task.name}`);
          skipCount++;

          // Update state to include this task for future runs
          const existingIssue = existingIssues.find((issue) => {
            const asanaId = issue.body?.match(/\*\*Asana ID\*\*:\s*(\d+)/)?.[1];
            return asanaId === task.gid;
          });

          if (existingIssue) {
            addMigratedTask(migrationState, path.basename(filePath), {
              asanaGid: task.gid,
              giteaIssueNumber: existingIssue.number,
              title: task.name,
              migratedAt: new Date().toISOString(),
            });
          }
          continue;
        }

        // Create new issue
        try {
          const issueRequest = convertTaskToIssue(task, this.config.userMappings);

          // Initialize labels array
          issueRequest.labels = issueRequest.labels || [];

          // Add "asana" label
          if (asanaLabelId) {
            issueRequest.labels.push(asanaLabelId);
          }

          // Add "Project: <NAME>" label
          if (projectLabelId) {
            issueRequest.labels.push(projectLabelId);
          }

          // Add section label for filtering
          if (sectionLabelId) {
            issueRequest.labels.push(sectionLabelId);
          }

          let issue;
          try {
            issue = await this.client.createIssue(issueRequest);
          } catch (error) {
            // If assignee doesn't exist, retry without assignee
            if (
              error instanceof Error &&
              error.message.includes("Assignee does not exist")
            ) {
              console.debug(
                `  ⚠ Assignee not found for task "${task.name}", creating issue without assignee`
              );
              issueRequest.assignees = undefined;
              issue = await this.client.createIssue(issueRequest);
            } else {
              throw error;
            }
          }

          console.debug(`  ✓ Created issue #${issue.number}: ${issue.title}`);
          successCount++;

          // Add to migration state
          addMigratedTask(migrationState, path.basename(filePath), {
            asanaGid: task.gid,
            giteaIssueNumber: issue.number,
            title: task.name,
            migratedAt: new Date().toISOString(),
          });

          // Save state after each successful creation (for crash recovery)
          await saveMigrationState(migrationState);

          // Rate limiting - wait a bit between requests
          await Bun.sleep(100);
        } catch (error) {
          console.error(`  ✗ Failed to create issue for task ${task.name}:`, error);
          failureCount++;
        }
      }
    }

    console.debug(
      `\nMigration complete: ${successCount} created, ${skipCount} skipped, ${failureCount} failed`
    );
  }

  /**
   * Migrate all exports
   */
  async migrateAll(): Promise<void> {
    // Load migration state
    const migrationState = await loadMigrationState();
    console.debug(`Loaded migration state (${migrationState.exports.length} previous exports)`);

    const files = await this.getExportFiles();
    console.debug(`Found ${files.length} export files\n`);

    for (const file of files) {
      await this.migrateExport(file, migrationState);
    }

    // Save final state
    await saveMigrationState(migrationState);

    console.debug("\n✓ All migrations complete!");
  }
}
