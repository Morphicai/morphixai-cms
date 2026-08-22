const path = require("path");
const dotenv = require("dotenv");
const resolve = (dir) => path.resolve(__dirname, dir);

// 从当前项目目录加载环境变量文件
const nodeEnv = process.env.NODE_ENV || "development";

// 加载当前项目的环境变量文件（按优先级顺序，后加载的会覆盖先加载的）
// 优先级从低到高：.env -> .env.{NODE_ENV} -> .env.{NODE_ENV}.local -> .env.local
const envFiles = [
  path.join(__dirname, `.env.local`),
  path.join(__dirname, `.env.${nodeEnv}.local`),
  path.join(__dirname, `.env.${nodeEnv}`),
  path.join(__dirname, `.env`),
];

envFiles.forEach((envFile) => {
  dotenv.config({ path: envFile });
});

function addToBabel(moduleName, webpackConfig) {
  const rules = webpackConfig.module.rules[1].oneOf;

  rules.some((rule, index) => {
    if (rule && rule.test && rule.test.toString().indexOf("jsx") > -1) {
      rule.include = [
        rule.include,
        path.resolve(__dirname, "./node_modules/" + moduleName),
        path.resolve(__dirname, "../node_modules/" + moduleName),
        path.resolve(__dirname, "../" + moduleName),
      ];
      rules[index] = rule;
      return true;
    }
    return false;
  });
  return webpackConfig;
}

module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
      ],
    },
  },
  webpack: {
    alias: {
      "@": resolve("src"),
    },
    configure: (webpackConfig, { env, paths }) => {
      // 增加ts支持
      webpackConfig.resolve.extensions.push(".ts", ".tsx");
      // table-engine babel processing removed
      addToBabel("common", webpackConfig);

      // 在生产环境中移除 React Refresh 插件
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.plugins = webpackConfig.plugins.filter(
          plugin => plugin.constructor.name !== 'ReactRefreshPlugin'
        );
      }

      // harness-fe 运行时观测：开发期把本后台作为被观测应用接入本机 solo daemon，
      // 便于用 MCP 工具直接看页面 console/network/异常和源码定位（data-morphix-loc）。
      // 插件自身在生产构建零注入，这里再加一道环境判断，HARNESS_FE=0 可显式关掉。
      if (process.env.NODE_ENV !== 'production' && process.env.HARNESS_FE !== '0') {
        const { harnessFE } = require('@harness-fe/webpack');
        webpackConfig.plugins.push(
          harnessFE({
            projectId: 'optimus-admin',
            // 端口 47729 是 harness solo daemon 的默认端口；/ws 路径必须显式带上——
            // 插件注入的默认 mcpUrl 不带路径，而 daemon 的 WS 端点在 /ws，
            // 裸端口握手会静默挂起（插件与 runtime 两包的默认值不一致）
            mcpUrl: 'ws://127.0.0.1:47729/ws',
            overlay: true,
          })
        );
      }

      return webpackConfig;
    },
  },
  babel: {
    loaderOptions: (babelLoaderOptions, { env, paths }) => {
      // 在生产环境中移除 React Refresh Babel 插件
      if (process.env.NODE_ENV === 'production' && babelLoaderOptions.plugins) {
        babelLoaderOptions.plugins = babelLoaderOptions.plugins.filter(
          plugin => {
            if (Array.isArray(plugin)) {
              return !plugin[0].includes('react-refresh');
            }
            return !plugin.includes('react-refresh');
          }
        );
      }
      return babelLoaderOptions;
    },
  },
  eslint: {
    // 禁用 ESLint 以避免在 pnpm workspace 中的插件冲突
    enable: false,
  },
  // CracoLessPlugin 已移除，Ant Design 5 使用 CSS-in-JS
  // 主题配置现在通过 ConfigProvider 的 theme 属性进行
  plugins: [],
};
