/**
 * Asana export schema types
 */

export interface AsanaUser {
  gid: string;
  name: string;
  resource_type: "user";
}

export interface AsanaProject {
  gid: string;
  name: string;
  resource_type: "project";
}

export interface AsanaSection {
  gid: string;
  name: string;
  resource_type: "section";
}

export interface AsanaMembership {
  project: AsanaProject;
  section: AsanaSection;
}

export interface AsanaWorkspace {
  gid: string;
  name: string;
  resource_type: "workspace";
}

export interface AsanaTask {
  gid: string;
  actual_time_minutes: number | null;
  assignee: AsanaUser | null;
  assignee_status: string;
  assignee_section?: AsanaSection;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  custom_fields: unknown[];
  due_at: string | null;
  due_on: string | null;
  followers: AsanaUser[];
  hearted: boolean;
  hearts: unknown[];
  liked: boolean;
  likes: unknown[];
  memberships: AsanaMembership[];
  modified_at: string;
  name: string;
  notes: string;
  num_hearts: number;
  num_likes: number;
  parent: string | null;
  permalink_url: string;
  projects: AsanaProject[];
  resource_type: "task";
  start_at: string | null;
  start_on: string | null;
  subtasks: unknown[];
  tags: unknown[];
  resource_subtype: string;
  workspace: AsanaWorkspace;
}

export interface AsanaExport {
  data: AsanaTask[];
}
