import { Button } from "antd";

const noop = (n) => n;

export default function DocumentActionButtons({
    onEdit = noop,
    onDelete = noop,
}) {
    return (
        <>
            <Button type="primary" onClick={onEdit}>
                编辑
            </Button>
            <Button onClick={onDelete}>删除</Button>
        </>
    );
}
