import { Router } from "express";

import healthRoutes from "./healthRoutes";

import converterRoutes from "./converterRoutes";

import taskRoutes from "./taskRoutes";

import documentRoutes from "./documentRoutes";

import projectRoutes from "./projectRoutes";

import dashboardRoutes from "./dashboardRoutes";

import matrixRoutes from "@/routes/matrixRoutes";
import traceabilityRoutes from "@/routes/traceabilityRoutes";
import contextRoutes from "./contextRoutes";
import agentToolsRoutes from "./agentToolsRoutes";

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
  "/agent-tools",
  agentToolsRoutes
);

router.use(
  "/dashboard",
  dashboardRoutes
);

router.use(
  "/traceability",
  traceabilityRoutes
);

router.use(
  "/traceability/matrix",
  matrixRoutes
);

export default router;
