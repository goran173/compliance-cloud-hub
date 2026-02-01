import { Router } from "express";
import healthRouter from "./health";
import shopifyRouter from "./shopify";
import merchantRouter from "./merchant";
import logsRouter from "./logs";
import dashboardRouter from "./dashboard";

const router = Router();

router.use("/health", healthRouter);
router.use("/shopify", shopifyRouter);
router.use("/merchant", merchantRouter);
router.use("/logs", logsRouter);
router.use("/dashboard-data", dashboardRouter);

export default router;
