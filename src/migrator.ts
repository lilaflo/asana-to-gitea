import { GiteaClient } from "./gitea/client.ts";
import type { AsanaExport, AsanaTask } from "./types/asana.ts";
import type { Config } from "./types/config.ts";
import { convertTaskToIssue, groupTasksBySection } from "./utils/task-converter.ts";
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
  async migrateExport(filePath: string): Promise<void> {
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

    // Try to create project board (may not be supported in all Gitea versions)
    try {
      const project = await this.client.createProject({
        title: projectName,
        body: `Migrated from Asana export: ${path.basename(filePath)}`,
      });
      console.debug(`Created project board: ${project.title}`);
    } catch (error) {
      console.debug(
        `Note: Could not create project board (may not be supported). Issues will be labeled with project name.`
      );
    }

    // Group tasks by section
    const tasksBySection = groupTasksBySection(tasks);
    console.debug(`Found ${tasksBySection.size} sections`);

    // Create labels for each section and for the project
    const sectionLabels = new Map<string, number>();
    let projectLabelId: number | undefined;

    // Get or create project label
    try {
      projectLabelId = await this.createSectionLabel(`Project: ${projectName}`);
    } catch (error) {
      console.debug(`Could not create project label`);
    }

    for (const sectionName of tasksBySection.keys()) {
      try {
        const labelId = await this.createSectionLabel(sectionName);
        sectionLabels.set(sectionName, labelId);
      } catch (error) {
        console.error(`Failed to create section label:`, error);
      }
    }

    // Migrate tasks as issues
    let successCount = 0;
    let failureCount = 0;

    for (const [sectionName, sectionTasks] of tasksBySection) {
      console.debug(`\nMigrating section: ${sectionName} (${sectionTasks.length} tasks)`);

      for (const task of sectionTasks) {
        try {
          const issueRequest = convertTaskToIssue(task, this.config.userMappings);

          // Add section label and project label
          const labels: number[] = [];
          const sectionLabelId = sectionLabels.get(sectionName);
          if (sectionLabelId) {
            labels.push(sectionLabelId);
          }
          if (projectLabelId) {
            labels.push(projectLabelId);
          }
          if (labels.length > 0) {
            issueRequest.labels = labels;
          }

          const issue = await this.client.createIssue(issueRequest);
          console.debug(`  ✓ Created issue #${issue.number}: ${issue.title}`);
          successCount++;

          // Rate limiting - wait a bit between requests
          await Bun.sleep(100);
        } catch (error) {
          console.error(`  ✗ Failed to create issue for task ${task.name}:`, error);
          failureCount++;
        }
      }
    }

    console.debug(`\nMigration complete: ${successCount} succeeded, ${failureCount} failed`);
  }

  /**
   * Migrate all exports
   */
  async migrateAll(): Promise<void> {
    const files = await this.getExportFiles();
    console.debug(`Found ${files.length} export files\n`);

    for (const file of files) {
      await this.migrateExport(file);
    }

    console.debug("\n✓ All migrations complete!");
  }
}
