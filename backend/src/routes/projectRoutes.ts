import { Router }
from "express";

import {
  getProjectDetail,
  getProjects,
  postProject,
  putProject,
} from "@/controllers/projectController";

const router =
  Router();

router.get(
  "/",
  getProjects
);

router.post(
  "/",
  postProject
);

router.get(
  "/:id",
  getProjectDetail
);

router.put(
  "/:id",
  putProject
);

export default router;
