import React, { useState, useEffect } from "react";
import { Input, message } from "antd";

const { TextArea } = Input;

/**
 * JSON 编辑器组件
 * 提供 JSON 格式化、验证和编辑功能
 */
const JsonEditor = ({ value = {}, onChange, height = 300, readOnly = false }) => {
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState(null);

    // 初始化和值变化时格式化 JSON
    useEffect(() => {
        try {
            const formatted = JSON.stringify(value, null, 2);
            setJsonText(formatted);
            setError(null);
        } catch (err) {
            setJsonText(JSON.stringify(value));
            setError("JSON 格式化失败");
        }
    }, [value]);

    // 处理文本变化
    const handleChange = (e) => {
        const text = e.target.value;
        setJsonText(text);

        // 验证 JSON 格式
        try {
            const parsed = JSON.parse(text);
            setError(null);
            if (onChange) {
                onChange(parsed);
            }
        } catch (err) {
            setError(err.message);
        }
    };

    // 格式化 JSON
    const handleFormat = () => {
        try {
            const parsed = JSON.parse(jsonText);
            const formatted = JSON.stringify(parsed, null, 2);
            setJsonText(formatted);
            setError(null);
            message.success("格式化成功");
        } catch (err) {
            message.error("JSON 格式错误，无法格式化");
        }
    };

    return (
        <div style={{ position: "relative" }}>
            <TextArea
                value={jsonText}
                onChange={handleChange}
                readOnly={readOnly}
                style={{
                    fontFamily: "Monaco, Menlo, 'Ubuntu Mono', Consolas, monospace",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    height: height,
                    border: error ? "1px solid #ff4d4f" : "1px solid #d9d9d9",
                }}
                placeholder='例如: {"name": "测试", "value": 123}'
            />
            {error && (
                <div
                    style={{
                        color: "#ff4d4f",
                        fontSize: "12px",
                        marginTop: "4px",
                    }}
                >
                    ⚠️ {error}
                </div>
            )}
            {!readOnly && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: "#999" }}>
                    提示：输入有效的 JSON 格式数据。可以使用{" "}
                    <span onClick={handleFormat} style={{ cursor: "pointer", color: "#1890ff" }}>
                        格式化
                    </span>
                </div>
            )}
        </div>
    );
};

export default JsonEditor;
