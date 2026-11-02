import { Request, Response } from "express";

import {
  loadTasks
} from "@/repositories/TaskRepository";

export const getTasks =
(
  _req: Request,
  res: Response
) => {

  const tasks =
    loadTasks(
      "data/generated"
    );

  return res.json({

    success: true,

    items: tasks,

    count:
      tasks.length

  });

};
