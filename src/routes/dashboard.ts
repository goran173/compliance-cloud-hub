
import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// GET /api/dashboard-data
router.get('/', async (req: Request, res: Response) => {
    try {
        // MVP: Just get the first available merchant or create a seed one
        let merchant = await prisma.merchant.findFirst();

        if (!merchant) {
           // Create a demo merchant if none exists
           merchant = await prisma.merchant.create({
               data: {
                   email: 'demo@example.com',
                   shopDomain: 'demo-store.myshopify.com',
                   accessToken: 'demo_token'
               }
           });
        }

        const integrations = await prisma.integration.findMany({
            where: { merchantId: merchant.id }
        });

        const logs = await prisma.deletionLog.findMany({
            where: { merchantId: merchant.id },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        res.json({
            merchant,
            integrations,
            logs
        });

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

export default router;
