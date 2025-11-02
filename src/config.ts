import type { Config } from "./types/config.ts";
import { getDefaultUserMappings } from "./utils/user-mapping.ts";
import * as path from "path";

/**
 * Load configuration from environment variables
 */
export function loadConfig(): Config {
  const giteaToken = process.env.GITEA_TOKEN;

  if (!giteaToken) {
    throw new Error(
      "GITEA_TOKEN environment variable is required. Please set it to your Gitea API token."
    );
  }

  return {
    giteaUrl: process.env.GITEA_URL || "https://git.example.com",
    giteaToken,
    repoOwner: process.env.GITEA_OWNER || "your-org",
    repoName: process.env.GITEA_REPO || "your-repo",
    userMappings: getDefaultUserMappings(),
    exportsDir: path.join(process.cwd(), "exports"),
  };
}
