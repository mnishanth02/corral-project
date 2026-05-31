import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { getEnv } from "./env";

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.enableCors({
    origin: env.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  });

  await app.listen(env.API_PORT);
  logger.log(`API listening on ${await app.getUrl()}`);
}

void bootstrap();
