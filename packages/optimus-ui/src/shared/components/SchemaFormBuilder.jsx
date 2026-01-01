import React from "react";
import { Form, Input, InputNumber, Switch, Select, DatePicker } from "antd";

const { TextArea } = Input;
const { Option } = Select;

/**
 * 根据 JSON Schema 生成表单组件
 * 支持常见的表单字段类型
 */
const SchemaFormBuilder = ({ schema, value = {}, onChange }) => {
    if (!schema || !schema.properties) {
        return null;
    }

    const handleFieldChange = (field, fieldValue) => {
        const newValue = { ...value, [field]: fieldValue };
        if (onChange) {
            onChange(newValue);
        }
    };

    const renderField = (fieldName, fieldSchema) => {
        const { type, title, description, enum: enumValues, format, default: defaultValue } = fieldSchema;
        const label = title || fieldName;
        const required = schema.required?.includes(fieldName);

        // 根据类型渲染不同的表单组件
        switch (type) {
            case "string":
                if (enumValues && Array.isArray(enumValues)) {
                    // 枚举类型 - 下拉选择
                    return (
                        <Form.Item
                            key={fieldName}
                            label={label}
                            tooltip={description}
                            required={required}
                        >
                            <Select
                                value={value[fieldName] || defaultValue}
                                onChange={(val) => handleFieldChange(fieldName, val)}
                                placeholder={`请选择${label}`}
                            >
                                {enumValues.map((item) => (
                                    <Option key={item} value={item}>
                                        {item}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    );
                } else if (format === "textarea") {
                    // 多行文本
                    return (
                        <Form.Item
                            key={fieldName}
                            label={label}
                            tooltip={description}
                            required={required}
                        >
                            <TextArea
                                value={value[fieldName] || defaultValue}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                placeholder={`请输入${label}`}
                                rows={4}
                            />
                        </Form.Item>
                    );
                } else if (format === "date") {
                    // 日期
                    return (
                        <Form.Item
                            key={fieldName}
                            label={label}
                            tooltip={description}
                            required={required}
                        >
                            <DatePicker
                                value={value[fieldName]}
                                onChange={(date) => handleFieldChange(fieldName, date)}
                                style={{ width: "100%" }}
                            />
                        </Form.Item>
                    );
                } else if (format === "url" || format === "image") {
                    // URL 或图片
                    return (
                        <Form.Item
                            key={fieldName}
                            label={label}
                            tooltip={description}
                            required={required}
                        >
                            <Input
                                value={value[fieldName] || defaultValue}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                placeholder={`请输入${label}`}
                                addonBefore={format === "url" ? "https://" : "图片"}
                            />
                        </Form.Item>
                    );
                } else {
                    // 普通文本
                    return (
                        <Form.Item
                            key={fieldName}
                            label={label}
                            tooltip={description}
                            required={required}
                        >
                            <Input
                                value={value[fieldName] || defaultValue}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                placeholder={`请输入${label}`}
                            />
                        </Form.Item>
                    );
                }

            case "number":
            case "integer":
                return (
                    <Form.Item
                        key={fieldName}
                        label={label}
                        tooltip={description}
                        required={required}
                    >
                        <InputNumber
                            value={value[fieldName] || defaultValue}
                            onChange={(val) => handleFieldChange(fieldName, val)}
                            placeholder={`请输入${label}`}
                            style={{ width: "100%" }}
                            precision={type === "integer" ? 0 : undefined}
                        />
                    </Form.Item>
                );

            case "boolean":
                return (
                    <Form.Item
                        key={fieldName}
                        label={label}
                        tooltip={description}
                        valuePropName="checked"
                    >
                        <Switch
                            checked={value[fieldName] !== undefined ? value[fieldName] : defaultValue}
                            onChange={(checked) => handleFieldChange(fieldName, checked)}
                        />
                    </Form.Item>
                );

            case "array":
                // 简单数组处理 - 使用 JSON 输入
                return (
                    <Form.Item
                        key={fieldName}
                        label={label}
                        tooltip={description}
                        required={required}
                    >
                        <TextArea
                            value={JSON.stringify(value[fieldName] || defaultValue || [], null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleFieldChange(fieldName, parsed);
                                } catch (err) {
                                    // 忽略解析错误
                                }
                            }}
                            placeholder={`请输入${label}（JSON 数组格式）`}
                            rows={4}
                        />
                    </Form.Item>
                );

            case "object":
                // 简单对象处理 - 使用 JSON 输入
                return (
                    <Form.Item
                        key={fieldName}
                        label={label}
                        tooltip={description}
                        required={required}
                    >
                        <TextArea
                            value={JSON.stringify(value[fieldName] || defaultValue || {}, null, 2)}
                            onChange={(e) => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    handleFieldChange(fieldName, parsed);
                                } catch (err) {
                                    // 忽略解析错误
                                }
                            }}
                            placeholder={`请输入${label}（JSON 对象格式）`}
                            rows={4}
                        />
                    </Form.Item>
                );

            default:
                return (
                    <Form.Item
                        key={fieldName}
                        label={label}
                        tooltip={description}
                        required={required}
                    >
                        <Input
                            value={value[fieldName] || defaultValue}
                            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                            placeholder={`请输入${label}`}
                        />
                    </Form.Item>
                );
        }
    };

    return (
        <div>
            {Object.entries(schema.properties).map(([fieldName, fieldSchema]) =>
                renderField(fieldName, fieldSchema)
            )}
        </div>
    );
};

export default SchemaFormBuilder;
