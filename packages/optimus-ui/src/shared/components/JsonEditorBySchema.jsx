import React from "react";
import SchemaFormBuilder from "./SchemaFormBuilder";

/**
 * 基于 Schema 的 JSON 编辑器
 * 根据 Schema 自动生成表单来编辑 JSON 数据
 */
const JsonEditorBySchema = ({ schema, value, onChange }) => {
    if (!schema || !schema.properties) {
        return <div style={{ color: "#999" }}>未定义 Schema</div>;
    }

    return <SchemaFormBuilder schema={schema} value={value} onChange={onChange} />;
};

export default JsonEditorBySchema;
