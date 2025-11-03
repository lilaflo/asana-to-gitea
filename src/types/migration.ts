/**
 * Migration state tracking types
 */

export interface MigrationTask {
  asanaGid: string;
  giteaIssueNumber: number;
  title: string;
  migratedAt: string;
}

export interface MigrationExport {
  exportFile: string;
  timestamp: string;
  tasks: MigrationTask[];
}

export interface MigrationState {
  version: number;
  exports: MigrationExport[];
}

export interface MigrationStatistics {
  created: number;
  skipped: number;
  failed: number;
}
