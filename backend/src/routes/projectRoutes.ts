import { Router } from "express";

import {
  getProjectDetail,
  getProjectManagementData,
  getProjects,
  postProject,
  putProject,
} from "@/controllers/project/projectController";

const router = Router();

router.get("/", getProjects);
router.post("/", postProject);
router.get("/:id", getProjectDetail);
router.get("/:id/management-data", getProjectManagementData);
router.put("/:id", putProject);

export default router;
