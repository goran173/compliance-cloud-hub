import { Request, Response } from "express";

/**
 * GET /health - Simple health check for load balancers and monitoring.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json({
    status: "ok",
    service: "compliance-cloud-hub",
    timestamp: new Date().toISOString(),
  });
}
