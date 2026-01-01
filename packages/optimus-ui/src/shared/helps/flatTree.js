export default function flatTree(arr, childKey = "children", res = []) {
    arr.forEach((item) => {
        const newItem = { ...item };
        if (newItem[childKey]) {
            flatTree(newItem[childKey], childKey, res);
        }
        delete newItem[childKey];
        res.push(newItem);
    });
    return res;
}
