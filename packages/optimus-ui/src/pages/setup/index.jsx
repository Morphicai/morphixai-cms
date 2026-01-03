/**
 * 系统安装页面
 * 用于引导用户完成系统初始化
 */

import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, Steps, Alert, Spin, Descriptions, Tag, message } from "antd";
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    DatabaseOutlined,
    ApiOutlined,
    UserOutlined,
    SettingOutlined,
} from "@ant-design/icons";
import { setupApi } from "../../apis/setup";

const { Step } = Steps;
const { TextArea } = Input;

const SetupPage = () => {
    const [loading, setLoading] = useState(true);
    const [initializing, setInitializing] = useState(false);
    const [status, setStatus] = useState(null);
    const [form] = Form.useForm();

    // 获取系统状态
    const fetchStatus = async () => {
        try {
            setLoading(true);
            const response = await setupApi.getStatus();
            if (response.success && response.data) {
                setStatus(response.data);
            } else {
                message.error(response.msg || "获取系统状态失败");
            }
        } catch (error) {
            console.error("获取系统状态失败:", error);
            message.error("获取系统状态失败");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // 初始化系统
    const handleInitialize = async (values) => {
        try {
            setInitializing(true);
            const response = await setupApi.initialize(values);
            if (response.success) {
                message.success("系统初始化成功！");
                // 重新获取状态
                await fetchStatus();
                // 延迟跳转到登录页面
                setTimeout(() => {
                    window.location.hash = '/';
                    // 刷新页面以确保应用重新检查初始化状态
                    window.location.reload();
                }, 1500);
            } else {
                message.error(response.msg || "系统初始化失败");
            }
        } catch (error) {
            console.error("系统初始化失败:", error);
            message.error("系统初始化失败");
        } finally {
            setInitializing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
                <Spin size="large" tip="正在检查系统状态..." />
            </div>
        );
    }

    const isInitialized = status?.isInitialized;
    const dbConnected = status?.databaseStatus?.connected;
    const apiStatus = status?.apiStatus?.status;

    return (
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
            <Card title={<h2>系统安装向导</h2>} style={{ marginBottom: "24px" }}>
                <Steps current={isInitialized ? 3 : dbConnected ? 1 : 0} style={{ marginBottom: "32px" }}>
                    <Step title="检查环境" icon={<ApiOutlined />} />
                    <Step title="初始化数据库" icon={<DatabaseOutlined />} />
                    <Step title="设置管理员" icon={<UserOutlined />} />
                    <Step title="完成" icon={<CheckCircleOutlined />} />
                </Steps>

                {/* 系统状态展示 */}
                <Card title="系统状态" style={{ marginBottom: "24px" }}>
                    <Descriptions column={2} bordered>
                        <Descriptions.Item label="初始化状态">
                            {isInitialized ? (
                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                    已初始化
                                </Tag>
                            ) : (
                                <Tag color="warning" icon={<CloseCircleOutlined />}>
                                    未初始化
                                </Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="数据库连接">
                            {dbConnected ? (
                                <Tag color="success" icon={<CheckCircleOutlined />}>
                                    已连接
                                </Tag>
                            ) : (
                                <Tag color="error" icon={<CloseCircleOutlined />}>
                                    未连接
                                    {status?.databaseStatus?.error && (
                                        <span style={{ marginLeft: "8px", fontSize: "12px" }}>
                                            ({status.databaseStatus.error})
                                        </span>
                                    )}
                                </Tag>
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="API服务器">
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                                {apiStatus === "ok" ? "运行中" : apiStatus}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="应用版本">
                            {status?.appVersion || "未知"}
                        </Descriptions.Item>
                        {status?.systemInfo && (
                            <>
                                <Descriptions.Item label="数据库版本">
                                    {status.systemInfo.schemaVersion || "未知"}
                                </Descriptions.Item>
                                <Descriptions.Item label="种子数据版本">
                                    {status.systemInfo.seedVersion || "未知"}
                                </Descriptions.Item>
                                <Descriptions.Item label="环境">
                                    {status.systemInfo.environment || "未知"}
                                </Descriptions.Item>
                                {status.systemInfo.initializedAt && (
                                    <Descriptions.Item label="初始化时间">
                                        {new Date(status.systemInfo.initializedAt).toLocaleString()}
                                    </Descriptions.Item>
                                )}
                            </>
                        )}
                    </Descriptions>
                </Card>

                {/* 如果已初始化，显示成功信息 */}
                {isInitialized && (
                    <Alert
                        message="系统已初始化"
                        description="系统已经完成初始化，您可以正常使用系统了。"
                        type="success"
                        showIcon
                        style={{ marginBottom: "24px" }}
                    />
                )}

                {/* 如果未初始化，显示初始化表单 */}
                {!isInitialized && (
                    <Card title="系统初始化" style={{ marginBottom: "24px" }}>
                        {!dbConnected && (
                            <Alert
                                message="数据库连接失败"
                                description={
                                    status?.databaseStatus?.error ||
                                    "请检查数据库配置是否正确，确保数据库服务正在运行。"
                                }
                                type="error"
                                showIcon
                                style={{ marginBottom: "24px" }}
                            />
                        )}

                        {dbConnected && (
                            <>
                                <Alert
                                    message="准备初始化系统"
                                    description="请填写以下信息完成系统初始化。初始化过程包括：1. 初始化数据库结构 2. 创建管理员账户 3. 设置系统信息"
                                    type="info"
                                    showIcon
                                    style={{ marginBottom: "24px" }}
                                />

                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={handleInitialize}
                                    initialValues={{
                                        account: "admin",
                                        fullName: "系统管理员",
                                    }}
                                >
                                    <Form.Item
                                        label="管理员账号"
                                        name="account"
                                        rules={[
                                            { required: true, message: "请输入管理员账号" },
                                            { min: 5, message: "账号至少5个字符" },
                                            { max: 20, message: "账号最多20个字符" },
                                        ]}
                                    >
                                        <Input prefix={<UserOutlined />} placeholder="请输入管理员账号" />
                                    </Form.Item>

                                    <Form.Item
                                        label="管理员密码"
                                        name="password"
                                        rules={[
                                            { required: true, message: "请输入管理员密码" },
                                            { min: 6, message: "密码至少6个字符" },
                                        ]}
                                    >
                                        <Input.Password prefix={<SettingOutlined />} placeholder="请输入管理员密码" />
                                    </Form.Item>

                                    <Form.Item label="管理员姓名" name="fullName">
                                        <Input placeholder="请输入管理员姓名（可选）" />
                                    </Form.Item>

                                    <Form.Item
                                        label="管理员邮箱"
                                        name="email"
                                        rules={[{ type: "email", message: "请输入正确的邮箱地址" }]}
                                    >
                                        <Input placeholder="请输入管理员邮箱（可选）" />
                                    </Form.Item>

                                    <Form.Item label="管理员手机号" name="phoneNum">
                                        <Input placeholder="请输入管理员手机号（可选）" />
                                    </Form.Item>

                                    <Form.Item label="站点名称" name="siteName">
                                        <Input placeholder="请输入站点名称（可选）" />
                                    </Form.Item>

                                    <Form.Item label="站点描述" name="siteDescription">
                                        <TextArea rows={3} placeholder="请输入站点描述（可选）" />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={initializing}
                                            size="large"
                                            block
                                        >
                                            {initializing ? "正在初始化..." : "开始初始化"}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </>
                        )}
                    </Card>
                )}
            </Card>
        </div>
    );
};

export default SetupPage;

