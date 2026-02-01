
/**
 * Stub for the Deletion Queue.
 * In production, this would add a job to BullMQ/Redis.
 */

interface JobData {
    email: string;
    shopDomain: string;
    requestDetails: any;
}

export const DeletionQueue = {
    add: async (jobName: string, data: JobData) => {
        console.log(`[DeletionQueue] Job added: ${jobName}`, data);
        // Simulate async processing
        return Promise.resolve({ id: 'stub-job-id', data });
    }
};
