import { Module } from "@nestjs/common";
import { ConsoleController } from "./console.controller";
import { ConsoleContextService } from "./console-context.service";

@Module({
  controllers: [ConsoleController],
  providers: [ConsoleContextService],
})
export class ConsoleModule {}
