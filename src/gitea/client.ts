import type {
  GiteaProject,
  GiteaCreateProjectRequest,
  GiteaIssue,
  GiteaCreateIssueRequest,
  GiteaLabel,
  GiteaCreateLabelRequest,
} from "../types/gitea.ts";

export class GiteaClient {
  private baseUrl: string;
  private token: string;
  private owner: string;
  private repo: string;

  constructor(baseUrl: string, token: string, owner: string, repo: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers = {
      Authorization: `token ${this.token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    console.debug(`Gitea API request: ${options.method || "GET"} ${url}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gitea API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Create a new project board in the repository
   */
  async createProject(data: GiteaCreateProjectRequest): Promise<GiteaProject> {
    return this.request<GiteaProject>(`/repos/${this.owner}/${this.repo}/projects`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all projects in the repository
   */
  async getProjects(): Promise<GiteaProject[]> {
    return this.request<GiteaProject[]>(`/repos/${this.owner}/${this.repo}/projects`);
  }

  /**
   * Create a new issue in the repository
   */
  async createIssue(data: GiteaCreateIssueRequest): Promise<GiteaIssue> {
    return this.request<GiteaIssue>(`/repos/${this.owner}/${this.repo}/issues`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all issues in the repository
   */
  async getIssues(state: "open" | "closed" | "all" = "all"): Promise<GiteaIssue[]> {
    return this.request<GiteaIssue[]>(`/repos/${this.owner}/${this.repo}/issues?state=${state}`);
  }

  /**
   * Create a new label in the repository
   */
  async createLabel(data: GiteaCreateLabelRequest): Promise<GiteaLabel> {
    return this.request<GiteaLabel>(`/repos/${this.owner}/${this.repo}/labels`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all labels in the repository
   */
  async getLabels(): Promise<GiteaLabel[]> {
    return this.request<GiteaLabel[]>(`/repos/${this.owner}/${this.repo}/labels`);
  }
}
