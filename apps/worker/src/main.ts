import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { getEnv } from "./env";

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);

  app.useLogger(logger);

  await app.listen(env.WORKER_PORT);
  logger.log(`Worker listening on ${await app.getUrl()}`);
}

void bootstrap();
