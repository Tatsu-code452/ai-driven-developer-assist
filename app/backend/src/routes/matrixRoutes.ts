import { Router }
from "express";

import {
  getMatrix
} from "@/controllers/matrixController";

const router =
  Router();

router.get(
  "/",
  getMatrix
);

export default router;
