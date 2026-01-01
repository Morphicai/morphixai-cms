export const TYPES = [
    { label: "文字", value: "string" },
    { label: "富文本", value: "richText" },
    { label: "图片", value: "image" },
    { label: "颜色", value: "color" },
    // { label: "链接", value: "url" },
    { label: "数字", value: "number" },
    // { label: "集合", value: "array" },
    { label: "JSON", value: "json" },
    { label: "代码", value: "code" },
    // { label: "HTML", value: "html" },
];

export const SOURCES = [{ label: "全部", value: "all" }];

export const IS_EMPTY = 0;

export const TABLE_COLUMNS = [
    {
        title: "ID",
        dataIndex: "id",
        key: "id",
    },
    {
        title: "key",
        dataIndex: "docKey",
        key: "docKey",
    },
    {
        title: "来源",
        dataIndex: "source",
        key: "source",
    },
    {
        title: "类型",
        dataIndex: "type",
        key: "type",
    },
    {
        title: "描述",
        dataIndex: "description",
        key: "description",
    },
];
