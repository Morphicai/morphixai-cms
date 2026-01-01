export function hasInObject(obj: any, value: string): boolean {
    if (!value || !obj) {
        return false;
    }
    return value in obj;
}
