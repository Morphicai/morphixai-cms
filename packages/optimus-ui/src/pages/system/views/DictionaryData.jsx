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
} from "antd";
import { SearchOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useMount } from "../../../shared/hooks";
import dictionaryService from "../../../services/DictionaryService";

const { Option } = Select;
const { TextArea } = Input;

const DictionaryData = () => {
    const [form] = Form.useForm();
    const [modalForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [collections, setCollections] = useState([]);
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
            }
        } catch (error) {
            console.error("加载集合列表失败:", error);
        }
    };

    // 加载字典列表
    const fetchDictionaries = async (params = {}) => {
        setLoading(true);
        try {
            const response = await dictionaryService.list({
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
            message.error("加载字典列表失败");
            console.error("加载字典列表失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 搜索
    const handleSearch = () => {
        const values = form.getFieldsValue();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchDictionaries(values);
    };

    // 重置
    const handleReset = () => {
        form.resetFields();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchDictionaries();
    };

    // 打开创建弹窗
    const handleCreate = () => {
        setModalType("create");
        setCurrentRecord(null);
        modalForm.resetFields();
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
                fetchDictionaries();
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
                    fetchDictionaries();
                }
            } else {
                const response = await dictionaryService.update(currentRecord.id, data);
                if (response.code === 200) {
                    message.success("更新成功");
                    setModalVisible(false);
                    fetchDictionaries();
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
            title: "集合",
            dataIndex: "collection",
            key: "collection",
            width: 150,
        },
        {
            title: "键",
            dataIndex: "key",
            key: "key",
            width: 150,
        },
        {
            title: "值",
            dataIndex: "value",
            key: "value",
            width: 300,
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
        fetchDictionaries({ ...values, page: newPagination.current, pageSize: newPagination.pageSize });
    };

    useMount(() => {
        fetchCollections();
        fetchDictionaries();
    });

    return (
        <div style={{ padding: "24px" }}>
            {/* 搜索表单 */}
            <Card style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline">
                    <Form.Item name="collection" label="集合">
                        <Select placeholder="请选择集合" style={{ width: 200 }} allowClear>
                            {collections.map((item) => (
                                <Option key={item.name} value={item.name}>
                                    {item.displayName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
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

            {/* 字典列表 */}
            <Card>
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
                    <Form.Item
                        name="collection"
                        label="集合"
                        rules={[{ required: true, message: "请选择集合" }]}
                    >
                        <Select placeholder="请选择集合" disabled={modalType === "edit"}>
                            {collections.map((item) => (
                                <Option key={item.name} value={item.name}>
                                    {item.displayName} ({item.name})
                                </Option>
                            ))}
                        </Select>
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

export default DictionaryData;
