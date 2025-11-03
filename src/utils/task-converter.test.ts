import { describe, test, expect } from "bun:test";
import { convertTaskToIssue, groupTasksBySection } from "./task-converter.ts";
import type { AsanaTask } from "../types/asana.ts";
import { loadUserMappings } from "./user-mapping.ts";
import * as path from "path";

describe("convertTaskToIssue", () => {
  test("should convert a basic task", async () => {
    const userMappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );
    const task: AsanaTask = {
      gid: "123",
      name: "Test Task",
      notes: "This is a test task",
      completed: false,
      completed_at: null,
      created_at: "2025-01-01T00:00:00Z",
      modified_at: "2025-01-02T00:00:00Z",
      due_on: "2025-12-31",
      due_at: null,
      assignee: {
        gid: "456",
        name: "User1",
        resource_type: "user",
      },
      assignee_status: "inbox",
      actual_time_minutes: null,
      custom_fields: [],
      followers: [],
      hearted: false,
      hearts: [],
      liked: false,
      likes: [],
      memberships: [
        {
          project: {
            gid: "789",
            name: "Test Project",
            resource_type: "project",
          },
          section: {
            gid: "101",
            name: "In Progress",
            resource_type: "section",
          },
        },
      ],
      num_hearts: 0,
      num_likes: 0,
      parent: null,
      permalink_url: "https://app.asana.com/test",
      projects: [
        {
          gid: "789",
          name: "Test Project",
          resource_type: "project",
        },
      ],
      resource_type: "task",
      start_at: null,
      start_on: null,
      subtasks: [],
      tags: [],
      resource_subtype: "default_task",
      workspace: {
        gid: "999",
        name: "Test Workspace",
        resource_type: "workspace",
      },
    };

    const result = convertTaskToIssue(task, userMappings);

    expect(result.title).toBe("Test Task");
    expect(result.body).toContain("This is a test task");
    expect(result.body).toContain("Asana ID");
    expect(result.body).toContain("User1");
    expect(result.body).toContain("In Progress");
    expect(result.closed).toBe(false);
    expect(result.assignees).toEqual(["user1"]);
    expect(result.due_date).toBe("2025-12-31T23:59:59Z");
  });

  test("should handle completed tasks", async () => {
    const userMappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );
    const task: AsanaTask = {
      gid: "123",
      name: "Completed Task",
      notes: "",
      completed: true,
      completed_at: "2025-01-15T12:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      modified_at: "2025-01-15T12:00:00Z",
      due_on: null,
      due_at: null,
      assignee: null,
      assignee_status: "inbox",
      actual_time_minutes: null,
      custom_fields: [],
      followers: [],
      hearted: false,
      hearts: [],
      liked: false,
      likes: [],
      memberships: [],
      num_hearts: 0,
      num_likes: 0,
      parent: null,
      permalink_url: "",
      projects: [],
      resource_type: "task",
      start_at: null,
      start_on: null,
      subtasks: [],
      tags: [],
      resource_subtype: "default_task",
      workspace: {
        gid: "999",
        name: "Test Workspace",
        resource_type: "workspace",
      },
    };

    const result = convertTaskToIssue(task, userMappings);

    expect(result.closed).toBe(true);
    expect(result.body).toContain("**Completed**: 2025-01-15T12:00:00Z");
    expect(result.assignees).toBeUndefined();
  });
});

describe("groupTasksBySection", () => {
  test("should group tasks by section", () => {
    const tasks = [
      {
        gid: "1",
        name: "Task 1",
        memberships: [
          {
            project: { gid: "p1", name: "Project", resource_type: "project" },
            section: { gid: "s1", name: "Todo", resource_type: "section" },
          },
        ],
      },
      {
        gid: "2",
        name: "Task 2",
        memberships: [
          {
            project: { gid: "p1", name: "Project", resource_type: "project" },
            section: { gid: "s2", name: "In Progress", resource_type: "section" },
          },
        ],
      },
      {
        gid: "3",
        name: "Task 3",
        memberships: [
          {
            project: { gid: "p1", name: "Project", resource_type: "project" },
            section: { gid: "s1", name: "Todo", resource_type: "section" },
          },
        ],
      },
    ] as unknown as AsanaTask[];

    const result = groupTasksBySection(tasks);

    expect(result.size).toBe(2);
    expect(result.get("Todo")).toHaveLength(2);
    expect(result.get("In Progress")).toHaveLength(1);
  });

  test("should handle tasks without memberships", () => {
    const tasks = [
      {
        gid: "1",
        name: "Task 1",
        memberships: [],
      },
    ] as unknown as AsanaTask[];

    const result = groupTasksBySection(tasks);

    expect(result.size).toBe(1);
    expect(result.get("Uncategorized")).toHaveLength(1);
  });
});
