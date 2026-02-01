
import { Router } from 'express';
import { handleGDPRRequest } from '../controllers/shopify';

const router = Router();

// POST /webhooks/redact
router.post('/webhooks/redact', handleGDPRRequest);
export default router;
