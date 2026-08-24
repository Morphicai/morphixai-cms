// optimus-api 的文件上传(client-upload)返回 /OSS_FILE_PROXY/ 开头的相对路径,
// 约定由前端在展示时替换成实际可访问地址,见 optimus-ui 的
// shared/utils/fileUtils.js + shared/constants/oss.js。partner-service 自己不托管
// 文件(OSS/短链是平台能力,design.md 3.5 节的既定决策),这里的图片仍然要
// 打到 optimus-api 的 /api/proxy/file/ 路由,只是 optimus-api 的 origin
// 换成构建时注入的环境变量(这个页面现在跑在 partner-service 自己的 origin 下,
// 不能再假设"当前页面 origin == optimus-api origin"这个 optimus-ui 里成立的前提)。
const OSS_FILE_PROXY_PREFIX = "/OSS_FILE_PROXY/";
const OPTIMUS_API_ORIGIN = (import.meta.env.VITE_OPTIMUS_API_ORIGIN || "http://localhost:8084").replace(/\/$/, "");

export function getFullFileUrl(filePath) {
    if (!filePath) return "";
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
    if (filePath.startsWith(OSS_FILE_PROXY_PREFIX)) {
        const actualPath = filePath.replace(OSS_FILE_PROXY_PREFIX, "");
        return `${OPTIMUS_API_ORIGIN}/api/proxy/file/${actualPath}`;
    }
    return filePath;
}
