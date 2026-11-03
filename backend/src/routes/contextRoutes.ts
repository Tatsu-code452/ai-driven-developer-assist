import { Router }
from "express";

import {
  getContexts,
  getContextDetail
} from "@/controllers/contextController";

const router = Router();

router.get(
  "/",
  getContexts
);

router.get(
  "/:id",
  getContextDetail
);

export default router;
