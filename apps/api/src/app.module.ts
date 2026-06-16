import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { ApiAuthModule } from "./auth/auth.module";
import { ConsoleModule } from "./console/console.module";
import { HealthModule } from "./health/health.module";
import { PublicEventsModule } from "./public-events/public-events.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot(),
    ApiAuthModule,
    ConsoleModule,
    PublicEventsModule,
    RedisModule,
    HealthModule,
  ],
})
export class AppModule {}
