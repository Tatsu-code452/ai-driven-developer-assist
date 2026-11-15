import { getHealth } from "@/controllers/healthController";
import { Router } from "express";

const router = Router();

router.get("/", getHealth);

export default router;
