import { readFileSync } from "fs";
import yaml from "js-yaml";
import { join } from "path";

const configFileNameObj = {
    development: "dev",
    test: "test",
    production: "prod",
    e2e: "e2e",
};

const env = process.env.NODE_ENV || "production";

// 需要保持为字符串的字段（即使是纯数字）
const STRING_FIELDS = ["password", "keyPrefix", "secretkey"];

// 替换环境变量的函数
function replaceEnvVars(str: string, fieldPath = ""): any {
    const result = str.replace(/\$\{([^}]+)\}/g, (match, varName) => {
        // 处理包含冒号的默认值（如URL）
        const colonIndex = varName.indexOf(":");
        if (colonIndex === -1) {
            // 没有默认值
            return process.env[varName] || "";
        }

        const name = varName.substring(0, colonIndex);
        const defaultValue = varName.substring(colonIndex + 1);
        return process.env[name] || defaultValue || "";
    });

    // 检查是否是需要保持为字符串的字段
    const shouldKeepAsString = STRING_FIELDS.some((field) => fieldPath.toLowerCase().includes(field.toLowerCase()));

    if (shouldKeepAsString) {
        return result;
    }

    // 尝试转换为适当的数据类型
    if (result === "true") return true;
    if (result === "false") return false;
    if (/^\d+$/.test(result)) return parseInt(result, 10);
    if (/^\d+\.\d+$/.test(result)) return parseFloat(result);

    return result;
}

// 递归处理对象中的所有字符串值
function processConfig(obj: any, path = ""): any {
    if (typeof obj === "string") {
        return replaceEnvVars(obj, path);
    } else if (Array.isArray(obj)) {
        return obj.map((item, index) => processConfig(item, `${path}[${index}]`));
    } else if (obj && typeof obj === "object") {
        const result: any = {};
        for (const key in obj) {
            const newPath = path ? `${path}.${key}` : key;
            result[key] = processConfig(obj[key], newPath);
        }
        return result;
    }
    return obj;
}

export default () => {
    const configFileName = configFileNameObj[env];

    if (!configFileName) {
        throw new Error(`Invalid NODE_ENV: "${env}". Must be one of: ${Object.keys(configFileNameObj).join(", ")}`);
    }

    const envFilePath = `./${configFileName}.yml`;
    const configFile = readFileSync(join(__dirname, envFilePath), "utf8");
    const config = yaml.load(configFile) as Record<string, any>;
    return processConfig(config);
};
