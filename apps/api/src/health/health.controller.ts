import { checkDbHealth } from "@corral/db";
import { type HealthResponse, healthContract } from "@corral/schema";
import { Controller } from "@nestjs/common";
import { TsRestHandler, tsRestHandler } from "@ts-rest/nest";
import { RedisHealthService } from "../redis/redis-health.service";

@Controller()
export class HealthController {
  constructor(private readonly redis: RedisHealthService) {}

  @TsRestHandler(healthContract.check)
  async check() {
    return tsRestHandler(healthContract.check, async () => {
      const dbHealthy = await checkDbHealth();
      const redisHealthy = await this.redis.ping();
      const body: HealthResponse = {
        status: dbHealthy && redisHealthy ? "ok" : "error",
        db: dbHealthy,
        redis: redisHealthy,
        uptime: process.uptime(),
        version: process.env.npm_package_version ?? "0.0.0",
        timestamp: new Date().toISOString(),
      };

      return dbHealthy && redisHealthy
        ? { status: 200 as const, body }
        : { status: 503 as const, body };
    });
  }
}
