import React, { useState, useEffect } from "react";
import { Card, Form, Input, Select, Button, Space, Popconfirm, Switch } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";

const { Option } = Select;

/**
 * 可视化 Schema 编辑器
 * 用于编辑 JSON Schema 的 properties 和 required 字段
 */
const SchemaEditor = ({ value, onChange }) => {
    const [fields, setFields] = useState([]);
    const [requiredFields, setRequiredFields] = useState([]);

    // 初始化字段列表
    useEffect(() => {
        if (value && value.properties) {
            const fieldList = Object.entries(value.properties).map(([name, schema]) => ({
                name,
                ...schema,
                id: Math.random().toString(36).substring(2, 11),
            }));
            setFields(fieldList);
            setRequiredFields(value.required || []);
        } else {
            setFields([]);
            setRequiredFields([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 更新 Schema
    const updateSchema = (newFields, newRequired) => {
        const properties = {};
        newFields.forEach((field) => {
            const { name, id, ...schema } = field;
            if (name) {
                properties[name] = schema;
            }
        });

        const schema = {
            type: "object",
            properties,
            required: newRequired.filter((name) => properties[name]),
        };

        if (onChange) {
            onChange(schema);
        }
    };

    // 添加字段
    const handleAddField = () => {
        const newField = {
            id: Math.random().toString(36).substring(2, 11),
            name: "",
            type: "string",
            title: "",
            description: "",
        };
        const newFields = [...fields, newField];
        setFields(newFields);
        updateSchema(newFields, requiredFields);
    };

    // 删除字段
    const handleDeleteField = (id) => {
        const newFields = fields.filter((f) => f.id !== id);
        const deletedField = fields.find((f) => f.id === id);
        const newRequired = requiredFields.filter((name) => name !== deletedField?.name);
        setFields(newFields);
        setRequiredFields(newRequired);
        updateSchema(newFields, newRequired);
    };

    // 更新字段
    const handleFieldChange = (id, key, val) => {
        const newFields = fields.map((f) => {
            if (f.id === id) {
                const updated = { ...f, [key]: val };
                // 如果修改了字段名，更新 required 列表
                if (key === "name" && f.name) {
                    const newRequired = requiredFields.map((name) => (name === f.name ? val : name));
                    setRequiredFields(newRequired);
                }
                return updated;
            }
            return f;
        });
        setFields(newFields);
        updateSchema(newFields, requiredFields);
    };

    // 切换必填状态
    const handleRequiredChange = (fieldName, checked) => {
        const newRequired = checked
            ? [...requiredFields, fieldName]
            : requiredFields.filter((name) => name !== fieldName);
        setRequiredFields(newRequired);
        updateSchema(fields, newRequired);
    };

    return (
        <div>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
                {fields.map((field) => (
                    <Card
                        key={field.id}
                        size="small"
                        title={`字段: ${field.name || "未命名"}`}
                        extra={
                            <Popconfirm
                                title="确定删除这个字段吗？"
                                onConfirm={() => handleDeleteField(field.id)}
                                okText="确定"
                                cancelText="取消"
                            >
                                <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                                    删除
                                </Button>
                            </Popconfirm>
                        }
                    >
                        <Form layout="vertical" size="small">
                            <Space style={{ width: "100%" }} size="small">
                                <Form.Item label="字段名" style={{ marginBottom: 0, width: 150 }}>
                                    <Input
                                        value={field.name}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            // 验证字段名：不能以数字或下划线开头
                                            if (value && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                                                return; // 不允许输入
                                            }
                                            handleFieldChange(field.id, "name", value);
                                        }}
                                        placeholder="例如: name"
                                    />
                                </Form.Item>
                                <Form.Item label="显示标题" style={{ marginBottom: 0, width: 150 }}>
                                    <Input
                                        value={field.title}
                                        onChange={(e) => handleFieldChange(field.id, "title", e.target.value)}
                                        placeholder="例如: 名称"
                                    />
                                </Form.Item>
                                <Form.Item label="字段类型" style={{ marginBottom: 0, width: 120 }}>
                                    <Select
                                        value={field.type}
                                        onChange={(val) => handleFieldChange(field.id, "type", val)}
                                    >
                                        <Option value="string">字符串</Option>
                                        <Option value="number">数字</Option>
                                        <Option value="integer">整数</Option>
                                        <Option value="boolean">布尔值</Option>
                                        <Option value="array">数组</Option>
                                        <Option value="object">对象</Option>
                                    </Select>
                                </Form.Item>
                                <Form.Item label="必填" style={{ marginBottom: 0 }}>
                                    <Switch
                                        checked={requiredFields.includes(field.name)}
                                        onChange={(checked) => handleRequiredChange(field.name, checked)}
                                        disabled={!field.name}
                                    />
                                </Form.Item>
                                <Form.Item label="唯一" style={{ marginBottom: 0 }}>
                                    <Switch
                                        checked={field.unique}
                                        onChange={(checked) => handleFieldChange(field.id, "unique", checked)}
                                    />
                                </Form.Item>
                            </Space>
                            <Space style={{ width: "100%", marginTop: 8 }} size="small">
                                {field.type === "string" && (
                                    <Form.Item label="格式" style={{ marginBottom: 0, width: 120 }}>
                                        <Select
                                            value={field.format}
                                            onChange={(val) => handleFieldChange(field.id, "format", val)}
                                            allowClear
                                        >
                                            <Option value="textarea">多行文本</Option>
                                            <Option value="url">URL</Option>
                                            <Option value="image">图片</Option>
                                            <Option value="date">日期</Option>
                                        </Select>
                                    </Form.Item>
                                )}
                                <Form.Item label="描述" style={{ marginBottom: 0, flex: 1 }}>
                                    <Input
                                        value={field.description}
                                        onChange={(e) => handleFieldChange(field.id, "description", e.target.value)}
                                        placeholder="字段说明"
                                    />
                                </Form.Item>
                                <Form.Item label="默认值" style={{ marginBottom: 0, width: 120 }}>
                                    <Input
                                        value={field.default}
                                        onChange={(e) => handleFieldChange(field.id, "default", e.target.value)}
                                        placeholder="默认值"
                                    />
                                </Form.Item>
                            </Space>
                            {field.type === "string" && (
                                <Form.Item label="枚举值（逗号分隔）" style={{ marginTop: 8, marginBottom: 0 }}>
                                    <Input
                                        value={field.enum?.join(", ")}
                                        onChange={(e) => {
                                            const enumValues = e.target.value
                                                .split(",")
                                                .map((v) => v.trim())
                                                .filter(Boolean);
                                            handleFieldChange(field.id, "enum", enumValues.length ? enumValues : undefined);
                                        }}
                                        placeholder="例如: active, inactive, pending"
                                    />
                                </Form.Item>
                            )}
                        </Form>
                    </Card>
                ))}

                <Button type="dashed" onClick={handleAddField} block icon={<PlusOutlined />}>
                    添加字段
                </Button>
            </Space>
        </div>
    );
};

export default SchemaEditor;
