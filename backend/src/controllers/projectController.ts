import {
  Request,
  Response
} from "express";

import {
  loadTasks
} from "@/repositories/TaskRepository";

import {
  loadDocuments
} from "@/repositories/DocumentRepository";

export const getProjects =
(
  _req: Request,
  res: Response
) => {

  const tasks =
    loadTasks(
      "data/generated"
    );

  const documents =
    loadDocuments(
      "data/generated"
    );

  res.json({

    success: true,

    items: [

      {

        id:
          "PRJ-001",

        name:
          "AI駆動型開発支援システム",

        taskCount:
          tasks.filter(
            task =>
              task.projectId === "PRJ-001"
          ).length,

        documentCount:
          documents.filter(
            document =>
              document.projectId === "PRJ-001"
          ).length,

        status:
          "進行中"

      }

    ]

  });

};

export const getProjectDetail =
(
  _req: Request,
  res: Response
) => {

  const tasks =
    loadTasks(
      "data/generated"
    );

  const documents =
    loadDocuments(
      "data/generated"
    );

  res.json({

    success: true,

    item: {

      id:
        "PRJ-001",

      name:
        "AI駆動型開発支援システム",

      status:
        "進行中",

      taskCount:
        tasks.filter(
          task =>
            task.projectId === "PRJ-001"
        ).length,

      documentCount:
        documents.filter(
          document =>
            document.projectId === "PRJ-001"
        ).length

    }

  });

};
