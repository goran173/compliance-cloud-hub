import 'dotenv/config';
import express from "express";
import cors from "cors";
import path from "path";
import { prisma } from './lib/prisma';
import { processJiraDeletion } from './services/jira';
import { decrypt, encrypt } from './utils/encryption';

const app = express();
// const prisma = new PrismaClient(); // Removed local instantiation

const PORT = process.env.PORT ?? 3000;

// Security Check
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length !== 32) {
  console.warn("WARNING: ENCRYPTION_KEY is missing/invalid.");
}

app.use(cors());

// Middleware: Capture raw body for Webhooks (Crucial for Shopify)
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// --- DEBUG LOGGER ---
// This prints EVERY request hitting your server. 
// If you don't see this, Ngrok is pointing to the wrong place.
app.use((req, res, next) => {
  console.log(`📡 Incoming Request: ${req.method} ${req.url}`);
  next();
});

// 1. SERVE STATIC FILES (Your React App)
app.use(express.static(path.join(__dirname, '../client/dist')));

// 2. API ROUTES

// A. The Webhook (Trigger)
app.post("/api/webhooks/shopify/redact", async (req, res) => {
    console.log("🔥 WEBHOOK HIT! Processing...");
    
    // 1. Always respond 200 OK fast
    res.status(200).send();

    try {
        const { shop_domain, customer } = req.body;
        const email = customer?.email || "unknown@test.com";

        // Find merchant (or use first one for demo)
        const merchant = await prisma.merchant.findFirst();
        if (!merchant) return;

        // Create Pending Log
        const log = await prisma.deletionLog.create({
            data: {
                merchantId: merchant.id,
                customerEmail: email,
                source: 'SHOPIFY_WEBHOOK',
                status: 'PENDING',
                details: "Waiting for processor..."
            }
        });

        // Trigger the Processor
        await processIntegrations(merchant.id, email, log.id);

    } catch (e) {
        console.error("Webhook Error", e);
    }
});

// 1. Customers Data Request (View Data)
// Required by Shopify, but for Jira, we usually just say "We don't hold data" or ignore it for MVP.
// We must return 200 OK to acknowledge receipt.
app.post("/api/webhooks/shopify/data-request", (req, res) => {
  console.log("📥 Data Request Webhook received (Not implemented for MVP)");
  res.status(200).send();
});

// 2. Shop Redact (Uninstall cleanup)
// Required by Shopify. This fires 48 hours after a merchant uninstalls your app.
// It tells you to delete their config data from YOUR database.
app.post("/api/webhooks/shopify/shop-redact", async (req, res) => {
  console.log("🗑️ Shop Redact Webhook received");
  // In a real app, you would delete the Merchant record here.
  // For MVP, just acknowledging is enough to pass review.
  res.status(200).send();
});

// C. Integration Toggle Route
app.post('/api/integrations/toggle', async (req, res) => {
  try {
    const { platform, status, credentials } = req.body; // status is boolean (isActive)
    
    // In a real app, get merchantId from session/token
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
       return res.status(404).json({ error: "Merchant not found" });
    }

    let encryptedAccessToken = "dummy_token";
    if (credentials) {
        encryptedAccessToken = encrypt(JSON.stringify(credentials));
    }

    const existing = await prisma.integration.findFirst({
        where: { merchantId: merchant.id, platform }
    });

    if (existing) {
        await prisma.integration.update({
            where: { id: existing.id },
            data: { 
                isActive: status,
                ...(credentials && { encryptedAccessToken })
            }
        });
    } else {
        await prisma.integration.create({
            data: {
                merchantId: merchant.id,
                platform,
                isActive: status,
                encryptedAccessToken,
                // instanceUrl etc might be needed?
            }
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Toggle error", error);
    res.status(500).json({ error: "Failed to toggle integration" });
  }
});

// --- JIRA ROUTES ---

// 1. CONNECT (Save Credentials)
app.post('/api/integrations/jira', async (req, res) => {
  try {
    const { domain, email, token } = req.body;
    
    // For MVP, always grab the first merchant. 
    // In production, you'd use the session to find the specific logged-in user.
    const merchant = await prisma.merchant.findFirst();
    
    if (!merchant) {
      console.error("❌ Save Failed: No merchant found in database.");
      return res.status(404).json({ error: "No merchant found" });
    }

    // Simple ID strategy: MerchantID + Platform Name
    const integrationId = merchant.id + 'JIRA';

    // Store credentials inside encryptedAccessToken (JSON stringified)
    const payload = JSON.stringify({ 
      jiraDomain: domain, 
      jiraEmail: email, 
      jiraApiToken: token 
    });

    // Use encryption to match existing decrypt() calls in processor/debug
    const encryptedToken = encrypt(payload); 

    await prisma.integration.upsert({
      where: { id: integrationId },
      update: { 
        isActive: true, 
        encryptedAccessToken: encryptedToken,
        instanceUrl: `https://${domain}`
      },
      create: {
        id: integrationId,
        merchantId: merchant.id,
        platform: 'JIRA',
        encryptedAccessToken: encryptedToken,
        instanceUrl: `https://${domain}`
      }
    });

    console.log(`✅ Jira Connected for merchant: ${merchant.shopDomain}`);
    res.json({ success: true });

  } catch (error) {
    console.error("❌ Save Error:", error);
    res.status(500).json({ error: "Failed to save credentials" });
  }
});

// 2. DISCONNECT (Delete Credentials)
app.delete('/api/integrations/jira', async (req, res) => {
  try {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) return res.status(404).json({ error: "No merchant found" });

    await prisma.integration.deleteMany({
      where: { merchantId: merchant.id, platform: 'JIRA' }
    });

    console.log(`🔌 Jira Disconnected for ${merchant.shopDomain}`);
    res.json({ success: true });

  } catch (error) {
    console.error("Disconnect Error:", error);
    res.status(500).json({ error: "Failed to disconnect" });
  }
});

// B. The Logs (For Dashboard)
app.get('/api/logs', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      prisma.deletionLog.count(),
      prisma.deletionLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { merchant: true }
      })
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

// C. The Dashboard Data (Stub to prevent React crash)
app.get('/api/dashboard-data', async (req, res) => {
    try {
        const merchant = await prisma.merchant.findFirst({
            include: { integrations: true, logs: { take: 5, orderBy: { createdAt: 'desc' }, include: { merchant: true } } }
        });

        if (!merchant) {
             return res.json({ merchant: null, integrations: [], logs: [] });
        }
        
        // Transform to match frontend interface
        res.json({
            merchant: { shopDomain: merchant.shopDomain, email: merchant.email },
            integrations: merchant.integrations,
            logs: merchant.logs
        });

    } catch (e) {
        console.error(e);
        res.status(500).send("Error");
    }
});

app.get("/health", (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/debug/jira-test', async (req, res) => {
  try {
    // 1. HARDCODE YOUR STORE DOMAIN HERE TO BE SAFE
    // Replace this string with your exact test store domain
    const targetShop = "test-store-1100000000000000000000000000000003850.myshopify.com"; 

    const merchant = await prisma.merchant.findUnique({
      where: { shopDomain: targetShop }
    });

    if (!merchant) {
      // Fallback: List all merchants to see what is actually in DB
      const allMerchants = await prisma.merchant.findMany();
      return res.json({ 
        error: "Target merchant not found.", 
        availableMerchants: allMerchants.map(m => m.shopDomain) 
      });
    }

    // 2. Find Integration
    const integration = await prisma.integration.findUnique({
      where: { id: merchant.id + 'JIRA' } 
    });

    if (!integration) {
      return res.send(`
        <h1>No Integration Found</h1>
        <p>Merchant found: ${merchant.shopDomain}</p>
        <p>Looking for ID: ${merchant.id}JIRA</p>
        <p><b>Action:</b> Go to Dashboard, click Disconnect, and Connect again.</p>
      `);
    }

    // 3. Run Test
    const testEmail = "final-test@example.com"; 
    const result = await processJiraDeletion(testEmail, integration);
    
    res.send(`<h1>Result</h1><pre>${result}</pre>`);

  } catch (error: any) {
    res.send(`<pre>${JSON.stringify(error, null, 2)}</pre>`);
  }
});

// 3. CATCH-ALL ROUTE (Must be last)
// Serves React for any other URL (like /dashboard, /settings)
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ⚙️ The Integration Processor
async function processIntegrations(merchantId: string, email: string, logId: string) {
  console.log(`⚙️ Processing integrations for ${email}...`);
  
  try {
    // 1. Find JIRA integration
    const integration = await prisma.integration.findFirst({
      where: { merchantId, platform: 'JIRA', isActive: true }
    });

    const results: string[] = [];

    if (integration) {
        // 2. Decrypt & Process
        const result = await processJiraDeletion(email, integration);
        results.push(result);
    } else {
        results.push("Jira: Integration not active or missing. Skipping.");
    }

    // 3. Update Log to COMPLETED
    await prisma.deletionLog.update({
      where: { id: logId },
      data: {
        status: 'COMPLETED',
        details: JSON.stringify(results)
      }
    });
    
    console.log(`✅ Request COMPLETED: ${JSON.stringify(results)}`);

  } catch (error: any) {
    console.error("Processor Error:", error);
    await prisma.deletionLog.update({
      where: { id: logId },
      data: {
        status: 'FAILED',
        details: JSON.stringify({ error: error.message })
      }
    });
  }
}

