import { Controller, Get, Query, HttpCode, UseGuards, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiBearerAuth } from "@nestjs/swagger";
import { AdminOrderService } from "./admin-order.service";
import { AdminQueryOrderDto } from "./dto/admin-query-order.dto";
import { OrderListResponseDto } from "./dto/query-order.dto";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { JwtAuthGuard } from "../../shared/guards/auth.guard";
import { RolesGuard } from "../../shared/guards/roles.guard";

@ApiTags("订单管理（后台）")
@ApiBearerAuth()
@Controller("admin/order")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminOrderController {
    constructor(private readonly adminOrderService: AdminOrderService) {}

    @Get("list")
    @HttpCode(200)
    @ApiOperation({ summary: "查询订单列表（管理后台）" })
    @ApiQuery({ name: "orderNo", required: false, description: "订单号" })
    @ApiQuery({ name: "uid", required: false, description: "用户UID" })
    @ApiQuery({ name: "status", required: false, enum: ["pending", "paid", "confirmed"], description: "订单状态" })
    @ApiQuery({ name: "productId", required: false, description: "产品ID" })
    @ApiQuery({ name: "cpOrderNo", required: false, description: "游戏订单号" })
    @ApiQuery({ name: "startDate", required: false, description: "开始时间", example: "2024-01-01" })
    @ApiQuery({ name: "endDate", required: false, description: "结束时间", example: "2024-12-31" })
    @ApiQuery({ name: "page", required: false, type: Number, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: false, type: Number, description: "每页数量", example: 20 })
    @ApiResult(OrderListResponseDto)
    async getOrderList(@Query() queryDto: AdminQueryOrderDto): Promise<ResultData> {
        return this.adminOrderService.getOrderList(queryDto);
    }

    @Get("stats")
    @HttpCode(200)
    @ApiOperation({ summary: "获取订单统计信息（管理后台）" })
    async getOrderStats(): Promise<ResultData> {
        return this.adminOrderService.getOrderStats();
    }

    @Get(":orderNo")
    @HttpCode(200)
    @ApiOperation({ summary: "查询订单详情（管理后台）" })
    @ApiParam({ name: "orderNo", description: "订单号" })
    async getOrderDetail(@Param("orderNo") orderNo: string): Promise<ResultData> {
        return this.adminOrderService.getOrderDetail(orderNo);
    }
}
