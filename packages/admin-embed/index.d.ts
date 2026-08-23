/**
 * @optimus/admin-embed 类型声明(实现是零构建 UMD 单文件,手写声明与之对应)
 */
export interface EmbedContext {
    token: string;
    user: Record<string, unknown>;
    perms: string[];
    locale: string;
    theme: string;
}

export interface InitOptions {
    /** 基座 origin,如 http://localhost:8082。不匹配的消息一律丢弃 */
    baseOrigin: string;
    /** 握手超时 ms,默认 3000。超时 reject=不在基座内打开 */
    timeoutMs?: number;
}

export function init(opts: InitOptions): Promise<EmbedContext>;
export function requestToken(): Promise<string>;
export function onTokenRefresh(cb: (token: string) => void): () => void;
export function getContext(): EmbedContext | null;
