import { Router } from "express";

import healthRoutes from "./healthRoutes";

import converterRoutes from "./converterRoutes";

import taskRoutes from "./taskRoutes";

import documentRoutes from "./documentRoutes";

import projectRoutes from "./projectRoutes";

import dashboardRoutes from "./dashboardRoutes";

import contextRoutes from "./contextRoutes";

const router =
  Router();

router.use(
  "/health",
  healthRoutes
);

router.use(
  "/converter",
  converterRoutes
);

router.use(
  "/tasks",
  taskRoutes
);

router.use(
  "/documents",
  documentRoutes
);

router.use(
  "/projects",
  projectRoutes
);

router.use(
  "/contexts",
  contextRoutes
);

router.use(
  "/dashboard",
  dashboardRoutes
);

export default router;
