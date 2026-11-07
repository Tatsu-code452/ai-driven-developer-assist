import type { Request, Response } from "express";

import type { ProjectInput, ProjectRecord } from "@/models/Project";
import { loadDocuments } from "@/repositories/DocumentRepository";
import {
  createProject,
  loadProjects,
  updateProject,
} from "@/repositories/ProjectRepository";
import { loadTasks } from "@/repositories/TaskRepository";

const DATA_DIRECTORY = "data/generated";
const PAGE_SIZE = 20;

const projectInputFrom = (body: unknown): ProjectInput | undefined => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return undefined;
  }

  const record = body as Record<string, unknown>;
  const { name, description, status } = record;

  if (
    typeof name !== "string" ||
    (description !== undefined && typeof description !== "string") ||
    (status !== undefined && typeof status !== "string")
  ) {
    return undefined;
  }

  const normalizedName = name.trim();
  if (!normalizedName) {
    return undefined;
  }

  return {
    name: normalizedName,
    description: typeof description === "string" ? description : "",
    status: typeof status === "string" ? status : "",
  };
};

const positiveIntegerFrom = (value: unknown): number | undefined => {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
};

const withRelatedCounts = (
  project: ProjectRecord,
  tasks: ReturnType<typeof loadTasks>,
  documents: ReturnType<typeof loadDocuments>,
) => ({
  ...project,
  taskCount: tasks.filter((task) => task.projectId === project.id).length,
  documentCount: documents.filter(
    (document) => document.projectId === project.id,
  ).length,
});

export const getProjects = (req: Request, res: Response) => {
  const requestedPage =
    req.query.page === undefined ? 1 : positiveIntegerFrom(req.query.page);
  if (requestedPage === undefined) {
    return res.status(400).json({
      success: false,
      message: "pageは1以上の整数で指定してください",
    });
  }

  if (
    (req.query.q !== undefined && typeof req.query.q !== "string") ||
    (req.query.status !== undefined && typeof req.query.status !== "string")
  ) {
    return res.status(400).json({
      success: false,
      message: "検索条件は文字列で指定してください",
    });
  }

  const keyword = (req.query.q ?? "").trim().toLocaleLowerCase();
  const statusFilter = (req.query.status ?? "").trim().toLocaleLowerCase();
  const tasks = loadTasks(DATA_DIRECTORY);
  const documents = loadDocuments(DATA_DIRECTORY);
  const projects = loadProjects(DATA_DIRECTORY)
    .filter((project) => {
      const matchesKeyword =
        !keyword ||
        project.id.toLocaleLowerCase().includes(keyword) ||
        project.name.toLocaleLowerCase().includes(keyword);
      const matchesStatus =
        !statusFilter ||
        project.status.toLocaleLowerCase().includes(statusFilter);
      return matchesKeyword && matchesStatus;
    })
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id),
    );

  const pageCount = Math.ceil(projects.length / PAGE_SIZE);
  const page =
    pageCount === 0 ? 1 : Math.min(requestedPage, pageCount);
  const start = (page - 1) * PAGE_SIZE;
  const items = projects
    .slice(start, start + PAGE_SIZE)
    .map((project) => withRelatedCounts(project, tasks, documents));

  return res.json({
    success: true,
    items,
    total: projects.length,
    page,
    pageSize: PAGE_SIZE,
  });
};

export const getProjectDetail = (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== "string") {
    return res.status(400).json({
      success: false,
      message: "プロジェクトIDを1件指定してください",
    });
  }

  const project = loadProjects(DATA_DIRECTORY).find(
    (item) => item.id === id,
  );

  if (!project) {
    return res.status(404).json({
      success: false,
      message: `プロジェクトが見つかりません: ${id}`,
    });
  }

  const tasks = loadTasks(DATA_DIRECTORY);
  const documents = loadDocuments(DATA_DIRECTORY);
  return res.json({
    success: true,
    item: withRelatedCounts(project, tasks, documents),
  });
};

export const postProject = (req: Request, res: Response) => {
  const input = projectInputFrom(req.body);
  if (!input) {
    return res.status(400).json({
      success: false,
      message: "名称は必須です。説明と状態は文字列で指定してください",
    });
  }

  const project = createProject(input, DATA_DIRECTORY);
  const tasks = loadTasks(DATA_DIRECTORY);
  const documents = loadDocuments(DATA_DIRECTORY);
  return res.status(201).json({
    success: true,
    item: withRelatedCounts(project, tasks, documents),
  });
};

export const putProject = (req: Request, res: Response) => {
  const id = req.params.id;
  if (typeof id !== "string") {
    return res.status(400).json({
      success: false,
      message: "プロジェクトIDを1件指定してください",
    });
  }

  const input = projectInputFrom(req.body);
  if (!input) {
    return res.status(400).json({
      success: false,
      message: "名称は必須です。説明と状態は文字列で指定してください",
    });
  }

  const project = updateProject(id, input, DATA_DIRECTORY);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: `プロジェクトが見つかりません: ${id}`,
    });
  }

  const tasks = loadTasks(DATA_DIRECTORY);
  const documents = loadDocuments(DATA_DIRECTORY);
  return res.json({
    success: true,
    item: withRelatedCounts(project, tasks, documents),
  });
};
