import type { GiteaIssue } from "../types/gitea.ts";

/**
 * Extract Asana task ID from Gitea issue body
 * Looks for pattern: **Asana ID**: 1234567890123456
 */
export function extractAsanaIdFromIssueBody(body: string): string | null {
  const pattern = /\*\*Asana ID\*\*:\s*(\d+)/;
  const match = body.match(pattern);
  return match ? match[1] : null;
}

/**
 * Build a Set of all Asana IDs found in existing Gitea issues
 */
export function buildExistingAsanaIdsSet(issues: GiteaIssue[]): Set<string> {
  const asanaIds = new Set<string>();

  for (const issue of issues) {
    if (issue.body) {
      const asanaId = extractAsanaIdFromIssueBody(issue.body);
      if (asanaId) {
        asanaIds.add(asanaId);
      }
    }
  }

  return asanaIds;
}

/**
 * Find Gitea issue by Asana ID
 */
export function findIssueByAsanaId(issues: GiteaIssue[], asanaId: string): GiteaIssue | null {
  for (const issue of issues) {
    if (issue.body) {
      const extractedId = extractAsanaIdFromIssueBody(issue.body);
      if (extractedId === asanaId) {
        return issue;
      }
    }
  }
  return null;
}
