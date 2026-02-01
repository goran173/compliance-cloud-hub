import { prisma } from '../db';
import { encrypt, decrypt } from '../utils/encryption';

// const prisma = new PrismaClient(); // Removed in favor of singleton

export const IntegrationManager = {
    /**
     * Stores an encrypted access token for a user integration.
     */
    storeToken: async (merchantId: string, provider: 'jira' | 'salesforce', accessToken: string, instanceUrl?: string) => {
        const encryptedToken = encrypt(accessToken);
        
        // Upsert integration
        // Note: For simplicity, assuming one integration per provider per user for now
        // To handle refreshing, we'd also store refreshToken and expiresAt
        // Prerequisite: First we need to find existing or create new.
        // Prisma doesn't support easy multi-field unique constraint upsert without defined @@unique in schema
        // We will do findFirst -> update or create.
        
        const existing = await prisma.integration.findFirst({
            where: { merchantId, provider } as any
        });

        if (existing) {
            return prisma.integration.update({
                where: { id: existing.id },
                data: {
                    encryptedAccessToken: encryptedToken,
                    instanceUrl: instanceUrl || undefined,
                }
            });
        } else {
             return prisma.integration.create({
                data: {
                    merchantId,
                    provider,
                    encryptedAccessToken: encryptedToken,
                    instanceUrl
                } as any
            });
        }
    },

    getIntegration: async (merchantId: string, provider: 'jira' | 'salesforce') => {
        const integration = await prisma.integration.findFirst({
            where: { merchantId, provider } as any
        });

        if (!integration) return null;

        return {
            ...integration,
            accessToken: decrypt(integration.encryptedAccessToken)
        };
    }
};
