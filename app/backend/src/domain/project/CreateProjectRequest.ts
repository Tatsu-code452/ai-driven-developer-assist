export interface CreateProjectRequest {
  name: string;
  description?: string;
  status: "PLANNING";
  rootPath: string;
}
