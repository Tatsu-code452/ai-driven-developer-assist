import { Router } from "express";
import converterRoutes from "./converterRoutes";
import healthRoutes from "./healthRoutes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/converter", converterRoutes);

export default router;
