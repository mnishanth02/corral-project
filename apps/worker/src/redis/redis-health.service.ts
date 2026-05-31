import { Injectable, type OnModuleDestroy } from "@nestjs/common";
import type { Redis } from "ioredis";

@Injectable()
export class RedisHealthService implements OnModuleDestroy {
  constructor(private readonly client: Redis) {}

  async ping(): Promise<boolean> {
    try {
      return (await this.client.ping()) === "PONG";
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
