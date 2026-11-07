import { Request, Response } from "express";

import type {
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "@/models/Task";
import {
  createTask,
  findTask,
  loadTasks,
  listTasks,
  updateTask,
} from "@/repositories/TaskRepository";

const DATA_DIR = "data/generated";
const PROJECT_ID_PATTERN = /^PRJ-\d{3}$/;
const TASK_STATUSES: TaskStatus[] = ["TODO", "DOING", "DONE"];
const TASK_PRIORITIES: TaskPriority[] = ["LOW", "NORMAL", "HIGH"];
const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: ["TODO", "DOING"],
  DOING: ["DOING", "DONE"],
  DONE: ["DONE", "DOING"],
};

const isString = (value: unknown): value is string =>
  typeof value === "string";

const isOneOf = <T extends string>(
  value: unknown,
  allowed: T[],
): value is T =>
  isString(value) && allowed.some((item) => item === value);

const errorResponse = (
  res: Response,
  status: number,
  message: string,
) =>
  res.status(status).json({
    success: false,
    message,
  });

const parseTaskInput = (
  body: unknown,
): TaskInput | string => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "入力内容が不正です。";
  }

  const input = body as Record<string, unknown>;
  const title = isString(input.title) ? input.title.trim() : "";
  const description =
    input.description === undefined
      ? ""
      : isString(input.description)
        ? input.description
        : undefined;
  if (!title) return "タイトルを入力してください。";
  if (title.length > 200) return "タイトルは200文字以内で入力してください。";
  if (description === undefined) return "説明は文字列で入力してください。";
  if (!isOneOf(input.status, TASK_STATUSES)) {
    return "状態が不正です。";
  }
  if (!isOneOf(input.priority, TASK_PRIORITIES)) {
    return "優先度が不正です。";
  }
  if (
    !isString(input.projectId) ||
    !PROJECT_ID_PATTERN.test(input.projectId)
  ) {
    return "プロジェクトを選択してください。";
  }

  return {
    title,
    description,
    status: input.status,
    priority: input.priority,
    projectId: input.projectId,
  };
};

export const getTasks = (
  req: Request,
  res: Response,
) => {
  const { q = "", projectId, status, priority, page = "1" } = req.query;
  if (
    !isString(q) ||
    (projectId !== undefined && !isString(projectId)) ||
    (status !== undefined && !isString(status)) ||
    (priority !== undefined && !isString(priority)) ||
    !isString(page) ||
    !/^[1-9]\d*$/.test(page)
  ) {
    return errorResponse(res, 400, "検索条件が不正です。");
  }
  if (
    projectId !== undefined &&
    projectId !== "unassigned" &&
    !PROJECT_ID_PATTERN.test(projectId)
  ) {
    return errorResponse(res, 400, "プロジェクトIDが不正です。");
  }
  if (status !== undefined && !isOneOf(status, TASK_STATUSES)) {
    return errorResponse(res, 400, "状態が不正です。");
  }
  if (priority !== undefined && !isOneOf(priority, TASK_PRIORITIES)) {
    return errorResponse(res, 400, "優先度が不正です。");
  }

  const result = listTasks(loadTasks(DATA_DIR), {
    q,
    projectId,
    status,
    priority,
    page: Number(page),
  });
  return res.json({
    success: true,
    ...result,
  });
};

export const getTaskDetail = (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;
  if (!isString(id)) return errorResponse(res, 400, "タスクIDが不正です。");
  const task = findTask(id, DATA_DIR);
  if (!task) return errorResponse(res, 404, "タスクが見つかりません。");
  return res.json({ success: true, item: task });
};

export const postTask = (
  req: Request,
  res: Response,
) => {
  const input = parseTaskInput(req.body);
  if (typeof input === "string") {
    return errorResponse(res, 400, input);
  }
  if (input.status !== "TODO") {
    return errorResponse(res, 400, "新規タスクの状態はTODOで登録してください。");
  }

  const task = createTask(input, DATA_DIR);
  return res.status(201).json({ success: true, item: task });
};

export const putTask = (
  req: Request,
  res: Response,
) => {
  const id = req.params.id;
  if (!isString(id)) return errorResponse(res, 400, "タスクIDが不正です。");

  const current = findTask(id, DATA_DIR);
  if (!current) return errorResponse(res, 404, "タスクが見つかりません。");

  const input = parseTaskInput(req.body);
  if (typeof input === "string") {
    return errorResponse(res, 400, input);
  }
  if (!ALLOWED_TRANSITIONS[current.status]?.includes(input.status)) {
    return errorResponse(res, 400, "許可されていない状態遷移です。");
  }

  const task = updateTask(id, input, DATA_DIR);
  if (!task) return errorResponse(res, 404, "タスクが見つかりません。");
  return res.json({ success: true, item: task });
};
