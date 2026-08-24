/**
 * 调 optimus-api 平台级能力(文件存储、短链)的薄客户端——OSS/短链不随迁移
 * 复制进 partner-service(见 openspec/changes/extract-partner-service/design.md
 * 3.5 节:两者都是平台级能力,复制成本和这三个业务模块本身完全不成比例)。
 * 转发的都是发起请求这个用户自己的 clientAccessToken,不是服务级凭证。
 */

const OPTIMUS_API_URL = (process.env.OPTIMUS_API_URL || "http://localhost:8084/api").replace(/\/$/, "");

/** 从请求里拿发起者自己的 clientAccessToken(header 优先,其次 cookie),转发给下面两个函数用 */
export function extractClientToken(req: any): string | undefined {
    const auth = req?.headers?.authorization;
    if (auth && typeof auth === "string" && auth.startsWith("Bearer ")) return auth.substring(7);
    return req?.cookies?.clientAccessToken;
}

export async function uploadFileViaOptimusApi(
    file: { buffer: Buffer; mimetype: string; originalname: string },
    token: string,
): Promise<{ url: string }> {
    const form = new FormData();
    form.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
    const res = await fetch(`${OPTIMUS_API_URL}/files/client-upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        signal: AbortSignal.timeout(30000),
    });
    const json: any = await res.json().catch(() => null);
    const url = json?.data?.[0]?.url;
    if (json?.code !== 200 || !url) {
        throw new Error(json?.msg || `上传服务异常(HTTP ${res.status})`);
    }
    return { url };
}

export async function shortenViaOptimusApi(
    target: Record<string, any> | string,
    remark: string | undefined,
    token: string,
): Promise<{ token: string; url: string }> {
    const res = await fetch(`${OPTIMUS_API_URL}/system/short-link/client-shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ target, remark }),
        signal: AbortSignal.timeout(10000),
    });
    const json: any = await res.json().catch(() => null);
    if (json?.code !== 200 || !json?.data?.token) {
        throw new Error(json?.msg || `短链服务异常(HTTP ${res.status})`);
    }
    return json.data;
}
