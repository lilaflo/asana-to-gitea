import { describe, test, expect } from "bun:test";
import {
  extractAsanaIdFromIssueBody,
  buildExistingAsanaIdsSet,
  findIssueByAsanaId,
} from "./duplicate-detector.ts";
import type { GiteaIssue } from "../types/gitea.ts";

describe("extractAsanaIdFromIssueBody", () => {
  test("should extract Asana ID from valid markdown", () => {
    const body = `
## Task Description
This is a task description.

---
### Migration Metadata
- **Asana ID**: 1234567890123456
- **Created**: 2025-01-01T00:00:00Z
`;
    const result = extractAsanaIdFromIssueBody(body);
    expect(result).toBe("1234567890123456");
  });

  test("should return null if no Asana ID found", () => {
    const body = "This is a regular issue body without Asana metadata.";
    const result = extractAsanaIdFromIssueBody(body);
    expect(result).toBeNull();
  });

  test("should handle empty body", () => {
    const result = extractAsanaIdFromIssueBody("");
    expect(result).toBeNull();
  });

  test("should extract from body with different spacing", () => {
    const body = "**Asana ID**:   9876543210";
    const result = extractAsanaIdFromIssueBody(body);
    expect(result).toBe("9876543210");
  });
});

describe("buildExistingAsanaIdsSet", () => {
  test("should build set from multiple issues", () => {
    const issues: GiteaIssue[] = [
      {
        id: 1,
        number: 1,
        title: "Issue 1",
        body: "**Asana ID**: 111",
        state: "open",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      },
      {
        id: 2,
        number: 2,
        title: "Issue 2",
        body: "**Asana ID**: 222",
        state: "open",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      },
      {
        id: 3,
        number: 3,
        title: "Issue 3",
        body: "No Asana ID here",
        state: "open",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      },
    ];

    const result = buildExistingAsanaIdsSet(issues);

    expect(result.size).toBe(2);
    expect(result.has("111")).toBe(true);
    expect(result.has("222")).toBe(true);
    expect(result.has("333")).toBe(false);
  });

  test("should handle empty issue list", () => {
    const result = buildExistingAsanaIdsSet([]);
    expect(result.size).toBe(0);
  });

  test("should skip issues without body", () => {
    const issues: GiteaIssue[] = [
      {
        id: 1,
        number: 1,
        title: "Issue without body",
        body: "",
        state: "open",
        created_at: "2025-01-01",
        updated_at: "2025-01-01",
      },
    ];

    const result = buildExistingAsanaIdsSet(issues);
    expect(result.size).toBe(0);
  });
});

describe("findIssueByAsanaId", () => {
  const issues: GiteaIssue[] = [
    {
      id: 1,
      number: 10,
      title: "First Issue",
      body: "**Asana ID**: 111",
      state: "open",
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
    },
    {
      id: 2,
      number: 20,
      title: "Second Issue",
      body: "**Asana ID**: 222",
      state: "closed",
      created_at: "2025-01-01",
      updated_at: "2025-01-01",
    },
  ];

  test("should find issue by Asana ID", () => {
    const result = findIssueByAsanaId(issues, "111");
    expect(result).not.toBeNull();
    expect(result?.number).toBe(10);
    expect(result?.title).toBe("First Issue");
  });

  test("should return null if issue not found", () => {
    const result = findIssueByAsanaId(issues, "999");
    expect(result).toBeNull();
  });

  test("should return null for empty issue list", () => {
    const result = findIssueByAsanaId([], "111");
    expect(result).toBeNull();
  });
});
