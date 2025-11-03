/**
 * Gitea API types
 */

export interface GiteaUser {
  id: number;
  login: string;
  email: string;
  full_name: string;
}

export interface GiteaProject {
  id: number;
  title: string;
  owner: string;
  repo: string;
  type: number;
  created: string;
  updated: string;
}

export interface GiteaCreateProjectRequest {
  title: string;
  body?: string;
}

export interface GiteaIssue {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  created_at: string;
  updated_at: string;
  closed_at?: string;
  assignees?: GiteaUser[];
  labels?: GiteaLabel[];
  due_date?: string;
}

export interface GiteaCreateIssueRequest {
  title: string;
  body?: string;
  assignees?: string[];
  closed?: boolean;
  labels?: number[];
  due_date?: string;
}

export interface GiteaLabel {
  id: number;
  name: string;
  color: string;
  description: string;
}

export interface GiteaCreateLabelRequest {
  name: string;
  color: string;
  description?: string;
}
