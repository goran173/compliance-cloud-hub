# Project: Compliance Cloud Hub (SaaS)

## Goal

Build a multi-tenant SaaS that automates GDPR/CCPA data deletion across platforms.
The app acts as a central hub. When a deletion request is received from one source (e.g., Shopify), it propagates that deletion to other connected services (Jira, Salesforce).

## Tech Stack

- **Runtime:** Node.js (Latest LTS)
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (via Supabase or generic pg client)
- **ORM:** Prisma
- **Frontend:** React + Vite + Tailwind CSS (for the configuration dashboard)
- **Queues:** BullMQ (Redis) to handle deletion jobs asynchronously.

## Architecture: Hub & Spoke

1. **The Hub:** Central API that handles authentication, stores user configurations (API keys/tokens for spokes), and processes the deletion logic.
2. **Spoke A (Shopify):** Uses `@shopify/shopify-api`. Listens for `customers/redact` webhooks.
3. **Spoke B (Atlassian/Jira):** Uses Atlassian Connect (JWT auth). Scans users/tickets by email.
4. **Spoke C (Salesforce):** Uses JSforce. Scans Contacts/Leads by email.

## MVP Requirements

1. **Merchant Auth:** Users sign up/login (can be via Shopify OAuth).
2. **Connector Page:** User can link their Jira and Salesforce accounts (store OAuth tokens securely).
3. **Webhook Receiver:** Endpoint to receive GDPR requests from Shopify.
4. **Processor:** Logic to take an email, find it in connected apps, and soft-delete/anonymize.
5. **Logs:** A simple table showing "Deletion Request for [Email] - Status: Success".
