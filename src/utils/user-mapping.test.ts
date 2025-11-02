import { describe, test, expect } from "bun:test";
import { mapAsanaUserToGitea, getDefaultUserMappings } from "./user-mapping.ts";
import type { AsanaUser } from "../types/asana.ts";

describe("mapAsanaUserToGitea", () => {
  const mappings = getDefaultUserMappings();

  test("should map florian correctly", () => {
    const asanaUser: AsanaUser = {
      gid: "123",
      name: "Florian Fackler",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBe("gitea@lale.li");
  });

  test("should map tommy correctly", () => {
    const asanaUser: AsanaUser = {
      gid: "456",
      name: "Tommy",
      resource_type: "user",
    };

    const result = mapAsanaUserToGitea(asanaUser, mappings);
    expect(result).toBe("tommy@fontrocker.com");
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
      asanaEmail: "florian@fontrocker.com",
      giteaEmail: "gitea@lale.li",
    });
    expect(mappings[1]).toEqual({
      asanaEmail: "tommy@fontrocker.com",
      giteaEmail: "tommy@fontrocker.com",
    });
  });
});
