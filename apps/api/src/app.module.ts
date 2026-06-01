import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { ApiAuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    ApiAuthModule,
    RedisModule,
    HealthModule,
  ],
})
export class AppModule {}
