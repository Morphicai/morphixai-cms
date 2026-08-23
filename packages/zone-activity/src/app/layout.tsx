import type { ReactNode } from "react";

export const metadata = { title: "活动中心 · Optimus" };

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="zh-CN">
            <body style={{ margin: 0, fontFamily: "system-ui, 'PingFang SC', sans-serif", background: "#F6F8FA", color: "#1F2937" }}>
                {children}
            </body>
        </html>
    );
}
