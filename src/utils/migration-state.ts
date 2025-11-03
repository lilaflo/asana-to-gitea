import type { MigrationState, MigrationExport, MigrationTask } from "../types/migration.ts";
import * as path from "path";

const STATE_FILE = "migration-state.json";
const STATE_VERSION = 1;

/**
 * Load migration state from disk
 */
export async function loadMigrationState(): Promise<MigrationState> {
  const statePath = path.join(process.cwd(), STATE_FILE);
  const file = Bun.file(statePath);

  if (!(await file.exists())) {
    return {
      version: STATE_VERSION,
      exports: [],
    };
  }

  try {
    const state = (await file.json()) as MigrationState;
    return state;
  } catch (error) {
    console.error(`Failed to load migration state from ${statePath}:`, error);
    return {
      version: STATE_VERSION,
      exports: [],
    };
  }
}

/**
 * Save migration state to disk
 */
export async function saveMigrationState(state: MigrationState): Promise<void> {
  const statePath = path.join(process.cwd(), STATE_FILE);

  try {
    await Bun.write(statePath, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error(`Failed to save migration state to ${statePath}:`, error);
    throw error;
  }
}

/**
 * Check if a task has been migrated (by Asana GID)
 */
export function isTaskMigrated(state: MigrationState, asanaGid: string): boolean {
  for (const exportData of state.exports) {
    if (exportData.tasks.some((task) => task.asanaGid === asanaGid)) {
      return true;
    }
  }
  return false;
}

/**
 * Find export data for a specific export file
 */
export function findExportData(
  state: MigrationState,
  exportFile: string
): MigrationExport | undefined {
  return state.exports.find((exp) => exp.exportFile === exportFile);
}

/**
 * Add or update export data in state
 */
export function updateExportData(
  state: MigrationState,
  exportFile: string,
  tasks: MigrationTask[]
): void {
  const timestamp = new Date().toISOString();
  const existingIndex = state.exports.findIndex((exp) => exp.exportFile === exportFile);

  const exportData: MigrationExport = {
    exportFile,
    timestamp,
    tasks,
  };

  if (existingIndex >= 0) {
    state.exports[existingIndex] = exportData;
  } else {
    state.exports.push(exportData);
  }
}

/**
 * Add a single migrated task to the state
 */
export function addMigratedTask(
  state: MigrationState,
  exportFile: string,
  task: MigrationTask
): void {
  let exportData = findExportData(state, exportFile);

  if (!exportData) {
    exportData = {
      exportFile,
      timestamp: new Date().toISOString(),
      tasks: [],
    };
    state.exports.push(exportData);
  }

  // Check if task already exists
  const existingIndex = exportData.tasks.findIndex((t) => t.asanaGid === task.asanaGid);

  if (existingIndex >= 0) {
    exportData.tasks[existingIndex] = task;
  } else {
    exportData.tasks.push(task);
  }

  // Update timestamp
  exportData.timestamp = new Date().toISOString();
}
