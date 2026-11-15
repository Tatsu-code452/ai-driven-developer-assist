import { Router } from "express";
import {
  getAgentCatalog,
  getAgentToolStatus,
  postAgentPlan
} from "@/controllers/agentToolsController";

const router = Router();

router.get("/status", getAgentToolStatus);
router.get("/agents", getAgentCatalog);
router.post("/plan", postAgentPlan);

export default router;
