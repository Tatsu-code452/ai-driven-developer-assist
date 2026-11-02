import { Request, Response } from "express";

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

  return res.json({

    success: true,

    items: [

      {

        id:
          "PRJ-001",

        name:
          "AI駆動型開発支援システム",

        taskCount:
          tasks.length,

        documentCount:
          documents.length,

        status:
          "進行中"

      }

    ]

  });

};
