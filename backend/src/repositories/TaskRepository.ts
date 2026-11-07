import fs from "fs";
import path from "path";

import { getNextId } from "@/services/idGenerator/IdGenerator";
import type { Task, TaskInput } from "@/models/Task";

const FILE_NAME =
  "tasks.json";
const PAGE_SIZE = 20;
const RESERVED_TASK_ID = "TSK-030";
const taskStatuses: Task["status"][] = ["TODO", "DOING", "DONE"];
const taskPriorities: Task["priority"][] = ["LOW", "NORMAL", "HIGH"];

export type TaskListFilters = {
  q: string;
  projectId?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  page: number;
};

export type TaskListResult = {
  items: Task[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const isTask = (value: unknown): value is Task => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const task = value as Record<string, unknown>;
  return (
    typeof task.id === "string" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    taskStatuses.some((status) => status === task.status) &&
    taskPriorities.some((priority) => priority === task.priority) &&
    typeof task.source === "string" &&
    (task.projectId === undefined || typeof task.projectId === "string")
  );
};

export const loadTasks = (
  outputDir: string
): Task[] => {

  const filePath =
    path.join(
      outputDir,
      FILE_NAME
    );

  if (
    !fs.existsSync(
      filePath
    )
  ) {
    return [];
  }

  const parsed: unknown = JSON.parse(
    fs.readFileSync(
      filePath,
      "utf-8"
    )
  );

  if (!Array.isArray(parsed) || !parsed.every(isTask)) {
    throw new Error(
      `Invalid task data in ${filePath}`
    );
  }

  return parsed;
};

export const saveTasks = (
  tasks: Task[],
  outputDir: string
) => {

  fs.mkdirSync(
    outputDir,
    {
      recursive: true
    }
  );

  const filePath =
    path.join(
      outputDir,
      FILE_NAME
    );

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      tasks,
      null,
      2
    ),
    "utf-8"
  );

  return filePath;
};

export const mergeTasks = (
  current: Task[],
  incoming: Task[]
): Task[] => {

  const map =
    new Map<
      string,
      Task
    >();

  current.forEach(
    task =>
      map.set(
        task.id,
        task
      )
  );

  incoming.forEach(
    task => {

      const exists =
        [...map.values()]
          .find(
            item =>
              item.title ===
              task.title
          );

      if (
        exists
      ) {
        return;
      }

      map.set(
        task.id,
        task
      );

    }
  );

  return [
    ...map.values()
  ];
};

export const listTasks = (
  tasks: Task[],
  filters: TaskListFilters
): TaskListResult => {
  const query = filters.q.trim().toLocaleLowerCase();
  const filtered = tasks
    .filter((task) => {
      if (
        filters.projectId === "unassigned" &&
        task.projectId
      ) {
        return false;
      }

      if (
        filters.projectId &&
        filters.projectId !== "unassigned" &&
        task.projectId !== filters.projectId
      ) {
        return false;
      }

      if (
        filters.status &&
        task.status !== filters.status
      ) {
        return false;
      }

      if (
        filters.priority &&
        task.priority !== filters.priority
      ) {
        return false;
      }

      if (
        query &&
        !`${task.id} ${task.title}`
          .toLocaleLowerCase()
          .includes(query)
      ) {
        return false;
      }

      return true;
    })
    .sort((left, right) => left.id.localeCompare(right.id));

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * PAGE_SIZE;

  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    count: filtered.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
  };
};

export const createTask = (
  input: TaskInput,
  outputDir: string
): Task => {
  const tasks = loadTasks(outputDir);
  const id = getNextId("TSK", [
    ...tasks,
    { id: RESERVED_TASK_ID },
  ]);
  const task: Task = {
    ...input,
    id,
    source: "手動登録",
  };

  saveTasks([...tasks, task], outputDir);
  return task;
};

export const findTask = (
  id: string,
  outputDir: string
): Task | undefined =>
  loadTasks(outputDir).find((task) => task.id === id);

export const updateTask = (
  id: string,
  input: TaskInput,
  outputDir: string
): Task | undefined => {
  const tasks = loadTasks(outputDir);
  const index = tasks.findIndex((task) => task.id === id);
  if (index < 0) return undefined;

  const updated: Task = {
    ...tasks[index],
    ...input,
    id,
  };
  tasks[index] = updated;
  saveTasks(tasks, outputDir);
  return updated;
};
