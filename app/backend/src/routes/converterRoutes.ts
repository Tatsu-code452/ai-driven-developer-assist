import { Router }
from "express";

import {
  convertMarkdownHandler
} from "@/controllers/converterController";

const router = Router();

router.post(
  "/markdown",
  convertMarkdownHandler
);

export default router;
