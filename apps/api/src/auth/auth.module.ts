import { Module } from "@nestjs/common";
import { AuthModule as BetterAuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "./auth";

@Module({
  imports: [
    BetterAuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { enabled: true, extended: true, limit: "2mb" },
        rawBody: true,
      },
    }),
  ],
})
export class ApiAuthModule {}
