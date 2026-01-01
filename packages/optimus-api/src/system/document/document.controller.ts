import { Controller, Get, Post, Delete, Param, Body, Query, Req, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from "@nestjs/swagger";

import { AllowAnonymous } from "../../shared/decorators/allow-anonymous.decorator";
import { AllowNoPerm } from "../../shared/decorators/perm.decorator";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { ResultData } from "../../shared/utils/result";

import { DocumentService } from "./document.service";
import { CreateDocumentDto } from "./dto/create-document.dto";
import { FindDocumentDto } from "./dto/find-document.dto";
import { UpdateDocumentDto } from "./dto/update-document.dto";
import { FindAllDocumentDto } from "./dto/find-all-document.dto";

import { DocumentEntity } from "./entities/document.entity";

@ApiTags("文案中心")
@ApiBearerAuth()
@Controller("document")
export class DocumentController {
    constructor(private readonly documentService: DocumentService) {}

    @Post()
    @HttpCode(200)
    @ApiOperation({ summary: "创建文案中心" })
    @ApiResult(DocumentEntity)
    create(@Body() createDocumentDto: CreateDocumentDto, @Req() req) {
        return this.documentService.create(req.user.id, createDocumentDto);
    }

    @Post("getAppResource")
    @HttpCode(200)
    @ApiOperation({ summary: "获取文案中心 - ToC使用的接口" })
    @AllowAnonymous()
    @ApiResult(DocumentEntity)
    findOne(@Body() findDocumentDto: FindDocumentDto): Promise<ResultData> {
        return this.documentService.findOne(findDocumentDto);
    }

    @Post("getAppLatestResource")
    @HttpCode(200)
    @ApiOperation({
        summary: "获取无缓存的文案中心值",
        description: "该接口推荐在后台、量不大的系统中使用，如果访问量较大，建议使用 getAppResource",
    })
    @AllowNoPerm()
    @ApiResult(DocumentEntity)
    findLatestResource(@Body() findDocumentDto: FindDocumentDto): Promise<ResultData> {
        return this.documentService.findOne(findDocumentDto);
    }

    @Post("getResById/:id")
    @HttpCode(200)
    @AllowNoPerm()
    @ApiOperation({ summary: "根据文案中心ID获取值" })
    @ApiResult(DocumentEntity)
    findOneById(@Param("id") id: number): Promise<ResultData> {
        return this.documentService.findOneById(id);
    }

    @Get("list")
    @HttpCode(200)
    @ApiOperation({ summary: "分页查询所有文案中心" })
    @ApiResult(DocumentEntity, true, true)
    findAll(@Query() search: FindAllDocumentDto): Promise<ResultData> {
        return this.documentService.findAll(search);
    }

    @Get("getAllMenuDocuments")
    @HttpCode(200)
    @ApiOperation({
        summary: "查询所有需要展示在菜单上的文案中心",
        description: "后续将移除该API，将该功能移植到/perm/menus上",
    })
    findAllMenuDocuments(@Req() req): Promise<ResultData> {
        return this.documentService.findAllMenuDocuments(req.user);
    }

    @Post("update")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                docKey: {
                    type: "string",
                    format: "string",
                },
                source: {
                    type: "string",
                    format: "string",
                },
                type: {
                    type: "string",
                    format: "string",
                },
                content: {
                    type: "string",
                    format: "string",
                },
            },
        },
    })
    @HttpCode(200)
    @ApiOperation({ summary: "更新文案中心" })
    @ApiResult(DocumentEntity)
    update(@Body() docDto: UpdateDocumentDto): Promise<ResultData> {
        return this.documentService.update(docDto);
    }

    @Post("updateById/:id")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                docKey: {
                    type: "string",
                    format: "string",
                },
                source: {
                    type: "string",
                    format: "string",
                },
                type: {
                    type: "string",
                    format: "string",
                },
                content: {
                    type: "string",
                    format: "string",
                },
            },
        },
    })
    @HttpCode(200)
    @ApiOperation({ summary: "根据 ID 更新文案中心" })
    @ApiResult(DocumentEntity)
    updateById(@Param("id") id: number, @Body() docDto: UpdateDocumentDto): Promise<ResultData> {
        return this.documentService.update(docDto, id);
    }

    @Delete(":id")
    @HttpCode(200)
    @ApiOperation({ summary: "删除文案中心条目" })
    @ApiResult(DocumentEntity)
    remove(@Param("id") id: number): Promise<ResultData> {
        return this.documentService.remove(id);
    }

    @Get("checkDocKey/:docKey")
    @HttpCode(200)
    @ApiOperation({ summary: "检查文档标识符是否已存在" })
    @ApiResult()
    checkDocKeyExists(@Param("docKey") docKey: string, @Query("excludeId") excludeId?: number): Promise<ResultData> {
        return this.documentService.checkDocKeyExists(docKey, excludeId);
    }
}
