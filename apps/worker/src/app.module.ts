import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { HealthModule } from "./health/health.module";
import { RedisModule } from "./redis/redis.module";
import { SampleModule } from "./sample/sample.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    RedisModule,
    HealthModule,
    SampleModule,
  ],
})
export class AppModule {}
