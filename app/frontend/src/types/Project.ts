export type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "SUSPENDED"
  | "COMPLETED"
  | "ARCHIVED";

export interface Project extends Record<string, unknown> {

  id: string;

  name: string;

  description?: string;

  status: ProjectStatus;

  rootPath: string;

  createdAt: string;

  updatedAt: string;
}
