import React, { useState } from "react";
import {
    Card,
    Table,
    Form,
    Input,
    Select,
    Button,
    Space,
    Modal,
    message,
    Tag,
    Popconfirm,
    InputNumber,
    Tabs,
} from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMount } from "../../../shared/hooks";
import dictionaryService from "../../../services/DictionaryService";

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const Dictionary = () => {
    const [form] = Form.useForm();
    const [modalForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [collections, setCollections] = useState([]);
    const [activeCollection, setActiveCollection] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [currentRecord, setCurrentRecord] = useState(null);

    // 加载集合列表
    const fetchCollections = async () => {
        try {
            const response = await dictionaryService.listCollections({
                page: 1,
                pageSize: 1000,
                status: "active",
            });

            if (response.code === 200) {
                setCollections(response.data.items);
                if (response.data.items.length > 0 && !activeCollection) {
                    setActiveCollection(response.data.items[0].name);
                }
            }
        } catch (error) {
            console.error("加载集合列表失败:", error);
        }
    };

    // 加载字典列表
    const fetchDictionaries = async (collection, params = {}) => {
        if (!collection) return;

        setLoading(true);
        try {
            const response = await dictionaryService.list({
                collection,
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
            message.error("加载数据失败");
            console.error("加载数据失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 切换集合
    const handleTabChange = (collection) => {
        setActiveCollection(collection);
        setPagination((prev) => ({ ...prev, current: 1 }));
        form.resetFields();
        fetchDictionaries(collection);
    };

    // 搜索
    const handleSearch = () => {
        const values = form.getFieldsValue();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchDictionaries(activeCollection, values);
    };

    // 重置
    const handleReset = () => {
        form.resetFields();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchDictionaries(activeCollection);
    };

    // 打开创建弹窗
    const handleCreate = () => {
        setModalType("create");
        setCurrentRecord(null);
        modalForm.resetFields();
        modalForm.setFieldsValue({ collection: activeCollection });
        setModalVisible(true);
    };

    // 打开编辑弹窗
    const handleEdit = (record) => {
        setModalType("edit");
        setCurrentRecord(record);
        modalForm.setFieldsValue({
            collection: record.collection,
            key: record.key,
            value: JSON.stringify(record.value, null, 2),
            sortOrder: record.sortOrder,
            status: record.status,
            remark: record.remark,
        });
        setModalVisible(true);
    };

    // 删除字典
    const handleDelete = async (id) => {
        try {
            const response = await dictionaryService.delete(id);
            if (response.code === 200) {
                message.success("删除成功");
                fetchDictionaries(activeCollection);
            }
        } catch (error) {
            message.error("删除失败");
            console.error("删除失败:", error);
        }
    };

    // 提交表单
    const handleModalOk = async () => {
        try {
            const values = await modalForm.validateFields();

            // 解析 JSON 值
            let parsedValue;
            try {
                parsedValue = JSON.parse(values.value);
            } catch (error) {
                message.error("值必须是有效的 JSON 格式");
                return;
            }

            const data = {
                ...values,
                value: parsedValue,
            };

            if (modalType === "create") {
                const response = await dictionaryService.create(data);
                if (response.code === 200) {
                    message.success("创建成功");
                    setModalVisible(false);
                    fetchDictionaries(activeCollection);
                }
            } else {
                const response = await dictionaryService.update(currentRecord.id, data);
                if (response.code === 200) {
                    message.success("更新成功");
                    setModalVisible(false);
                    fetchDictionaries(activeCollection);
                }
            }
        } catch (error) {
            console.error("操作失败:", error);
        }
    };

    // 表格列配置
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: 80,
        },
        {
            title: "键",
            dataIndex: "key",
            key: "key",
            width: 200,
        },
        {
            title: "值",
            dataIndex: "value",
            key: "value",
            ellipsis: true,
            render: (value) => (
                <pre style={{ margin: 0, maxHeight: 100, overflow: "auto" }}>
                    {JSON.stringify(value, null, 2)}
                </pre>
            ),
        },
        {
            title: "排序",
            dataIndex: "sortOrder",
            key: "sortOrder",
            width: 80,
        },
        {
            title: "状态",
            dataIndex: "status",
            key: "status",
            width: 80,
            render: (status) => (
                <Tag color={status === "active" ? "green" : "default"}>
                    {status === "active" ? "启用" : "禁用"}
                </Tag>
            ),
        },
        {
            title: "备注",
            dataIndex: "remark",
            key: "remark",
            width: 150,
            ellipsis: true,
        },
        {
            title: "操作",
            key: "action",
            width: 150,
            fixed: "right",
            render: (_, record) => (
                <Space>
                    <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                        编辑
                    </Button>
                    <Popconfirm
                        title="确定要删除这条数据吗？"
                        onConfirm={() => handleDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                            删除
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // 表格分页变化
    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
        const values = form.getFieldsValue();
        fetchDictionaries(activeCollection, { ...values, page: newPagination.current, pageSize: newPagination.pageSize });
    };

    useMount(() => {
        fetchCollections();
    });

    // 当集合列表加载完成后，加载第一个集合的数据
    React.useEffect(() => {
        if (activeCollection) {
            fetchDictionaries(activeCollection);
        }
    }, [activeCollection]);

    // 获取当前集合信息
    const currentCollection = collections.find((c) => c.name === activeCollection);

    return (
        <div style={{ padding: "24px" }}>
            {/* 集合标签页 */}
            <Card>
                <Tabs activeKey={activeCollection} onChange={handleTabChange} type="card">
                    {collections.map((collection) => (
                        <TabPane
                            tab={
                                <span>
                                    {collection.displayName}
                                    <Tag style={{ marginLeft: 8 }} color={
                                        collection.accessType === 'private' ? 'default' :
                                        collection.accessType === 'public_read' ? 'blue' :
                                        collection.accessType === 'public_write' ? 'green' :
                                        'purple'
                                    }>
                                        {collection.accessType === 'private' ? '私有' :
                                         collection.accessType === 'public_read' ? '公开读' :
                                         collection.accessType === 'public_write' ? '公开读写' :
                                         '用户私有'}
                                    </Tag>
                                </span>
                            }
                            key={collection.name}
                        />
                    ))}
                </Tabs>

                {/* 集合描述 */}
                {currentCollection && (
                    <div style={{ marginTop: 16, padding: "12px 16px", background: "#f5f5f5", borderRadius: 4 }}>
                        <Space direction="vertical" size={4}>
                            <div><strong>集合名称：</strong>{currentCollection.name}</div>
                            <div><strong>描述：</strong>{currentCollection.description || "无"}</div>
                            <div>
                                <strong>数据类型：</strong>{currentCollection.dataType}
                                <span style={{ marginLeft: 24 }}><strong>最大条目数：</strong>{currentCollection.maxItems}</span>
                                {currentCollection.accessType === 'user_private' && (
                                    <span style={{ marginLeft: 24 }}><strong>每用户限制：</strong>{currentCollection.maxItemsPerUser}</span>
                                )}
                            </div>
                        </Space>
                    </div>
                )}
            </Card>

            {/* 搜索表单 */}
            <Card style={{ marginTop: 16 }}>
                <Form form={form} layout="inline">
                    <Form.Item name="key" label="键">
                        <Input placeholder="请输入键" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                        <Select placeholder="请选择状态" style={{ width: 120 }} allowClear>
                            <Option value="active">启用</Option>
                            <Option value="inactive">禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                                搜索
                            </Button>
                            <Button icon={<ReloadOutlined />} onClick={handleReset}>
                                重置
                            </Button>
                            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                                新建数据
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* 数据列表 */}
            <Card style={{ marginTop: 16 }}>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1200 }}
                />
            </Card>

            {/* 创建/编辑弹窗 */}
            <Modal
                title={modalType === "create" ? "新建数据" : "编辑数据"}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                width={700}
            >
                <Form form={modalForm} layout="vertical">
                    <Form.Item name="collection" label="集合" hidden>
                        <Input disabled />
                    </Form.Item>
                    <Form.Item
                        name="key"
                        label="键"
                        rules={[{ required: true, message: "请输入键" }]}
                    >
                        <Input placeholder="例如: language" disabled={modalType === "edit"} />
                    </Form.Item>
                    <Form.Item
                        name="value"
                        label="值（JSON 格式）"
                        rules={[{ required: true, message: "请输入值" }]}
                    >
                        <TextArea
                            rows={10}
                            placeholder='例如: {"name": "测试", "value": 123}'
                            style={{ fontFamily: "monospace" }}
                        />
                    </Form.Item>
                    <Form.Item name="sortOrder" label="排序" initialValue={0}>
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="status" label="状态" initialValue="active">
                        <Select>
                            <Option value="active">启用</Option>
                            <Option value="inactive">禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="remark" label="备注">
                        <TextArea rows={2} placeholder="请输入备注" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Dictionary;
