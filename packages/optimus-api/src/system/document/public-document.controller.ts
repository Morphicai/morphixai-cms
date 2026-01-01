import { Controller, Get, Param, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam } from "@nestjs/swagger";

import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { ResultData } from "../../shared/utils/result";

import { DocumentService } from "./document.service";
import { DocumentEntity } from "./entities/document.entity";

@ApiTags("公开文档接口")
@Controller("public/document")
export class PublicDocumentController {
    constructor(private readonly documentService: DocumentService) {}

    @Get(":docKey")
    @HttpCode(200)
    @ApiOperation({ summary: "根据文档标识获取公开文档内容" })
    @ApiParam({ name: "docKey", description: "文档标识符", type: String })
    @AllowAnonymous()
    @ApiResult(DocumentEntity)
    async getPublicDocument(@Param("docKey") docKey: string): Promise<ResultData> {
        return this.documentService.getPublicDocumentByKey(docKey);
    }
}
