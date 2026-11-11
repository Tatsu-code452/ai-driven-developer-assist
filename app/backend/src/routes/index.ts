import { Router } from "express";

import converterRoutes from "@/routes/converterRoutes";
import dashboardRoutes from "@/routes/dashboardRoutes";
import documentRoutes from "@/routes/documentRoutes";
import healthRoutes from "@/routes/healthRoutes";
import matrixRoutes from "@/routes/matrixRoutes";
import projectRoutes from "@/routes/projectRoutes";
import taskRoutes from "@/routes/taskRoutes";
import traceabilityRoutes from "@/routes/traceabilityRoutes";
import agentToolsRoutes from "./agentToolsRoutes";
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
