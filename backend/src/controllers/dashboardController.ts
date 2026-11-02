import { Request, Response } from "express";

import {
  loadTasks
} from "@/repositories/TaskRepository";

import {
  loadDocuments
} from "@/repositories/DocumentRepository";

export const getDashboard =
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

  const completedTasks =
    tasks.filter(
      task =>
        task.status === "DONE"
    );

  return res.json({

    success: true,

    summary: {

      taskCount:
        tasks.length,

      completedTaskCount:
        completedTasks.length,

      documentCount:
        documents.length,

      progress:
        tasks.length === 0
          ? 0
          : Math.round(
              (
                completedTasks.length /
                tasks.length
              ) * 100
            )

    },

    latestTasks:
      tasks.slice(-5),

    latestDocuments:
      documents.slice(-5)

  });

};
