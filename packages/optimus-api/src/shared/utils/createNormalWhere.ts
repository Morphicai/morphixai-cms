export function createNormalWhere(values = {}, keys = []) {
    return keys.reduce((acc, key) => {
        if (values[key] !== undefined) {
            acc[key] = values[key];
        }
        return acc;
    }, {});
}
