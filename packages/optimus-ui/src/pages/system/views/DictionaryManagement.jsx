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
import {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { useMount } from "../../../shared/hooks";
import { useNavigate } from "react-router-dom";
import dictionaryService from "../../../services/DictionaryService";
import SchemaEditor from "../../../shared/components/SchemaEditor";

const { Option } = Select;
const { TextArea } = Input;

const DictionaryManagement = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [modalForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [currentRecord, setCurrentRecord] = useState(null);
    const [schemaValue, setSchemaValue] = useState(null);

    // 访问类型映射
    const accessTypeMap = {
        private: { text: "后台私有", color: "default" },
        public_read: { text: "C端公开读", color: "blue" },
        public_write: { text: "C端公开读写", color: "green" },
        user_private: { text: "用户私有", color: "purple" },
    };



    // 访问类型选项
    const accessTypeOptions = [
        { label: "后台私有", value: "private" },
        { label: "C端公开读", value: "public_read" },
        { label: "C端公开读写", value: "public_write" },
        { label: "用户私有", value: "user_private" },
    ];

    // 加载集合列表
    const fetchCollections = async (params = {}) => {
        setLoading(true);
        try {
            const response = await dictionaryService.listCollections({
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
            message.error("加载集合列表失败");
            console.error("加载集合列表失败:", error);
        } finally {
            setLoading(false);
        }
    };

    // 搜索
    const handleSearch = () => {
        const values = form.getFieldsValue();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchCollections(values);
    };

    // 重置
    const handleReset = () => {
        form.resetFields();
        setPagination((prev) => ({ ...prev, current: 1 }));
        fetchCollections();
    };

    // 打开创建弹窗
    const handleCreate = () => {
        setModalType("create");
        setCurrentRecord(null);
        modalForm.resetFields();
        setSchemaValue(null);
        setModalVisible(true);
    };

    // 打开编辑弹窗
    const handleEdit = (record) => {
        setModalType("edit");
        setCurrentRecord(record);
        setSchemaValue(record.schema || null);
        modalForm.setFieldsValue({
            displayName: record.displayName,
            description: record.description,
            accessType: record.accessType,
            maxItems: record.maxItems,
            maxItemsPerUser: record.maxItemsPerUser,
            status: record.status,
        });
        setModalVisible(true);
    };

    // 删除集合
    const handleDelete = async (id) => {
        try {
            const response = await dictionaryService.deleteCollection(id);
            if (response.code === 200) {
                message.success("删除成功");
                fetchCollections();
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

            // 验证 Schema
            if (!schemaValue || !schemaValue.properties || Object.keys(schemaValue.properties).length === 0) {
                message.error("请至少添加一个字段");
                return;
            }

            // 数据类型固定为 object
            values.dataType = "object";
            values.schema = schemaValue;

            if (modalType === "create") {
                const response = await dictionaryService.createCollection(values);
                if (response.code === 200) {
                    message.success("创建成功");
                    setModalVisible(false);
                    fetchCollections();
                }
            } else {
                const response = await dictionaryService.updateCollection(currentRecord.id, values);
                if (response.code === 200) {
                    message.success("更新成功");
                    setModalVisible(false);
                    fetchCollections();
                }
            }
        } catch (error) {
            console.error("操作失败:", error);
        }
    };

    // 查看集合数据
    const handleViewData = (record) => {
        navigate(`/sys/dictionary/${record.name}`);
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
            title: "集合名称",
            dataIndex: "name",
            key: "name",
            width: 180,
            render: (name, record) => (
                <span onClick={() => handleViewData(record)} style={{ color: "#1890ff", cursor: "pointer" }}>
                    {name}
                </span>
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
            width: 200,
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
                        title="确定要删除这个集合吗？"
                        description="删除集合将同时删除该集合下的所有数据"
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
        fetchCollections({ ...values, page: newPagination.current, pageSize: newPagination.pageSize });
    };

    useMount(() => {
        fetchCollections();
    });

    return (
        <div style={{ padding: "24px" }}>
            {/* 搜索表单 */}
            <Card style={{ marginBottom: 16 }}>
                <Form form={form} layout="inline">
                    <Form.Item name="name" label="集合名称">
                        <Input placeholder="请输入集合名称" style={{ width: 200 }} />
                    </Form.Item>
                    <Form.Item name="accessType" label="访问类型">
                        <Select placeholder="请选择访问类型" style={{ width: 150 }} allowClear>
                            {accessTypeOptions.map((item) => (
                                <Option key={item.value} value={item.value}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
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
                                新建集合
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>

            {/* 集合列表 */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={dataSource}
                    rowKey="id"
                    loading={loading}
                    pagination={pagination}
                    onChange={handleTableChange}
                    scroll={{ x: 1400 }}
                />
            </Card>

            {/* 创建/编辑弹窗 */}
            <Modal
                title={modalType === "create" ? "新建集合" : "编辑集合"}
                open={modalVisible}
                onOk={handleModalOk}
                onCancel={() => setModalVisible(false)}
                width={900}
                style={{ top: 20 }}
            >
                <Form form={modalForm} layout="vertical">
                    {modalType === "create" && (
                        <Form.Item
                            name="name"
                            label="集合名称"
                            rules={[
                                { required: true, message: "请输入集合名称" },
                                { pattern: /^[a-z_]+$/, message: "只能使用小写字母和下划线" },
                            ]}
                        >
                            <Input placeholder="例如: user_preferences" />
                        </Form.Item>
                    )}
                    <Form.Item
                        name="displayName"
                        label="显示名称"
                        rules={[{ required: true, message: "请输入显示名称" }]}
                    >
                        <Input placeholder="例如: 用户偏好" />
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <TextArea rows={2} placeholder="请输入集合描述" />
                    </Form.Item>
                    <Form.Item
                        name="accessType"
                        label="访问类型"
                        initialValue="private"
                        rules={[{ required: true, message: "请选择访问类型" }]}
                    >
                        <Select>
                            {accessTypeOptions.map((item) => (
                                <Option key={item.value} value={item.value}>
                                    {item.label}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="maxItems" label="最大条目数" initialValue={1000}>
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="maxItemsPerUser" label="每用户最大条目数" initialValue={100}>
                        <InputNumber min={0} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item name="status" label="状态" initialValue="active">
                        <Select>
                            <Option value="active">启用</Option>
                            <Option value="inactive">禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label="数据结构定义（必填）" required>
                        <SchemaEditor value={schemaValue} onChange={setSchemaValue} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DictionaryManagement;
