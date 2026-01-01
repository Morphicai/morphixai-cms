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
    Breadcrumb,
} from "antd";
import {
    SearchOutlined,
    ReloadOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    HomeOutlined,
    DatabaseOutlined,
} from "@ant-design/icons";
import { useMount } from "../../../shared/hooks";
import { useParams, useNavigate } from "react-router-dom";
import dictionaryService from "../../../services/DictionaryService";
import JsonEditorBySchema from "../../../shared/components/JsonEditorBySchema";

const { Option } = Select;
const { TextArea } = Input;

const DictionaryDataManagement = () => {
    const { collection } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [modalForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [dataSource, setDataSource] = useState([]);
    const [collectionInfo, setCollectionInfo] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState("create");
    const [currentRecord, setCurrentRecord] = useState(null);
    const [jsonValue, setJsonValue] = useState({});

    // 访问类型映射
    const accessTypeMap = {
        private: { text: "后台私有", color: "default" },
        public_read: { text: "C端公开读", color: "blue" },
        public_write: { text: "C端公开读写", color: "green" },
        user_private: { text: "用户私有", color: "purple" },
    };

    // 加载集合信息
    const fetchCollectionInfo = async () => {
        try {
            const response = await dictionaryService.getCollectionByName(collection);
            if (response.code === 200) {
                setCollectionInfo(response.data);
            }
        } catch (error) {
            console.error("加载集合信息失败:", error);
            message.error("加载集合信息失败");
        }
    };

    // 加载字典列表
    const fetchDictionaries = async (params = {}) => {
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
        modalForm.setFieldsValue({ collection });
        setJsonValue({});
        setModalVisible(true);
    };

    // 打开编辑弹窗
    const handleEdit = (record) => {
        setModalType("edit");
        setCurrentRecord(record);
        setJsonValue(record.value);
        modalForm.setFieldsValue({
            collection: record.collection,
            key: record.key,
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

            const data = {
                ...values,
                value: jsonValue,
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
        fetchDictionaries({ ...values, page: newPagination.current, pageSize: newPagination.pageSize });
    };

    useMount(() => {
        fetchCollectionInfo();
        fetchDictionaries();
    });

    return (
        <div style={{ padding: "24px" }}>
            {/* 面包屑导航 */}
            <Breadcrumb style={{ marginBottom: 16 }}>
                <Breadcrumb.Item>
                    <HomeOutlined />
                </Breadcrumb.Item>
                <Breadcrumb.Item onClick={() => navigate("/sys/dictionary")} style={{ cursor: "pointer" }}>
                    <DatabaseOutlined />
                    <span>字典管理</span>
                </Breadcrumb.Item>
                <Breadcrumb.Item>{collectionInfo?.displayName || collection}</Breadcrumb.Item>
            </Breadcrumb>

            {/* 集合信息 */}
            {collectionInfo && (
                <Card style={{ marginBottom: 16 }}>
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                        <div>
                            <strong>集合名称：</strong>
                            <span style={{ marginRight: 16 }}>{collectionInfo.name}</span>
                            <strong>显示名称：</strong>
                            <span>{collectionInfo.displayName}</span>
                        </div>
                        <div>
                            <strong>描述：</strong>
                            <span>{collectionInfo.description || "无"}</span>
                        </div>
                        <div>
                            <strong>数据类型：</strong>
                            <span style={{ marginRight: 16 }}>{collectionInfo.dataType}</span>
                            <strong>访问类型：</strong>
                            <Tag color={accessTypeMap[collectionInfo.accessType]?.color}>
                                {accessTypeMap[collectionInfo.accessType]?.text}
                            </Tag>
                            <span style={{ marginLeft: 16 }}>
                                <strong>最大条目数：</strong>
                                {collectionInfo.maxItems}
                            </span>
                            {collectionInfo.accessType === "user_private" && (
                                <span style={{ marginLeft: 16 }}>
                                    <strong>每用户限制：</strong>
                                    {collectionInfo.maxItemsPerUser}
                                </span>
                            )}
                        </div>
                    </Space>
                </Card>
            )}

            {/* 搜索表单 */}
            <Card style={{ marginBottom: 16 }}>
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
                width={800}
            >
                <Form form={modalForm} layout="vertical">
                    <Form.Item name="collection" label="集合" hidden>
                        <Input disabled />
                    </Form.Item>
                    <Form.Item name="key" label="键" rules={[{ required: true, message: "请输入键" }]}>
                        <Input placeholder="例如: server_01" disabled={modalType === "edit"} />
                    </Form.Item>

                    <Form.Item label="数据内容" required>
                        <JsonEditorBySchema
                            schema={collectionInfo?.schema}
                            value={jsonValue}
                            onChange={setJsonValue}
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

export default DictionaryDataManagement;
