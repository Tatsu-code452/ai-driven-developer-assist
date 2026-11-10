import {
  Request,
  Response
} from "express";

import {
  loadIssues
} from "@/repositories/IssueRepository";

import {
  loadProjectById
} from "@/repositories/ProjectRepository";

import {
  DATA_DIRECTORY
} from "@/controllers/project/projectTypes";

const resolveRootPath =
(
  req: Request
) => {

  const projectId =
    String(
      req.query.projectId ??
      ""
    );

  if (
    !projectId
  ) {

    return DATA_DIRECTORY;

  }

  const project =
    loadProjectById(
      projectId,
      DATA_DIRECTORY
    );

  return (
    project?.rootPath ||
    DATA_DIRECTORY
  );

};

export const getIssues =
(
  req: Request,
  res: Response
) => {

  const items =
    loadIssues(
      resolveRootPath(
        req
      )
    );

  res.json({

    success: true,

    items

  });

};
