import { useRef, useState } from "react";
import { ProTable } from "@ant-design/pro-table";
import { Button, message, Tag } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import AppointmentService from "../../../services/AppointmentService";

/**
 * 预约记录 ProTable 组件
 */
const AppointmentProTable = () => {
    const actionRef = useRef();
    const [exporting, setExporting] = useState(false);

    // 处理导出
    const handleExport = async () => {
        setExporting(true);
        try {
            const result = await AppointmentService.export({});
            if (result.success) {
                message.success("导出成功");
            } else {
                message.error(result.error || "导出失败");
            }
        } catch (error) {
            console.error("导出失败:", error);
            message.error("导出失败：" + (error.message || "未知错误"));
        } finally {
            setExporting(false);
        }
    };

    // 列配置
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
            hideInSearch: true,
        },
        {
            title: "手机号",
            dataIndex: "phone",
            key: "phone",
            width: 150,
            fieldProps: {
                placeholder: "请输入手机号",
            },
        },
        {
            title: "阶段",
            dataIndex: "stage",
            key: "stage",
            width: 120,
            fieldProps: {
                placeholder: "请输入阶段",
            },
        },
        {
            title: "渠道",
            dataIndex: "channel",
            key: "channel",
            width: 120,
            fieldProps: {
                placeholder: "请输入渠道",
            },
        },
        {
            title: "预约时间",
            dataIndex: "appointmentTime",
            key: "appointmentTime",
            width: 180,
            hideInSearch: true,
            render: (time) => {
                if (!time) return "-";
                return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
            },
        },
        {
            title: "额外字段1",
            dataIndex: "extraField1",
            key: "extraField1",
            width: 200,
            hideInSearch: true,
            ellipsis: true,
            render: (text) => {
                if (!text) return "-";
                return <Tag color="blue">{text}</Tag>;
            },
        },
        {
            title: "创建时间",
            dataIndex: "createDate",
            key: "createDate",
            width: 180,
            valueType: "dateTime",
            hideInSearch: true,
            sorter: true,
        },
    ];

    // 请求数据
    const request = async (params, sort) => {
        try {
            const { current = 1, pageSize = 10, phone, stage, channel } = params;

            const queryParams = {
                page: current || 1,
                pageSize: pageSize || 10,
                phone,
                stage,
                channel,
            };

            // 处理排序参数
            if (sort && Object.keys(sort).length > 0) {
                const sortField = Object.keys(sort)[0];
                const sortOrder = sort[sortField];
                queryParams.sortField = sortField;
                queryParams.sortOrder = sortOrder;
            }

            const response = await AppointmentService.list(queryParams);

            if (response.success) {
                return {
                    data: response.data || [],
                    success: true,
                    total: response.total || 0,
                };
            }

            return {
                data: [],
                success: false,
                total: 0,
            };
        } catch (error) {
            console.error("获取预约记录列表失败:", error);
            return {
                data: [],
                success: false,
                total: 0,
            };
        }
    };

    return (
        <ProTable
            columns={columns}
            actionRef={actionRef}
            request={request}
            rowKey="id"
            pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                pageSizeOptions: ["10", "20", "50", "100"],
            }}
            search={{
                labelWidth: "auto",
                defaultCollapsed: false,
                span: 6,
            }}
            form={{
                syncToUrl: false,
                size: "middle",
            }}
            dateFormatter="string"
            headerTitle="预约记录管理"
            toolBarRender={() => [
                <Button
                    key="export"
                    type="primary"
                    icon={<DownloadOutlined />}
                    loading={exporting}
                    disabled={exporting}
                    onClick={handleExport}
                >
                    {exporting ? "导出中..." : "导出 Excel"}
                </Button>,
            ]}
            scroll={{ x: 1200 }}
            options={{
                reload: true,
                density: true,
                setting: true,
                fullScreen: false,
            }}
        />
    );
};

export default AppointmentProTable;
