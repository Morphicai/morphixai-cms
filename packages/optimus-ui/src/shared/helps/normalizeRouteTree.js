export default function normalizeRouteTree(
    source = [],
    { root = "0", pidKey = "pid", idKey = "id", childKey = "children" },
) {
    source = source.map((s) => {
        if (!s.parent_id) {
            s.parent_id = "0";
        }
        return s;
    });
    function getNode(id) {
        const node = [];
        for (let i = 0, len = source.length; i < len; i++) {
            if (Number(source[i][pidKey]) === Number(id)) {
                const children = getNode(source[i][idKey]);
                if (children.length > 0) {
                    source[i][childKey] = children;
                }
                node.push(source[i]);
            }
        }
        return node;
    }
    return getNode(root);
}
