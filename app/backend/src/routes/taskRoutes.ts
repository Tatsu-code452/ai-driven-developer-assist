import { Router }
from "express";

import {
  getTaskDetail,
  getTasks,
  postTask,
  putTask,
} from "@/controllers/taskController";

const router =
  Router();

router.get(
  "/",
  getTasks
);

router.get(
  "/:id",
  getTaskDetail
);

router.post(
  "/",
  postTask
);

router.put(
  "/:id",
  putTask
);

export default router;
