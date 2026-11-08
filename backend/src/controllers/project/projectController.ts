import type { Request, Response } from "express";

import { createProjectPageResponse, createProjectResponseOrNotFound, getFilteredProjects } from "@/controllers/project/projectControllerHelper";
import { ApiMethod, DATA_DIRECTORY } from "@/controllers/project/projectTypes";
import {
  hasProjectId,
  hasProjectInput,
  validate,
  validatePageQueryParam,
  validateProjectId,
  validateProjectInput,
  type ValidationContext
} from "@/controllers/project/projectValidator";
import {
  createProject,
  loadProjectById,
  updateProject
} from "@/repositories/ProjectRepository";
import { trimAndtoLowerCase } from "@/utils/stringUtils";

export const getProjects: ApiMethod = (
  req: Request,
  res: Response,
) => {
  const context: ValidationContext = {};
  const result = validate(req, res, context, [validatePageQueryParam]);
  if (result) {
    return result;
  }

  const keyword = trimAndtoLowerCase(context.query?.q ?? "");
  const statusFilter = trimAndtoLowerCase(context.query?.status ?? "");
  const projects = getFilteredProjects(keyword, statusFilter);

  return createProjectPageResponse(
    res,
    context.requestedPage ?? 1,
    projects,
  );
}

export const getProjectDetail: ApiMethod = (
  req: Request,
  res: Response,
) => {
  const context: ValidationContext = {};

  const result = validate(req, res, context, [validateProjectId]);

  if (result) {
    return result;
  }

  if (!hasProjectId(context)) {
    throw new Error("ValidationContext.id missing");
  }

  const project = loadProjectById(context.id, DATA_DIRECTORY);

  return createProjectResponseOrNotFound(res, project);
};

export const postProject: ApiMethod = (
  req: Request,
  res: Response,
) => {
  const context: ValidationContext = {};

  const result = validate(req, res, context, [validateProjectInput]);

  if (result) {
    return result;
  }

  if (!hasProjectInput(context)) {
    throw new Error(
      "ValidationContext.input missing",
    );
  }

  const project =
    createProject(
      context.input,
      DATA_DIRECTORY,
    );

  return createProjectResponseOrNotFound(res, project);
};

export const putProject: ApiMethod = (
  req: Request,
  res: Response,
) => {
  const context: ValidationContext = {};

  const result = validate(req, res, context, [validateProjectId, validateProjectInput]);
  if (result) {
    return result;
  }

  if (
    !hasProjectId(context) ||
    !hasProjectInput(context)
  ) {
    throw new Error(
      "ValidationContext invalid",
    );
  }

  const project =
    updateProject(
      context.id,
      context.input,
      DATA_DIRECTORY,
    );

  return createProjectResponseOrNotFound(res, project);
};

