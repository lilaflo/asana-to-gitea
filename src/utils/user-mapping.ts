import type { UserMapping } from "../types/config.ts";
import type { AsanaUser } from "../types/asana.ts";

/**
 * Maps an Asana user email to a Gitea user email
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
      return mapping.giteaEmail;
    }
  }

  return undefined;
}

/**
 * Gets the default user mappings
 * Customize this for your team's email mappings
 */
export function getDefaultUserMappings(): UserMapping[] {
  return [
    {
      asanaEmail: "florian@fontrocker.com",
      giteaEmail: "gitea@lale.li",
    },
    {
      asanaEmail: "tommy@fontrocker.com",
      giteaEmail: "tommy@fontrocker.com",
    },
  ];
}
