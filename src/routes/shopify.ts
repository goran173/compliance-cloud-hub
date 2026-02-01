import express from 'express';
// THE FIX: Import 'handleRedact' instead of 'handleGDPRRequest'
import { handleRedact } from '../controllers/shopify'; 

const router = express.Router();

// The webhook endpoint
router.post('/redact', handleRedact);

export default router;