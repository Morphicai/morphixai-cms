/**
 * 表单 schema 协议与校验器（纯函数，无任何 Nest 依赖）。
 *
 * 协议刻意精简：7 种字段类型、有限属性。渲染器和这里消费同一份 schema，
 * 前后端不各写一套规则。x- 前缀是留给未来的扩展位，两端都宽容忽略。
 * 表达力不够时加类型，不要加"聪明"的嵌套结构——协议越平，渲染器越好写。
 */

export const FIELD_TYPES = ["text", "textarea", "number", "radio", "checkbox", "date", "switch"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export interface FormField {
    key: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: string[]; // radio/checkbox 用
    min?: number; // number 用
    max?: number;
    // 集合内该字段值唯一（数据集合场景消费；表单填报不查重，忽略它）。
    // 唯一性要查库，所以不在本纯函数里校验，由调用方(dictionary.service)实现
    unique?: boolean;
    [k: `x-${string}`]: unknown;
}

export interface FormSchema {
    title?: string;
    fields: FormField[];
    [k: `x-${string}`]: unknown;
}

const KEY_RE = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

/** 校验 schema 本身是否合法。返回错误数组，空数组即合法。 */
export function validateSchema(input: unknown): string[] {
    const errors: string[] = [];
    if (!input || typeof input !== "object" || Array.isArray(input)) {
        return ["schema 必须是对象"];
    }
    const s = input as Record<string, unknown>;
    if (!Array.isArray(s.fields) || s.fields.length === 0) {
        return ["schema.fields 必须是非空数组"];
    }
    if (s.fields.length > 100) errors.push("字段数量超过 100 上限");

    const seen = new Set<string>();
    (s.fields as unknown[]).forEach((f, i) => {
        const at = `fields[${i}]`;
        if (!f || typeof f !== "object") { errors.push(`${at} 必须是对象`); return; }
        const field = f as Record<string, unknown>;
        if (typeof field.key !== "string" || !KEY_RE.test(field.key)) {
            errors.push(`${at}.key 必须是字母开头的标识符(<=64字符)`);
        } else if (seen.has(field.key)) {
            errors.push(`${at}.key "${field.key}" 重复`);
        } else {
            seen.add(field.key);
        }
        if (typeof field.label !== "string" || !field.label.trim()) errors.push(`${at}.label 不能为空`);
        if (!FIELD_TYPES.includes(field.type as FieldType)) errors.push(`${at}.type "${field.type}" 不在支持列表`);
        if (field.type === "radio" || field.type === "checkbox") {
            if (!Array.isArray(field.options) || field.options.length === 0 || !field.options.every((o) => typeof o === "string" && o.trim())) {
                errors.push(`${at}.options 选择类字段必须提供非空字符串选项`);
            }
        }
        if (field.type === "number") {
            if (field.min !== undefined && typeof field.min !== "number") errors.push(`${at}.min 必须是数字`);
            if (field.max !== undefined && typeof field.max !== "number") errors.push(`${at}.max 必须是数字`);
            if (typeof field.min === "number" && typeof field.max === "number" && field.min > field.max) {
                errors.push(`${at} min 不能大于 max`);
            }
        }
        if (field.unique !== undefined && typeof field.unique !== "boolean") {
            errors.push(`${at}.unique 必须是布尔值`);
        }
    });
    return errors;
}

/** 按 schema 校验一次提交。返回错误数组，空数组即合法。 */
export function validateEntry(schema: FormSchema, data: unknown): string[] {
    if (!data || typeof data !== "object" || Array.isArray(data)) return ["提交数据必须是对象"];
    const d = data as Record<string, unknown>;
    const errors: string[] = [];

    for (const field of schema.fields) {
        const v = d[field.key];
        const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
        if (field.required && empty) { errors.push(`缺少必填字段: ${field.key}`); continue; }
        if (empty) continue;

        switch (field.type) {
            case "text":
            case "textarea":
            case "date":
                if (typeof v !== "string") errors.push(`${field.key} 必须是字符串`);
                break;
            case "number":
                if (typeof v !== "number" || Number.isNaN(v)) { errors.push(`${field.key} 必须是数字`); break; }
                if (field.min !== undefined && v < field.min) errors.push(`${field.key} 小于下限 ${field.min}`);
                if (field.max !== undefined && v > field.max) errors.push(`${field.key} 大于上限 ${field.max}`);
                break;
            case "switch":
                if (typeof v !== "boolean") errors.push(`${field.key} 必须是布尔值`);
                break;
            case "radio":
                if (typeof v !== "string" || !field.options?.includes(v)) errors.push(`${field.key} 的值不在选项中`);
                break;
            case "checkbox":
                if (!Array.isArray(v) || !v.every((x) => typeof x === "string" && field.options?.includes(x))) {
                    errors.push(`${field.key} 的值必须全部来自选项`);
                }
                break;
        }
    }
    // 协议之外的多余 key 直接拒——公开接口不做"宽容收集",少一分歧义少一分滥用面
    const allowed = new Set(schema.fields.map((f) => f.key));
    for (const k of Object.keys(d)) {
        if (!allowed.has(k)) errors.push(`未知字段: ${k}`);
    }
    return errors;
}
