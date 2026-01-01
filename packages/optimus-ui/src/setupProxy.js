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
};
