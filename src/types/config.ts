/**
 * Configuration types
 */

export interface UserMapping {
  asanaEmail: string;
  giteaUsername: string;
}

export interface Config {
  giteaUrl: string;
  giteaToken: string;
  repoOwner: string;
  repoName: string;
  userMappings: UserMapping[];
  exportsDir: string;
}
