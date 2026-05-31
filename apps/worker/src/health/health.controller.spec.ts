import "reflect-metadata";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RedisHealthService } from "../redis/redis-health.service";
import { HealthController } from "./health.controller";

describe("Worker HealthController", () => {
  let app: INestApplication;
  const redis = { ping: vi.fn() };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: RedisHealthService, useValue: redis }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app?.close();
    vi.clearAllMocks();
  });

  it("returns 200 when redis is healthy", async () => {
    redis.ping.mockResolvedValue(true);

    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(response.body).toMatchObject({ status: "ok", db: true, redis: true, version: "0.0.0" });
  });

  it("returns 503 when redis is down", async () => {
    redis.ping.mockResolvedValue(false);

    const response = await request(app.getHttpServer()).get("/health").expect(503);

    expect(response.body).toMatchObject({ status: "error", db: true, redis: false });
  });
});
