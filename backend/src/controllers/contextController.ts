import {
  Request,
  Response
} from "express";

import {
  loadContexts
} from "@/repositories/ContextRepository";

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

    return "data/generated";

  }

  const project =
    loadProjectById(
      projectId,
      DATA_DIRECTORY,
    );

  if (
    !project?.rootPath
  ) {

    return "data/generated";

  }

  return project.rootPath;

};

export const getContexts =
(
  req: Request,
  res: Response
) => {

  const items =
    loadContexts(
      resolveRootPath(
        req
      )
    );

  res.json({

    success: true,

    items,

    count:
      items.length

  });

};

export const getContextDetail =
(
  req: Request,
  res: Response
) => {

  const items =
    loadContexts(
      resolveRootPath(
        req
      )
    );

  const item =
    items.find(
      context =>
        context.id ===
        req.params.id
    );

  if (
    !item
  ) {

    return res
      .status(404)
      .json({

        success: false

      });

  }

  res.json({

    success: true,

    item

  });

};
