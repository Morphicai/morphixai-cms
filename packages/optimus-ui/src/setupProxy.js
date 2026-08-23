const { createProxyMiddleware } = require("http-proxy-middleware");
const isDebugRemote = process?.env?.DEBUG_REMOTE === 'true' || process?.env?.DEBUG_REMOTE === true;
console.log('isDebugRemote',isDebugRemote)
module.exports = function (app) {
  // ...
  app.use(
    createProxyMiddleware("/api", {
      changeOrigin: true,
      target: "http://localhost:8084",
      router: () => { },
    }),
  );
  // agent-service 是独立进程,同源代理免 CORS;pathRewrite 剥掉前缀
  app.use(
    createProxyMiddleware("/agent-api", {
      changeOrigin: true,
      target: process.env.AGENT_SERVICE_URL || "http://localhost:8087",
      pathRewrite: { "^/agent-api": "" },
    }),
  );
};
