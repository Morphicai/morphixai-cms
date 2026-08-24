import React, { useEffect, useState } from "react";
import { Tabs, Spin, Result } from "antd";
import { useEmbedAuth } from "./hooks/useEmbedAuth";
import { configureAuth } from "./lib/request";
import PartnerList from "./pages/partner/PartnerList";
import ExternalTaskReview from "./pages/external-task-review";

// 两个 tab 对应 optimus-ui 里原本两个独立的静态路由(/biz/partner 的
// "合伙人计划"、/biz/external-task-review 的"外部任务审核")。合并成一个
// SPA 里的两个 tab,而不是继续拆两个 embed 入口,是因为它们背后是同一个
// PartnerManagement 权限码,拆两个入口只会让基座菜单多一条却没有实际隔离意义。
// "合伙人数据管理"(/sys/partner-data)原本单独一个页面,但内容(刷新缓存/
// 清空所有数据)和 PartnerList 工具栏里的两个按钮完全重复——这里不再重复建
// 第三个 tab,直接复用 PartnerList 已有的入口
const TABS = [
    { key: "partner", label: "合伙人管理", children: <PartnerList /> },
    { key: "external-task", label: "外部任务审核", children: <ExternalTaskReview /> },
];

export default function App() {
    const auth = useEmbedAuth();
    const [authConfigured, setAuthConfigured] = useState(false);

    useEffect(() => {
        if (auth.status === "ready") {
            configureAuth({ getToken: auth.getToken, refreshToken: auth.refreshToken });
            setAuthConfigured(true);
        }
    }, [auth.status]);

    if (auth.status === "handshaking") {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
                <Spin size="large" tip="正在与基座握手..." />
            </div>
        );
    }

    if (auth.status === "error") {
        return (
            <Result
                status="warning"
                title="无法加载管理台"
                subTitle={auth.error}
                style={{ paddingTop: 80 }}
            />
        );
    }

    const hasPerm = auth.perms.includes("*") || auth.perms.includes("PartnerManagement");
    if (!hasPerm) {
        return (
            <Result
                status="403"
                title="没有权限"
                subTitle="当前账号缺少 PartnerManagement 权限码，请联系管理员分配角色权限"
                style={{ paddingTop: 80 }}
            />
        );
    }

    if (!authConfigured) return null; // configureAuth 生效前不发请求,避免第一批请求带不上 token

    return (
        <div style={{ padding: 16 }}>
            <Tabs items={TABS} defaultActiveKey="partner" />
        </div>
    );
}
