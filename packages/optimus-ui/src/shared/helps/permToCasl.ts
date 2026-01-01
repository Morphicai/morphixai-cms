/**
 * 权限列表转换成Casl Ability;
 */
import parseJson from "../utils/parseJson";
import lodash from "lodash";
// 拼接处最终的规则
export default function permToCasl(perms = [], permsData = {}) {
    return perms.map(({ code }) => {
        const newPermCode = permCodeTo(code, permsData);
        return newPermCode;
    });
}

function permCodeTo(codeStr, permsData = {}) {
    let newCodeStr = codeStr?.replace(/\$\{([^{}]+)\}/gi, (_, matchedStr) => {
        let val;
        try {
            val = lodash.get(permsData, matchedStr);
        } catch (error) {
            val = "";
        }

        return val;
    });
    const permCodeJson = parseJson(newCodeStr, null);
    if (permCodeJson) {
        permCodeJson?.subject &&
            (permCodeJson.subject = permCodeJson.subject.toLowerCase());
        return permCodeJson;
    }
    return { action: "read", subject: codeStr.toLowerCase() };
}
