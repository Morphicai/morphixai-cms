/**
 * SDK 本体已抽到 @optimus/client-sdk(workspace 包),任何 C 端子应用都能引。
 * 这里只是 re-export 薄壳,让 next 内既有的相对路径 import 不用动。
 * 新代码建议直接 import '@optimus/client-sdk'。
 */
export * from '@optimus/client-sdk';
export { default } from '@optimus/client-sdk';
