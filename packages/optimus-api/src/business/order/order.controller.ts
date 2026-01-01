import { Controller, Post, Body, HttpCode, Get, Query, Req, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiQuery, ApiParam } from "@nestjs/swagger";
import { OrderService } from "./order.service";
import { CreateOrderResponseDto, CreateOrderWithAuthDto } from "./dto/create-order.dto";
import { QueryOrderDto, OrderListResponseDto } from "./dto/query-order.dto";
import { ConfirmReceiptResponseDto } from "./dto/confirm-receipt.dto";
import { OrderPaymentStatusDto, OrderPaymentDetailDto } from "./dto/order-payment-status.dto";
import { ProductListResponseDto } from "./dto/product.dto";
import { PaymentCallbackRawParams } from "./services/payment-callback.service";
import { ResultData } from "../../shared/utils/result";
import { ApiResult } from "../../shared/decorators/api-result.decorator";
import { ClientUserAuth, AnonymousAuth } from "../../shared/decorators/auth-mode.decorator";

@ApiTags("订单相关")
@Controller("/biz/order")
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @Post("create-with-auth")
    @HttpCode(200)
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "创建订单 - 使用客户端用户认证（从 Headers 获取 uid 和签名）" })
    @ApiBody({ type: CreateOrderWithAuthDto })
    @ApiResult(CreateOrderResponseDto)
    async createOrderWithAuth(@Body() dto: CreateOrderWithAuthDto, @Req() req: Express.Request): Promise<ResultData> {
        // 用户信息已经通过统一守卫验证
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }

        return this.orderService.createOrderWithAuth(dto, user.userId);
    }

    @Post("payment-callback")
    @HttpCode(200)
    @AnonymousAuth()
    @ApiOperation({ summary: "支付回调接口（发放道具接口）" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                nt_data: {
                    type: "string",
                    description: "加密的支付数据（编码后的密文），使用callbackkey解码后为XML格式",
                    example: "@171@174@188@127@182@163@148@179...",
                },
                sign: {
                    type: "string",
                    description: "签名（编码后的密文）",
                    example: "@171@174@188@127@182@163@148@179...",
                },
                md5Sign: {
                    type: "string",
                    description: "MD5签名（编码后的密文），用于验证签名",
                    example: "@171@174@188@127@182@163@148@179...",
                },
            },
            required: ["nt_data", "sign", "md5Sign"],
        },
    })
    @ApiResponse({
        status: 200,
        description: "处理成功返回SUCCESS（纯字符串），失败返回错误信息",
        content: {
            "text/plain": {
                schema: {
                    type: "string",
                    example: "SUCCESS",
                },
            },
        },
    })
    async paymentCallback(@Body() params: PaymentCallbackRawParams, @Res() res: Response): Promise<void> {
        try {
            const result = await this.orderService.handlePaymentCallback(params);
            // 返回纯字符串 SUCCESS（注意：只能返回这7个字符，不能带其他符号）
            res.status(200).setHeader("Content-Type", "text/plain").send(result);
        } catch (error) {
            // 返回非SUCCESS让SDK继续通知
            const statusCode = error.status || 400;
            const message = error.message || "处理失败";
            res.status(statusCode).setHeader("Content-Type", "text/plain").send(message);
        }
    }

    @Get("list")
    @HttpCode(200)
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "查询用户订单列表（从 Headers 获取 uid 和签名）" })
    @ApiQuery({ name: "status", required: false, enum: ["pending", "paid", "confirmed"], description: "订单状态" })
    @ApiQuery({ name: "productId", required: false, description: "产品ID" })
    @ApiQuery({ name: "page", required: false, type: Number, description: "页码，从1开始", example: 1 })
    @ApiQuery({ name: "pageSize", required: false, type: Number, description: "每页数量", example: 10 })
    @ApiResult(OrderListResponseDto)
    async getUserOrders(@Query() queryDto: QueryOrderDto, @Req() req: Express.Request): Promise<ResultData> {
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }
        return this.orderService.getUserOrders(user.userId, queryDto);
    }

    @Post(":orderNo/confirm")
    @HttpCode(200)
    @ClientUserAuth() // 使用统一的客户端用户认证，支持 GameWemade 签名
    @ApiOperation({ summary: "确认收货（从 Headers 获取 uid 和签名）" })
    @ApiParam({ name: "orderNo", description: "订单号" })
    @ApiResult(ConfirmReceiptResponseDto)
    async confirmReceipt(@Param("orderNo") orderNo: string, @Req() req: Express.Request): Promise<ResultData> {
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }
        return this.orderService.confirmReceipt(orderNo, user.userId);
    }

    @Get("verify")
    @ClientUserAuth()
    @ApiOperation({ summary: "验证 Token（从 Headers 获取 uid 和签名）" })
    async verifyToken(@Req() req: Express.Request) {
        // Token 已验证，返回用户信息
        const user = (req as any).clientUser;
        return ResultData.ok({
            message: "Token 验证成功",
            user: { userId: user.userId, userSource: user.userSource },
        });
    }

    @Get(":orderNo/payment-status")
    @HttpCode(200)
    @ClientUserAuth()
    @ApiOperation({ summary: "查询订单支付状态（C端接口）" })
    @ApiParam({ name: "orderNo", description: "订单号" })
    @ApiResult(OrderPaymentStatusDto)
    async getPaymentStatus(@Param("orderNo") orderNo: string, @Req() req: Express.Request): Promise<ResultData> {
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }
        return this.orderService.getPaymentStatus(orderNo, user.userId);
    }

    @Get(":orderNo/payment-detail")
    @HttpCode(200)
    @ClientUserAuth()
    @ApiOperation({ summary: "查询订单支付详情（C端接口）" })
    @ApiParam({ name: "orderNo", description: "订单号" })
    @ApiResult(OrderPaymentDetailDto)
    async getPaymentDetail(@Param("orderNo") orderNo: string, @Req() req: Express.Request): Promise<ResultData> {
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }
        return this.orderService.getPaymentDetail(orderNo, user.userId);
    }

    @Get(":orderNo/poll-payment")
    @HttpCode(200)
    @ClientUserAuth()
    @ApiOperation({ summary: "轮询查询订单支付状态（C端轮询接口）" })
    @ApiParam({ name: "orderNo", description: "订单号" })
    @ApiResponse({
        status: 200,
        description: "订单支付状态",
        schema: {
            type: "object",
            properties: {
                code: { type: "number", example: 200 },
                message: { type: "string", example: "success" },
                data: {
                    type: "object",
                    properties: {
                        orderNo: { type: "string" },
                        status: { type: "string", enum: ["pending", "paid", "confirmed"] },
                        isPaid: { type: "boolean" },
                        amount: { type: "number", description: "仅在已支付时返回" },
                        productId: { type: "string", description: "仅在已支付时返回" },
                        payTime: { type: "string", description: "仅在已支付时返回" },
                    },
                },
            },
        },
    })
    async pollPaymentStatus(@Param("orderNo") orderNo: string, @Req() req: Express.Request): Promise<ResultData> {
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }
        return this.orderService.pollPaymentStatus(orderNo, user.userId);
    }

    @Get("products")
    @HttpCode(200)
    @AnonymousAuth()
    @ApiOperation({ summary: "获取产品列表（无需认证）" })
    @ApiResult(ProductListResponseDto)
    async getProducts(): Promise<ResultData> {
        return this.orderService.getProducts();
    }

    @Get("products/:productId/params")
    @HttpCode(200)
    @AnonymousAuth()
    @ApiOperation({ summary: "获取商品参数要求（无需认证）" })
    @ApiParam({ name: "productId", description: "产品ID" })
    @ApiResponse({
        status: 200,
        description: "商品参数要求",
        schema: {
            type: "object",
            properties: {
                code: { type: "number", example: 200 },
                message: { type: "string", example: "success" },
                data: {
                    type: "object",
                    properties: {
                        productId: { type: "string", example: "MULTI_REGION_CREATE_ROLE" },
                        requiredParams: {
                            type: "array",
                            items: { type: "string" },
                            example: ["roleName", "serverName"],
                        },
                        optionalParams: {
                            type: "array",
                            items: { type: "string" },
                            example: ["cpOrderNo", "extrasParams.serverId"],
                        },
                    },
                },
            },
        },
    })
    async getProductParams(@Param("productId") productId: string): Promise<ResultData> {
        return this.orderService.getProductParams(productId);
    }

    @Post(":orderNo/mock-payment")
    @HttpCode(200)
    @ClientUserAuth()
    @ApiOperation({
        summary: "Mock 支付接口（仅 development 环境，C端测试用）",
        description: "模拟支付成功流程，仅在 NODE_ENV=development 时可用。用于开发和测试阶段快速验证支付流程。",
    })
    @ApiParam({ name: "orderNo", description: "订单号" })
    @ApiResponse({
        status: 200,
        description: "Mock 支付成功",
        schema: {
            type: "object",
            properties: {
                code: { type: "number", example: 200 },
                message: { type: "string", example: "success" },
                data: {
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Mock 支付成功" },
                        orderNo: { type: "string", example: "ord_1733000000_829117_a3f9" },
                        status: { type: "string", example: "paid" },
                        payTime: { type: "string", example: "2025-11-30T10:05:00.000Z" },
                        amount: { type: "number", example: 1.0 },
                    },
                },
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: "Mock 支付失败（环境不匹配或订单状态不正确）",
        schema: {
            type: "object",
            properties: {
                code: { type: "number", example: 400 },
                message: { type: "string", example: "Mock 支付仅在 development 环境可用" },
            },
        },
    })
    async mockPayment(@Param("orderNo") orderNo: string, @Req() req: Express.Request): Promise<ResultData> {
        const user = (req as any).clientUser;
        if (!user || !user.userId) {
            throw new Error("用户信息未找到");
        }
        return this.orderService.mockPayment(orderNo, user.userId);
    }
}
