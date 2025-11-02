import { describe, test, expect } from "bun:test";
import { mapAsanaUserToGitea, getDefaultUserMappings } from "./user-mapping.ts";
import type { AsanaUser } from "../types/asana.ts";

describe("mapAsanaUserToGitea", () => {
  const mappings = getDefaultUserMappings();

  test("should map user1 correctly", () => {
    const asanaUser: AsanaUser = {
      gid: "123",
      name: "User1 Name",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBe("user1@gitea.com");
  });

  test("should map user2 correctly", () => {
    const asanaUser: AsanaUser = {
      gid: "456",
      name: "User2 Name",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBe("user2@gitea.com");
  });

  test("should return undefined for null user", () => {
    const result = mapAsanaUserToGitea(null, mappings);
    expect(result).toBeUndefined();
  });

  test("should return undefined for unmapped user", () => {
    const asanaUser: AsanaUser = {
      gid: "789",
      name: "Unknown User",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBeUndefined();
  });
});

describe("getDefaultUserMappings", () => {
  test("should return correct default mappings", () => {
    const mappings = getDefaultUserMappings();

    expect(mappings).toHaveLength(2);
    expect(mappings[0]).toEqual({
      asanaEmail: "user1@asana.com",
      giteaEmail: "user1@gitea.com",
    });
    expect(mappings[1]).toEqual({
      asanaEmail: "user2@asana.com",
      giteaEmail: "user2@gitea.com",
    });
  });
});
