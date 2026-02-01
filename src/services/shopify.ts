import "@shopify/shopify-api/adapters/node";
import {
  shopifyApi,
  ApiVersion,
  LogSeverity,
} from "@shopify/shopify-api";

// Initialize Shopify API
// Note: We are using "offline" access mode for this SaaS which usually means
// we need to store the session permanently in our DB.
// For now we will rely on env vars.

if (!process.env.SHOPIFY_API_KEY || !process.env.SHOPIFY_API_SECRET) {
  console.warn("Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET");
}

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY || "test_key",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "test_secret",
  scopes: (process.env.SHOPIFY_SCOPES || "read_customers").split(","),
  hostName: (process.env.HOST || "localhost:3000").replace(/https:\/\//, ""),
  apiVersion: ApiVersion.January25,
  isEmbeddedApp: false, // This is a standalone SaaS hub, usually false if not running inside Shopify Admin iframe
  logger: {
    level: LogSeverity.Info,
  },
});

export default shopify;
