import { Module } from "@nestjs/common";
import { AgentToolsController } from "./agent-tools.controller";

@Module({
    controllers: [AgentToolsController],
})
export class AgentToolsModule {}
