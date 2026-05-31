import { z } from "zod";

/** Health status: ok = all checks pass; degraded/error = one or more checks failed. */
export const healthStatusSchema = z.enum(["ok", "degraded", "error"]);
export type HealthStatus = z.infer<typeof healthStatusSchema>;

/** Response body for GET /health. */
export const healthResponseSchema = z.object({
  status: healthStatusSchema,
  db: z.boolean(),
  redis: z.boolean(),
  uptime: z.number(),
  version: z.string(),
  timestamp: z.string(),
});
export type HealthResponse = z.infer<typeof healthResponseSchema>;
