import { Router }
from "express";

import {
  getTraceability
} from "@/controllers/traceabilityController";

const router =
  Router();

router.get(
  "/",
  getTraceability
);

export default router;
