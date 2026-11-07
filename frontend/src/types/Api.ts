export type ItemsResponse<T> = {
  success: boolean;
  items: T[];
};

export type ItemResponse<T> = {
  success: boolean;
  item: T;
};

export type PagedItemsResponse<T> = {
  success: boolean;
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  taskCount: number;
  documentCount: number;
};

export type ProjectInput = Pick<Project, "name" | "description" | "status">;

export type Task = {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  source: string;
};

export type GeneratedDocument = {
  id: string;
  projectId?: string;
  title: string;
  type: string;
  path: string;
  source: string;
};

export type Context = {
  id: string;
  title: string;
  type: string;
  description: string;
  status: string;
  taskIds: string[];
  documentIds: string[];
  issueIds: string[];
  qaIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type TraceabilityItem = {
  sourceId: string;
  targetId: string;
  relationType: string;
};

export type TraceabilityMatrixItem = {
  source: string;
  target: string;
  relation: string;
};

export type DashboardData = {
  success: boolean;
  summary: {
    taskCount: number;
    completedTaskCount: number;
    documentCount: number;
    progress: number;
  };
  latestTasks: Task[];
  latestDocuments: GeneratedDocument[];
};
