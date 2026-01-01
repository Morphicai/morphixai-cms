export default function flat(arrs = [], key) {
    const list = [];
    const _arrs = [...arrs];
    while (_arrs.length > 0) {
        const head = _arrs.shift();
        const cur = head[key];
        if (cur && Array.isArray(cur)) {
            _arrs.unshift(...cur);
        }
        list.push(head);
    }
    return list;
}
