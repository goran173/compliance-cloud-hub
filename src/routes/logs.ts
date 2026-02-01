import { Router, Request, Response } from "express";
import { prisma } from "../db";

const router = Router();
// const prisma = new PrismaClient(); // Removed in favor of singleton

/**
 * GET /api/logs
 * Fetches the last 50 deletion logs.
 */
router.get("/", async (_req: Request, res: Response) => {
    try {
        const logs = await prisma.deletionLog.findMany({
            take: 50,
            orderBy: { createdAt: 'desc' },
            include: {
                merchant: {
                    select: { email: true }
                }
            } as any
        });
        res.json(logs);
    } catch (error) {
        console.error("Error fetching logs:", error);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

export default router;
