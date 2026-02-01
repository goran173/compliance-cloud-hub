
import { Router, Request, Response } from "express";
import shopify from "../services/shopify";
import { DeletionQueue } from "../services/queue";

const router = Router();

/**
 * POST /api/webhooks/shopify/redact
 * Handles GDPR Customer Redact requests.
 */
router.post("/shopify/redact", async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Validate HMAC
        // We need the raw body for this. Ensure app.use(express.raw({...})) is set up upstream or locally.
        const topic = req.headers["x-shopify-topic"] as string | undefined;
        const hmac = req.headers["x-shopify-hmac-sha256"] as string | undefined;
        const shop = req.headers["x-shopify-shop-domain"] as string | undefined;
        const rawBody = (req as any).rawBody; // We will attach this in src/index.ts

        if (!hmac || !shop || !rawBody) {
            console.error("Missing HMAC, Shop, or Raw Body");
            res.status(401).send("Unauthorized");
            return;
        }

        const isAuthorized = await shopify.webhooks.validate({
            rawBody: rawBody,
            rawRequest: req,
            rawResponse: res,
        });

        if (!isAuthorized) {
            console.error("HMAC Validation Failed");
            res.status(401).send("Unauthorized");
            return;
        }

        const payload = req.body;
        console.log(`Received ${topic} webhook for ${shop}`);

        // 2. Add to Queue
        // topic should be 'customers/redact'
        if (topic === 'customers/redact') {
            await DeletionQueue.add('shopify-redact', {
                email: payload.customer.email,
                shopDomain: shop,
                requestDetails: payload
            });
        }

        // 3. Respond 200 OK immediately
        res.status(200).send();

    } catch (error) {
        console.error("Webhook Error:", error);
        // Always return 200 to Shopify eventually to prevent retries if it's a logic error
        // But 500 if system failure
        res.status(200).send(); 
    }
});

export default router;
