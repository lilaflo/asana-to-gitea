import type { UserMapping } from "../types/config.ts";
import type { AsanaUser } from "../types/asana.ts";
import * as path from "path";

/**
 * Maps an Asana user to a Gitea username
 */
export function mapAsanaUserToGitea(
  asanaUser: AsanaUser | null,
  mappings: UserMapping[]
): string | undefined {
  if (!asanaUser) {
    return undefined;
  }

  // Try to find a mapping based on the user's name
  // Since Asana export doesn't include email directly, we'll need to infer from name
  const lowerName = asanaUser.name.toLowerCase();

  for (const mapping of mappings) {
    const asanaEmailPrefix = mapping.asanaEmail.split("@")[0].toLowerCase();
    if (lowerName.includes(asanaEmailPrefix)) {
      return mapping.giteaUsername;
    }
  }

  return undefined;
}

/**
 * Loads user mappings from JSON file
 * @param filePath Path to the user mapping JSON file
 */
export async function loadUserMappings(filePath: string): Promise<UserMapping[]> {
  try {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      throw new Error(`User mapping file not found: ${filePath}`);
    }
    const mappings = await file.json();
    return mappings as UserMapping[];
  } catch (error) {
    throw new Error(`Failed to load user mappings from ${filePath}: ${error}`);
  }
}

/**
 * Gets the default user mappings from usermapping.json
 */
export async function getDefaultUserMappings(): Promise<UserMapping[]> {
  const mappingFile = path.join(process.cwd(), "usermapping.json");
  return loadUserMappings(mappingFile);
}
