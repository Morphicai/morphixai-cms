import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Perm } from "../../shared/decorators/perm.decorator";
import { ResultData } from "../../shared/utils/result";
import { listAgentTools } from "./agent-tool-registry";

/** 工具提供方端点:agent-service 用发起人 token 来拉,权限门与控制台一致 */
@ApiTags("Agent 工具")
@Perm("AgentConsole")
@Controller("system/agent")
export class AgentToolsController {
    @Get("tools")
    @ApiOperation({ summary: "本服务贡献给 Agent 的工具清单(代码注册)" })
    tools(): ResultData {
        return ResultData.ok(listAgentTools());
    }
}
