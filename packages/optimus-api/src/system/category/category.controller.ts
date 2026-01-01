import {
    Controller,
    Get,
    Post,
    Body,
    Put,
    Param,
    Delete,
    Query,
    UseGuards,
    ParseIntPipe,
    HttpCode,
    HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger";
import { CategoryService } from "./category.service";
import { CreateCategoryDto, UpdateCategoryDto, FindAllCategoryDto } from "./dto";
import { JwtAuthGuard } from "../../shared/guards/auth.guard";
import { ResultData } from "../../shared/utils/result";
import { CategoryEntity } from "./entities/category.entity";

@ApiTags("分类管理")
@Controller("category")
@UseGuards(JwtAuthGuard)
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    @ApiOperation({ summary: "创建分类" })
    @ApiResponse({ status: 201, description: "分类创建成功", type: ResultData })
    @ApiResponse({ status: 400, description: "请求参数错误" })
    @ApiResponse({ status: 409, description: "分类代码已存在" })
    async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ResultData> {
        const category = await this.categoryService.create(createCategoryDto);
        return ResultData.ok(category, "分类创建成功");
    }

    @Get()
    @ApiOperation({ summary: "获取分类列表" })
    @ApiResponse({ status: 200, description: "获取分类列表成功", type: ResultData })
    @ApiQuery({ name: "isBuiltIn", required: false, type: Boolean, description: "是否只返回内置分类" })
    @ApiQuery({ name: "parentId", required: false, type: Number, description: "父分类ID" })
    @ApiQuery({ name: "name", required: false, type: String, description: "分类名称搜索" })
    @ApiQuery({ name: "tree", required: false, type: Boolean, description: "是否返回树形结构" })
    @ApiQuery({ name: "page", required: false, type: Number, description: "页码" })
    @ApiQuery({ name: "limit", required: false, type: Number, description: "每页数量" })
    async findAll(@Query() query: FindAllCategoryDto): Promise<ResultData> {
        const result = await this.categoryService.findAll(query);
        return ResultData.ok(result, "获取分类列表成功");
    }

    @Get("built-in/list")
    @ApiOperation({ summary: "获取内置分类" })
    @ApiResponse({ status: 200, description: "获取内置分类成功", type: ResultData })
    async getBuiltInCategories(): Promise<ResultData> {
        const categories = await this.categoryService.getBuiltInCategories();
        return ResultData.ok(categories, "获取内置分类成功");
    }

    @Get("code/:code")
    @ApiOperation({ summary: "根据代码获取分类" })
    @ApiResponse({ status: 200, description: "获取分类成功", type: ResultData })
    @ApiResponse({ status: 404, description: "分类不存在" })
    @ApiParam({ name: "code", description: "分类代码" })
    async findByCode(@Param("code") code: string): Promise<ResultData> {
        const category = await this.categoryService.findByCode(code);
        return ResultData.ok(category, "获取分类成功");
    }

    @Get(":id")
    @ApiOperation({ summary: "获取分类详情" })
    @ApiResponse({ status: 200, description: "获取分类详情成功", type: ResultData })
    @ApiResponse({ status: 404, description: "分类不存在" })
    @ApiParam({ name: "id", description: "分类ID" })
    async findOne(@Param("id", ParseIntPipe) id: number): Promise<ResultData> {
        const category = await this.categoryService.findOne(id);
        return ResultData.ok(category, "获取分类详情成功");
    }

    @Put(":id")
    @ApiOperation({ summary: "更新分类" })
    @ApiResponse({ status: 200, description: "分类更新成功", type: ResultData })
    @ApiResponse({ status: 400, description: "请求参数错误" })
    @ApiResponse({ status: 404, description: "分类不存在" })
    @ApiParam({ name: "id", description: "分类ID" })
    async update(
        @Param("id", ParseIntPipe) id: number,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ): Promise<ResultData> {
        const category = await this.categoryService.update(id, updateCategoryDto);
        return ResultData.ok(category, "分类更新成功");
    }

    @Delete(":id")
    @ApiOperation({ summary: "删除分类" })
    @ApiResponse({ status: 200, description: "分类删除成功", type: ResultData })
    @ApiResponse({ status: 400, description: "分类不能删除（内置分类或有关联数据）" })
    @ApiResponse({ status: 404, description: "分类不存在" })
    @ApiParam({ name: "id", description: "分类ID" })
    @HttpCode(HttpStatus.OK)
    async remove(@Param("id", ParseIntPipe) id: number): Promise<ResultData> {
        await this.categoryService.remove(id);
        return ResultData.ok(null, "分类删除成功");
    }

    @Get(":id/config")
    @ApiOperation({ summary: "获取分类配置" })
    @ApiResponse({ status: 200, description: "获取分类配置成功", type: ResultData })
    @ApiResponse({ status: 404, description: "分类不存在" })
    @ApiParam({ name: "id", description: "分类ID" })
    async getCategoryConfig(@Param("id", ParseIntPipe) id: number): Promise<ResultData> {
        const config = await this.categoryService.getCategoryConfig(id);
        return ResultData.ok(config, "获取分类配置成功");
    }

    @Post(":id/validate-article")
    @ApiOperation({ summary: "验证文章是否符合分类配置" })
    @ApiResponse({ status: 200, description: "验证成功", type: ResultData })
    @ApiResponse({ status: 400, description: "验证失败" })
    @ApiResponse({ status: 404, description: "分类不存在" })
    @ApiParam({ name: "id", description: "分类ID" })
    async validateArticle(
        @Param("id", ParseIntPipe) id: number,
        @Body() articleData: { coverImages?: string[] },
    ): Promise<ResultData> {
        await this.categoryService.validateArticleAgainstCategory(id, articleData);
        return ResultData.ok(null, "文章符合分类配置要求");
    }
}
