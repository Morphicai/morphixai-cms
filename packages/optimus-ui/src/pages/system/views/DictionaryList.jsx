import React, { useState } from "react";
import { Card, Table, Tag, Button, Space } from "antd";
import { DatabaseOutlined, RightOutlined } from "@ant-design/icons";
import { useMount } from "../../../shared/hooks";
import { useNavigate } from "react-router-dom";
import dictionaryService from "../../../services/DictionaryService";

const DictionaryList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);

    // 访问类型映射
    const accessTypeMap = {
        private: { text: "后台私有", color: "default" },
        public_read: { text: "C端公开读", color: "blue" },
        public_write: { text: "C端公开读写", color: "green" },
        user_private: { text: "用户私有", color: "purple" },
    };

    // 加载集合列表
    const fetchCollections = async () => {
        setLoading(true);
        try {
            const response = await dictionaryService.listCollections({
                page: 1,
                pageSize: 1000,
                status: "active",
            });

            if (response.code === 200) {
                setDataSource(response.data.items);
            }
        } catch (error) {
            console.error("加载集合列表失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 进入集合详情
    const handleViewCollection = (collection) => {
        navigate(`/sys/dictionary/${collection.name}`);
    };

    // 表格列配置
    const columns = [
        {
            title: "集合名称",
            dataIndex: "name",
            key: "name",
            width: 200,
            render: (name, record) => (
                <Space>
                    <DatabaseOutlined style={{ color: "#1890ff" }} />
                    <span style={{ fontWeight: 500 }}>{name}</span>
                </Space>
            ),
        },
        {
            title: "显示名称",
            dataIndex: "displayName",
            key: "displayName",
            width: 150,
        },
        {
            title: "描述",
            dataIndex: "description",
            key: "description",
            ellipsis: true,
        },
        {
            title: "数据类型",
            dataIndex: "dataType",
            key: "dataType",
            width: 100,
        },
        {
            title: "访问类型",
            dataIndex: "accessType",
            key: "accessType",
            width: 130,
            render: (accessType) => (
                <Tag color={accessTypeMap[accessType]?.color}>{accessTypeMap[accessType]?.text}</Tag>
            ),
        },
        {
            title: "最大条目数",
            dataIndex: "maxItems",
            key: "maxItems",
            width: 110,
        },
        {
            title: "每用户限制",
            dataIndex: "maxItemsPerUser",
            key: "maxItemsPerUser",
            width: 110,
            render: (value, record) => (
                record.accessType === 'user_private' ? value : '-'
            ),
        },
        {
            title: "操作",
            key: "action",
            width: 120,
            fixed: "right",
            render: (_, record) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<RightOutlined />}
                    onClick={() => handleViewCollection(record)}
                >
                    查看数据
                </Button>
            ),
        },
    ];

    useMount(() => {
        fetchCollections();
    });

    return (
        <div style={{ padding: "24px" }}>
            <Card
                title={
                    <Space>
                        <DatabaseOutlined />
                        <span>字典集合列表</span>
                    </Space>
                }
            >
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 1200 }}
                />
            </Card>
        </div>
    );
};

export default DictionaryList;
