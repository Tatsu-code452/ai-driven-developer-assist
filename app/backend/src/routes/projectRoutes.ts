import {
  Router
} from "express";

import {
  ProjectController
} from "../controllers/ProjectController.js";

const router =
  Router();

const controller =
  new ProjectController();

router.get(
  "/projects",
  controller.getAll
);

router.get(
  "/projects/:id",
  controller.getById
);

router.post(
  "/projects",
  controller.create
);

router.put(
  "/projects/:id",
  controller.update
);

router.delete(
  "/projects/:id",
  controller.delete
);

router.put(
  "/projects/:id/current",
  controller.setCurrentProject
);

export default router;
