import { Request, Response } from 'express';
import { prisma } from '../db';
// THE FIX: Import the correct function name
import { processJiraDeletion } from '../services/jira'; 

export const handleRedact = async (req: Request, res: Response) => {
  console.log("🔥 WEBHOOK HIT! Processing...");
  
  // 1. Acknowledge immediately (Shopify requires 200 OK fast)
  res.status(200).send();

  const { shop_domain, customer } = req.body;
  const email = customer?.email;

  if (!email) {
    console.log("⚠️ No email found in payload. Skipping.");
    return;
  }

  console.log(`⚙️ Processing integrations for ${email}...`);

  // 2. Find Integrations
  const integrations = await prisma.integration.findMany({
    where: { 
      isActive: true,
      merchant: { shopDomain: shop_domain }
    }
  });

  if (integrations.length === 0) {
    console.log("ℹ️ No active integrations found.");
    return;
  }

  // 3. Process Integrations
  const logResults = [];

  for (const integration of integrations) {
    let result = "Skipped";

    if (integration.platform === 'JIRA') {
      // THE FIX: Call the correct function
      result = await processJiraDeletion(email, integration);
    }
    
    // Add other platforms here later (Slack, etc.)

    logResults.push(result);
  }

  console.log(`✅ Request COMPLETED: ${JSON.stringify(logResults)}`);
  
  // 4. Save Log to DB
  try {
      await prisma.deletionLog.create({
          data: {
              status: "COMPLETED",
              source: "SHOPIFY_WEBHOOK",
              details: JSON.stringify(logResults),
              customerEmail: email,
              merchant: { connect: { shopDomain: shop_domain } }
          }
      });
  } catch (e) {
      console.error("Failed to save log:", e);
  }
};