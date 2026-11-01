import { convertMarkdown } from "@/controllers/converterController";
import { Router } from "express";

const router = Router();

router.post("/markdown", convertMarkdown);

export default router;
