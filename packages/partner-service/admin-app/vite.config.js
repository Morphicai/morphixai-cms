import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 构建产物直接落到 ../public/admin——partner-service 的 main.ts 已经用
// useStaticAssets(join(__dirname, "..", "public")) 托管这个目录,不需要
// 额外的静态资源服务。base 用相对路径,因为这个页面永远是从
// http://localhost:8089/admin/ 这个子路径打开(embedUrl 就是这么登记的)。
export default defineConfig({
    plugins: [react()],
    base: "./",
    build: {
        outDir: "../public/admin",
        emptyOutDir: true,
    },
    server: {
        port: 5191,
    },
});
