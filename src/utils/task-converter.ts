import type { AsanaTask } from "../types/asana.ts";
import type { GiteaCreateIssueRequest } from "../types/gitea.ts";
import type { UserMapping } from "../types/config.ts";
import { mapAsanaUserToGitea } from "./user-mapping.ts";

/**
 * Converts an Asana task to a Gitea issue request
 */
export function convertTaskToIssue(
  task: AsanaTask,
  userMappings: UserMapping[]
): GiteaCreateIssueRequest {
  // Build the issue body with metadata
  const bodyParts: string[] = [];

  if (task.notes) {
    bodyParts.push(task.notes.trim());
    bodyParts.push("");
  }

  // Add metadata section
  bodyParts.push("---");
  bodyParts.push("### Migration Metadata");
  bodyParts.push(`- **Asana ID**: ${task.gid}`);
  bodyParts.push(`- **Created**: ${task.created_at}`);
  bodyParts.push(`- **Modified**: ${task.modified_at}`);

  if (task.completed_at) {
    bodyParts.push(`- **Completed**: ${task.completed_at}`);
  }

  if (task.assignee) {
    bodyParts.push(`- **Original Assignee**: ${task.assignee.name}`);
  }

  if (task.memberships.length > 0) {
    const section = task.memberships[0].section.name;
    bodyParts.push(`- **Section**: ${section}`);
  }

  if (task.permalink_url) {
    bodyParts.push(`- **[Original Task](${task.permalink_url})**`);
  }

  const body = bodyParts.join("\n");

  // Map assignee
  const assignees: string[] = [];
  const giteaEmail = mapAsanaUserToGitea(task.assignee, userMappings);
  if (giteaEmail) {
    assignees.push(giteaEmail);
  }

  // Convert due date
  let dueDate: string | undefined;
  if (task.due_at) {
    dueDate = task.due_at;
  } else if (task.due_on) {
    dueDate = `${task.due_on}T23:59:59Z`;
  }

  return {
    title: task.name,
    body,
    closed: task.completed,
    assignees: assignees.length > 0 ? assignees : undefined,
    due_date: dueDate,
  };
}

/**
 * Groups tasks by their project section
 */
export function groupTasksBySection(tasks: AsanaTask[]): Map<string, AsanaTask[]> {
  const groups = new Map<string, AsanaTask[]>();

  for (const task of tasks) {
    const section =
      task.memberships.length > 0 ? task.memberships[0].section.name : "Uncategorized";

    if (!groups.has(section)) {
      groups.set(section, []);
    }
    groups.get(section)!.push(task);
  }

  return groups;
}
