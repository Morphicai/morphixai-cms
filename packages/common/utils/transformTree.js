export default function transformTree(
    list,
    parentKey = "parentId",
    parentId = "0",
) {
    const tree = [];
    const record = {};
    for (let i = 0, len = list.length; i < len; i++) {
        const item = list[i];
        const id = item.id;

        if (!record[id]) {
            record[id] = { children: [], parent: item };
        }
        if (!record[id].parent) {
            record[id].parent = item;
        }
        if (record[id].children.length > 0) {
            item.children = record[id].children;
        }

        if (item[parentKey] && item[parentKey] != parentId) {
            if (!record[item[parentKey]]) {
                record[item[parentKey]] = { children: [] };
            }
            record[item[parentKey]]["children"].push(item);
            if (record[item[parentKey]].parent) {
                record[item[parentKey]].parent.children =
                    record[item[parentKey]]["children"];
            }
        } else {
            tree.push(item);
        }
    }

    return tree;
}
