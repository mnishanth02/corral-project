import "reflect-metadata";
import { checkDbHealth } from "@corral/db";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { RedisHealthService } from "../redis/redis-health.service";
import { HealthController } from "./health.controller";

vi.mock("@corral/db", () => ({
  checkDbHealth: vi.fn(),
}));

describe("HealthController", () => {
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

  it("returns 200 when db and redis are healthy", async () => {
    (checkDbHealth as Mock).mockResolvedValue(true);
    redis.ping.mockResolvedValue(true);

    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(response.body).toMatchObject({ status: "ok", db: true, redis: true, version: "0.0.0" });
    expect(response.body.uptime).toEqual(expect.any(Number));
    expect(response.body.timestamp).toEqual(expect.any(String));
  });

  it("returns 503 when db is down", async () => {
    (checkDbHealth as Mock).mockResolvedValue(false);
    redis.ping.mockResolvedValue(true);

    const response = await request(app.getHttpServer()).get("/health").expect(503);

    expect(response.body).toMatchObject({ status: "error", db: false, redis: true });
  });

  it("returns 503 when redis is down", async () => {
    (checkDbHealth as Mock).mockResolvedValue(true);
    redis.ping.mockResolvedValue(false);

    const response = await request(app.getHttpServer()).get("/health").expect(503);

    expect(response.body).toMatchObject({ status: "error", db: true, redis: false });
  });
});
