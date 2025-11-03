import { describe, test, expect, afterEach } from "bun:test";
import {
  loadMigrationState,
  saveMigrationState,
  isTaskMigrated,
  findExportData,
  updateExportData,
  addMigratedTask,
} from "./migration-state.ts";
import type { MigrationState, MigrationTask } from "../types/migration.ts";
import * as path from "path";
import { unlink } from "fs/promises";

const TEST_STATE_FILE = path.join(process.cwd(), "migration-state.json");

describe("migration-state", () => {
  afterEach(async () => {
    // Clean up test state file
    try {
      await unlink(TEST_STATE_FILE);
    } catch {
      // File might not exist, ignore
    }
  });

  describe("loadMigrationState", () => {
    test("should return empty state if file doesn't exist", async () => {
      // Ensure file doesn't exist before test
      try {
        await unlink(TEST_STATE_FILE);
      } catch {
        // File might not exist, ignore
      }

      const state = await loadMigrationState();
      expect(state.version).toBe(1);
      expect(state.exports).toEqual([]);
    });

    test("should load existing state from file", async () => {
      const testState: MigrationState = {
        version: 1,
        exports: [
          {
            exportFile: "test.json",
            timestamp: "2025-01-01T00:00:00Z",
            tasks: [
              {
                asanaGid: "123",
                giteaIssueNumber: 1,
                title: "Test Task",
                migratedAt: "2025-01-01T00:00:00Z",
              },
            ],
          },
        ],
      };

      await saveMigrationState(testState);
      const loaded = await loadMigrationState();

      expect(loaded.version).toBe(1);
      expect(loaded.exports).toHaveLength(1);
      expect(loaded.exports[0].exportFile).toBe("test.json");
      expect(loaded.exports[0].tasks).toHaveLength(1);
      expect(loaded.exports[0].tasks[0].asanaGid).toBe("123");
    });
  });

  describe("isTaskMigrated", () => {
    test("should return true if task exists in state", () => {
      const state: MigrationState = {
        version: 1,
        exports: [
          {
            exportFile: "test.json",
            timestamp: "2025-01-01",
            tasks: [
              {
                asanaGid: "123",
                giteaIssueNumber: 1,
                title: "Task 1",
                migratedAt: "2025-01-01",
              },
            ],
          },
        ],
      };

      expect(isTaskMigrated(state, "123")).toBe(true);
    });

    test("should return false if task doesn't exist", () => {
      const state: MigrationState = {
        version: 1,
        exports: [],
      };

      expect(isTaskMigrated(state, "999")).toBe(false);
    });
  });

  describe("findExportData", () => {
    test("should find export by filename", () => {
      const state: MigrationState = {
        version: 1,
        exports: [
          {
            exportFile: "test1.json",
            timestamp: "2025-01-01",
            tasks: [],
          },
          {
            exportFile: "test2.json",
            timestamp: "2025-01-02",
            tasks: [],
          },
        ],
      };

      const result = findExportData(state, "test2.json");
      expect(result).not.toBeUndefined();
      expect(result?.exportFile).toBe("test2.json");
    });

    test("should return undefined if export not found", () => {
      const state: MigrationState = {
        version: 1,
        exports: [],
      };

      const result = findExportData(state, "nonexistent.json");
      expect(result).toBeUndefined();
    });
  });

  describe("updateExportData", () => {
    test("should add new export data", () => {
      const state: MigrationState = {
        version: 1,
        exports: [],
      };

      const tasks: MigrationTask[] = [
        {
          asanaGid: "123",
          giteaIssueNumber: 1,
          title: "Task 1",
          migratedAt: "2025-01-01",
        },
      ];

      updateExportData(state, "new-export.json", tasks);

      expect(state.exports).toHaveLength(1);
      expect(state.exports[0].exportFile).toBe("new-export.json");
      expect(state.exports[0].tasks).toEqual(tasks);
    });

    test("should update existing export data", () => {
      const state: MigrationState = {
        version: 1,
        exports: [
          {
            exportFile: "existing.json",
            timestamp: "2025-01-01",
            tasks: [
              {
                asanaGid: "old",
                giteaIssueNumber: 1,
                title: "Old Task",
                migratedAt: "2025-01-01",
              },
            ],
          },
        ],
      };

      const newTasks: MigrationTask[] = [
        {
          asanaGid: "new",
          giteaIssueNumber: 2,
          title: "New Task",
          migratedAt: "2025-01-02",
        },
      ];

      updateExportData(state, "existing.json", newTasks);

      expect(state.exports).toHaveLength(1);
      expect(state.exports[0].tasks).toEqual(newTasks);
    });
  });

  describe("addMigratedTask", () => {
    test("should add task to new export", () => {
      const state: MigrationState = {
        version: 1,
        exports: [],
      };

      const task: MigrationTask = {
        asanaGid: "123",
        giteaIssueNumber: 1,
        title: "Test Task",
        migratedAt: "2025-01-01",
      };

      addMigratedTask(state, "test.json", task);

      expect(state.exports).toHaveLength(1);
      expect(state.exports[0].exportFile).toBe("test.json");
      expect(state.exports[0].tasks).toHaveLength(1);
      expect(state.exports[0].tasks[0]).toEqual(task);
    });

    test("should add task to existing export", () => {
      const state: MigrationState = {
        version: 1,
        exports: [
          {
            exportFile: "test.json",
            timestamp: "2025-01-01",
            tasks: [
              {
                asanaGid: "111",
                giteaIssueNumber: 1,
                title: "Task 1",
                migratedAt: "2025-01-01",
              },
            ],
          },
        ],
      };

      const newTask: MigrationTask = {
        asanaGid: "222",
        giteaIssueNumber: 2,
        title: "Task 2",
        migratedAt: "2025-01-02",
      };

      addMigratedTask(state, "test.json", newTask);

      expect(state.exports).toHaveLength(1);
      expect(state.exports[0].tasks).toHaveLength(2);
      expect(state.exports[0].tasks[1]).toEqual(newTask);
    });

    test("should update existing task if same Asana GID", () => {
      const state: MigrationState = {
        version: 1,
        exports: [
          {
            exportFile: "test.json",
            timestamp: "2025-01-01",
            tasks: [
              {
                asanaGid: "123",
                giteaIssueNumber: 1,
                title: "Old Title",
                migratedAt: "2025-01-01",
              },
            ],
          },
        ],
      };

      const updatedTask: MigrationTask = {
        asanaGid: "123",
        giteaIssueNumber: 1,
        title: "Updated Title",
        migratedAt: "2025-01-02",
      };

      addMigratedTask(state, "test.json", updatedTask);

      expect(state.exports[0].tasks).toHaveLength(1);
      expect(state.exports[0].tasks[0].title).toBe("Updated Title");
    });
  });
});
