import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import type { Job } from "bullmq";
import { PinoLogger } from "nestjs-pino";

@Injectable()
@Processor("sample")
export class SampleProcessor extends WorkerHost {
  constructor(private readonly logger: PinoLogger) {
    super();
    this.logger.setContext(SampleProcessor.name);
  }

  async process(job: Job): Promise<void> {
    this.logger.info({ jobId: job.id, queueName: job.queueName }, "Processed sample job");
  }
}
