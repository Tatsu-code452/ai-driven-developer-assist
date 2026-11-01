export type TaskStatus =
  | "TODO"
  | "DOING"
  | "DONE";

export type TaskPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  source: string;
};
