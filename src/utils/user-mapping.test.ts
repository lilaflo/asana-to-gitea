import { describe, test, expect } from "bun:test";
import { mapAsanaUserToGitea, loadUserMappings } from "./user-mapping.ts";
import type { AsanaUser } from "../types/asana.ts";
import * as path from "path";

describe("mapAsanaUserToGitea", () => {
  test("should map user1 correctly", async () => {
    const mappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );
    const asanaUser: AsanaUser = {
      gid: "123",
      name: "User1",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBe("user1@gitea.com");
  });

  test("should map user2 correctly", async () => {
    const mappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );
    const asanaUser: AsanaUser = {
      gid: "456",
      name: "User2",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBe("user2@gitea.com");
  });

  test("should return undefined for null user", async () => {
    const mappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );
    const result = mapAsanaUserToGitea(null, mappings);
    expect(result).toBeUndefined();
  });

  test("should return undefined for unmapped user", async () => {
    const mappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );
    const asanaUser: AsanaUser = {
      gid: "789",
      name: "Unknown User",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBeUndefined();
  });
});

describe("loadUserMappings", () => {
  test("should load mappings from example file", async () => {
    const mappings = await loadUserMappings(
      path.join(process.cwd(), "usermapping.example.json")
    );

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
