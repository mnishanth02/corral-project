import { Global, Module } from "@nestjs/common";
import type { Redis as RedisClient } from "ioredis";
import Redis from "ioredis";
import { getEnv } from "../env";
import { RedisHealthService } from "./redis-health.service";

export const REDIS_CLIENT = Symbol("REDIS_CLIENT");

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): RedisClient => new Redis(getEnv().REDIS_URL),
    },
    {
      provide: RedisHealthService,
      useFactory: (client: RedisClient): RedisHealthService => new RedisHealthService(client),
      inject: [REDIS_CLIENT],
    },
  ],
  exports: [RedisHealthService],
})
export class RedisModule {}
