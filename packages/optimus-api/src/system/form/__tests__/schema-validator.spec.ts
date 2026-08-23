/**
 * 协议校验器是渲染与数据入库共同的守门人,这里把合法路径和主要的非法姿势
 * 都钉住——协议以后要改,先过这关。
 */
import { validateSchema, validateEntry, FormSchema } from "../schema-validator";

const okSchema: FormSchema = {
    title: "活动报名",
    fields: [
        { key: "name", label: "姓名", type: "text", required: true },
        { key: "intro", label: "简介", type: "textarea" },
        { key: "count", label: "人数", type: "number", min: 1, max: 5 },
        { key: "session", label: "场次", type: "radio", required: true, options: ["上午", "下午"] },
        { key: "channels", label: "渠道", type: "checkbox", options: ["朋友", "海报"] },
        { key: "day", label: "日期", type: "date" },
        { key: "parking", label: "停车位", type: "switch" },
    ],
};

describe("validateSchema", () => {
    it("七种类型的完整 schema 合法", () => {
        expect(validateSchema(okSchema)).toEqual([]);
    });
    it("x- 扩展属性被宽容", () => {
        expect(validateSchema({ ...okSchema, "x-theme": "dark" })).toEqual([]);
    });
    it.each([
        ["非对象", "str", "schema 必须是对象"],
        ["空 fields", { fields: [] }, "非空数组"],
        ["非法 key", { fields: [{ key: "1a", label: "x", type: "text" }] }, "字母开头"],
        ["重复 key", { fields: [{ key: "a", label: "x", type: "text" }, { key: "a", label: "y", type: "text" }] }, "重复"],
        ["未知类型", { fields: [{ key: "a", label: "x", type: "magic" }] }, "不在支持列表"],
        ["选择类缺选项", { fields: [{ key: "a", label: "x", type: "radio" }] }, "选项"],
        ["min>max", { fields: [{ key: "a", label: "x", type: "number", min: 9, max: 1 }] }, "不能大于"],
    ])("%s 被拒", (_n, input, frag) => {
        expect(validateSchema(input).join(";")).toContain(frag as string);
    });
});

describe("validateEntry", () => {
    const good = { name: "张三", count: 3, session: "上午", channels: ["海报"], parking: true };
    it("合法提交通过", () => {
        expect(validateEntry(okSchema, good)).toEqual([]);
    });
    it("缺必填指明字段", () => {
        expect(validateEntry(okSchema, { session: "上午" }).join()).toContain("name");
    });
    it("单选越界被拒", () => {
        expect(validateEntry(okSchema, { ...good, session: "晚上" }).join()).toContain("session");
    });
    it("数字越界被拒", () => {
        expect(validateEntry(okSchema, { ...good, count: 99 }).join()).toContain("上限");
    });
    it("未知字段被拒", () => {
        expect(validateEntry(okSchema, { ...good, hack: 1 }).join()).toContain("未知字段");
    });
});

describe("unique 扩展属性(数据集合场景)", () => {
    it("unique: true 是合法 schema", () => {
        expect(
            validateSchema({ fields: [{ key: "email", label: "邮箱", type: "text", unique: true }] }),
        ).toEqual([]);
    });
    it("unique 非布尔被拒", () => {
        expect(
            validateSchema({ fields: [{ key: "email", label: "邮箱", type: "text", unique: "yes" }] }).join(),
        ).toContain("unique");
    });
});
