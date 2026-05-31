import { describe, expect, it, vi } from "vitest";
import { SampleProcessor } from "./sample.processor";

describe("SampleProcessor", () => {
  it("is instantiable", () => {
    const logger = { info: vi.fn(), setContext: vi.fn() };

    const processor = new SampleProcessor(logger as never);

    expect(processor).toBeInstanceOf(SampleProcessor);
  });
});
