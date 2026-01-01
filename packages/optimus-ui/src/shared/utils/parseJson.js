export default function parseJson(str, defaultValue = {}) {
    if (typeof str === "string") {
        try {
            return JSON.parse(str);
        } catch (error) {
            return defaultValue;
        }
    }
    return str;
}
