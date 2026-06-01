import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { getEnv, parseCsv } from "./env";

async function bootstrap() {
  const env = getEnv();
  const app = await NestFactory.create(AppModule, { bufferLogs: true, bodyParser: false });
  const logger = app.get(Logger);

  app.useLogger(logger);
  app.enableCors({
    origin: parseCsv(env.CORS_ORIGINS),
    credentials: true,
  });

  await app.listen(env.API_PORT);
  logger.log(`API listening on ${await app.getUrl()}`);
}

void bootstrap();
