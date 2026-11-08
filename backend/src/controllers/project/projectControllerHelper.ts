import type { Response } from "express";

import { toProjectResponse } from "@/controllers/project/projectMapper";
import { DATA_DIRECTORY, PAGE_SIZE } from "@/controllers/project/projectTypes";
import { ProjectRecord } from "@/models/Project";
import { loadDocumentsGrouped } from "@/repositories/DocumentRepository";
import {
  loadProjects
} from "@/repositories/ProjectRepository";
import { loadTasksGrouped } from "@/repositories/TaskRepository";
import {
  createNotFoundResponse,
  createSuccessResponse
} from "@/utils/responseUtils";


export const loadProjectRelations = () => ({
  tasks: loadTasksGrouped(DATA_DIRECTORY),
  documents: loadDocumentsGrouped(DATA_DIRECTORY),
});

export const createProjectPageResponse = (
  res: Response,
  requestedPage: number,
  projects: ProjectRecord[]
) => {
  const relations = loadProjectRelations();

  const { page, start } = getPageInfo(projects.length, PAGE_SIZE, requestedPage);

  const items = projects
    .slice(
      start,
      start + PAGE_SIZE,
    )
    .map(project =>
      toProjectResponse(
        project,
        relations.tasks,
        relations.documents,
      ),
    );

  return createSuccessResponse(
    res,
    {
      items,
      total: projects.length,
      page,
      pageSize: PAGE_SIZE,
    },
  );
};

export const createProjectResponse = (
  res: Response,
  project: ProjectRecord
) => {
  const relations =
    loadProjectRelations();

  return createSuccessResponse(
    res,
    toProjectResponse(
      project,
      relations.tasks,
      relations.documents,
    ),
  );
};

export const createProjectResponseOrNotFound = (
  res: Response,
  project: ProjectRecord | undefined,
) => {
  if (!project) {
    return createNotFoundResponse(
      res,
      "プロジェクトが見つかりません",
    );
  }

  return createProjectResponse(res, project);
};

export const getFilteredProjects = (keyword: string, statusFilter: string) => {
  const projects =
    loadProjects(DATA_DIRECTORY)
      .filter(project => {

        const matchesKeyword =
          !keyword ||
          project.id
            .toLowerCase()
            .includes(keyword) ||
          project.name
            .toLowerCase()
            .includes(keyword);

        const matchesStatus =
          !statusFilter ||
          project.status
            .toLowerCase()
            .includes(statusFilter);

        return (
          matchesKeyword &&
          matchesStatus
        );
      })
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name) ||
          left.id.localeCompare(right.id),
      );

  return projects;
};


export const getPageInfo = (totalItems: number, pageSize: number, requestedPage: number) => {
  const pageCount = Math.ceil(totalItems / pageSize);
  const page = pageCount === 0 ? 1 : Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  return { page, pageCount, start };
};
