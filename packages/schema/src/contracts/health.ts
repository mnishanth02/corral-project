import { initContract } from "@ts-rest/core";
import { healthResponseSchema } from "./health.schema";

const c = initContract();

/**
 * Health contract — GET /health.
 * Returns 200 with a healthy body, or 503 with a degraded/error body when a
 * dependency (db/redis) check fails. The same body shape is used for both.
 */
export const healthContract = c.router(
  {
    check: {
      method: "GET",
      path: "/health",
      summary: "Liveness/readiness probe (db + redis)",
      responses: {
        200: healthResponseSchema,
        503: healthResponseSchema,
      },
    },
  },
  {
    strictStatusCodes: true,
  },
);
