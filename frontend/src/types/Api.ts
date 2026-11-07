export type ItemsResponse<T> = {
  success: boolean;
  items: T[];
};

export type ItemResponse<T> = {
  success: boolean;
  item: T;
};

export type Project = {
  id: string;
  name: string;
  status: string;
  taskCount: number;
  documentCount: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: string;
  projectId?: string;
};

export type TaskStatus = "TODO" | "DOING" | "DONE";
export type TaskPriority = "LOW" | "NORMAL" | "HIGH";
export type TaskInput = Omit<Task, "id" | "source" | "projectId"> & {
  projectId: string;
};

export type TaskListResponse = {
  success: boolean;
  items: Task[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type TaskListFilters = {
  q?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  page?: number;
};

export type GeneratedDocument = {
  id: string;
  title: string;
  type: string;
  path: string;
  source: string;
  projectId?: string;
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
