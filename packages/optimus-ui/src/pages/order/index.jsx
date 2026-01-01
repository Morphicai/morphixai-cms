import React, { useState } from "react";
import { Card, Table, Form, Input, Select, Button, Space, DatePicker, Tag, Statistic, Row, Col, Modal, Descriptions } from "antd";
import { SearchOutlined, ReloadOutlined, DollarOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMount } from "../../shared/hooks";
import orderService from "../../services/OrderService";

const { RangePicker } = DatePicker;
const { Option } = Select;

const OrderManagement = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });
    const [stats, setStats] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [currentOrder, setCurrentOrder] = useState(null);

    // 订单状态映射
    const statusMap = {
        pending: { text: "待支付", color: "orange" },
        paid: { text: "已支付", color: "green" },
        confirmed: { text: "已确认", color: "blue" },
    };

    // 加载订单列表
    const fetchOrders = async (params = {}) => {
        setLoading(true);
        try {
            const response = await orderService.list({
                page: pagination.current,
                pageSize: pagination.pageSize,
                ...params,
            });

            if (response.code === 200) {
                setDataSource(response.data.items);
                setPagination((prev) => ({
                    ...prev,
                    total: response.data.total,
                }));
            }
        } catch (error) {
            console.error("加载订单列表失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 加载统计数据
    const fetchStats = async () => {
        try {
            const response = await orderService.getStats();
            if (response.code === 200) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("加载统计数据失败:", error);
        }
    };

    // 查看订单详情
    const handleViewDetail = async (orderNo) => {
        try {
            const response = await orderService.getDetail(orderNo);
            if (response.code === 200) {
                setCurrentOrder(response.data);
                setDetailVisible(true);
            }
        } catch (error) {
            console.error("加载订单详情失败:", error);
        }
    };

    // 搜索
    const handleSearch = () => {
        const values = form.getFieldsValue();
        const params = {};

        if (values.orderNo) params.orderNo = values.orderNo;
        if (values.uid) params.uid = values.uid;
        if (values.status) params.status = values.status;
        if (values.productId) params.productId = values.productId;
        if (values.cpOrderNo) params.cpOrderNo = values.cpOrderNo;
        if (values.dateRange && values.dateRange.length === 2) {
            params.startDate = values.dateRange[0].format("YYYY-MM-DD");
            params.endDate = values.dateRange[1].format("YYYY-MM-DD");
        }

        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchOrders(params);
    };

    // 重置
    const handleReset = () => {
        form.resetFields();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchOrders();
    };

    // 表格列配置
    const columns = [
        {
            title: "订单号",
            dataIndex: "orderNo",
            key: "orderNo",
            width: 200,
            fixed: "left",
        },
        {
            title: "用户UID",
            dataIndex: "uid",
            key: "uid",
            width: 150,
        },
        {
            title: "产品ID",
            dataIndex: "productId",
            key: "productId",
            width: 200,
        },
        {
            title: "金额",
            dataIndex: "amount",
            key: "amount",
            width: 100,
            render: (amount) => `¥${amount}`,
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            width: 100,
            render: (status) => (
                <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
            ),
        },
        {
            title: "角色名",
            dataIndex: "roleName",
            key: "roleName",
            width: 120,
        },
        {
            title: "区服名",
            dataIndex: "serverName",
            key: "serverName",
            width: 120,
        },
        {
            title: "支付时间",
            dataIndex: "payTime",
            key: "payTime",
            width: 180,
            render: (time) => (time ? dayjs(time).format("YYYY-MM-DD HH:mm:ss") : "-"),
        },
        {
            title: "创建时间",
            dataIndex: "createDate",
            key: "createDate",
            width: 180,
            render: (time) => dayjs(time).format("YYYY-MM-DD HH:mm:ss"),
        },
        {
            title: "操作",
            key: "action",
            width: 100,
            fixed: "right",
            render: (_, record) => (
                <Button type="link" size="small" onClick={() => handleViewDetail(record.orderNo)}>
                    详情
                </Button>
            ),
        },
    ];

    // 表格分页变化
    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
        const values = form.getFieldsValue();
        const params = {};

        if (values.orderNo) params.orderNo = values.orderNo;
        if (values.uid) params.uid = values.uid;
        if (values.status) params.status = values.status;
        if (values.productId) params.productId = values.productId;
        if (values.cpOrderNo) params.cpOrderNo = values.cpOrderNo;
        if (values.dateRange && values.dateRange.length === 2) {
            params.startDate = values.dateRange[0].format("YYYY-MM-DD");
            params.endDate = values.dateRange[1].format("YYYY-MM-DD");
        }

        fetchOrders({ ...params, page: newPagination.current, pageSize: newPagination.pageSize });
    };

    useMount(() => {
        fetchOrders();
        fetchStats();
    });

    return (
        <div style={{ padding: "24px" }}>
            {/* 统计卡片 */}
            {stats && (
                <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="总订单数"
                                value={stats.totalOrders}
                                prefix={<ShoppingCartOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="待支付订单"
                                value={stats.pendingOrders}
                                valueStyle={{ color: "#faad14" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="已支付订单"
                                value={stats.paidOrders}
                                valueStyle={{ color: "#52c41a" }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="已支付金额"
                                value={stats.paidAmount}
                                precision={2}
                                prefix={<DollarOutlined />}
                                valueStyle={{ color: "#1890ff" }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* 搜索表单 */}
            <Card style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline">
                    <Form.Item name="orderNo" label="订单号">
                        <Input placeholder="请输入订单号" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="uid" label="用户UID">
                        <Input placeholder="请输入用户UID" style={{ width: 150 }} />
                    </Form.Item>
                    <Form.Item name="status" label="订单状态">
                        <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
                            <Option value="pending">待支付</Option>
                            <Option value="paid">已支付</Option>
                            <Option value="confirmed">已确认</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="productId" label="产品ID">
                        <Input placeholder="请输入产品ID" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="cpOrderNo" label="游戏订单号">
                        <Input placeholder="请输入游戏订单号" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="dateRange" label="创建时间">
                        <RangePicker style={{ width: 260 }} />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                搜索
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleReset}>
                                重置
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* 订单列表 */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1500 }}
                />
            </Card>

            {/* 订单详情弹窗 */}
            <Modal
                title="订单详情"
                open={detailVisible}
                onCancel={() => setDetailVisible(false)}
                footer={null}
                width={800}
            >
                {currentOrder && (
                    <Descriptions bordered column={2}>
                        <Descriptions.Item label="订单号" span={2}>
                            {currentOrder.orderNo}
                        </Descriptions.Item>
                        <Descriptions.Item label="用户UID">{currentOrder.uid}</Descriptions.Item>
                        <Descriptions.Item label="产品ID">{currentOrder.productId}</Descriptions.Item>
                        <Descriptions.Item label="订单金额">¥{currentOrder.amount}</Descriptions.Item>
                        <Descriptions.Item label="订单状态">
                            <Tag color={statusMap[currentOrder.status]?.color}>
                                {statusMap[currentOrder.status]?.text}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="游戏订单号">
                            {currentOrder.cpOrderNo || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="支付渠道订单号">
                            {currentOrder.channelOrderNo || "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="角色名">{currentOrder.roleName || "-"}</Descriptions.Item>
                        <Descriptions.Item label="区服名">{currentOrder.serverName || "-"}</Descriptions.Item>
                        <Descriptions.Item label="支付时间" span={2}>
                            {currentOrder.payTime ? dayjs(currentOrder.payTime).format("YYYY-MM-DD HH:mm:ss") : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="确认时间" span={2}>
                            {currentOrder.confirmTime ? dayjs(currentOrder.confirmTime).format("YYYY-MM-DD HH:mm:ss") : "-"}
                        </Descriptions.Item>
                        <Descriptions.Item label="创建时间" span={2}>
                            {dayjs(currentOrder.createDate).format("YYYY-MM-DD HH:mm:ss")}
                        </Descriptions.Item>
                        <Descriptions.Item label="更新时间" span={2}>
                            {dayjs(currentOrder.updateDate).format("YYYY-MM-DD HH:mm:ss")}
                        </Descriptions.Item>
                        {currentOrder.extrasParams && Object.keys(currentOrder.extrasParams).length > 0 && (
                            <Descriptions.Item label="扩展参数" span={2}>
                                <pre>{JSON.stringify(currentOrder.extrasParams, null, 2)}</pre>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;
