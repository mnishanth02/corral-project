import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import type { RedisOptions } from "ioredis";
import { getEnv } from "../env";
import { SampleProcessor } from "./sample.processor";

const redisConnectionOptions = (): RedisOptions => {
  const redisUrl = new URL(getEnv().REDIS_URL);
  const db = redisUrl.pathname.replace(/^\//, "");

  return {
    host: redisUrl.hostname,
    port: redisUrl.port ? Number(redisUrl.port) : 6379,
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: db ? Number(db) : undefined,
    tls: redisUrl.protocol === "rediss:" ? {} : undefined,
    maxRetriesPerRequest: null,
  };
};

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({ connection: redisConnectionOptions() }),
    }),
    BullModule.registerQueue({ name: "sample" }),
  ],
  providers: [SampleProcessor],
})
export class SampleModule {}
