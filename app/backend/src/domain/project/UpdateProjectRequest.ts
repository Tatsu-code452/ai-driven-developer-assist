export interface UpdateProjectRequest {
  name: string;
  description?: string;
  status:
    | "PLANNING"
    | "ACTIVE"
    | "SUSPENDED"
    | "COMPLETED"
    | "ARCHIVED";
  rootPath: string;
}
