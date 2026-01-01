import { Button, Space } from "antd";

const noop = (n) => n;

// 用于编辑的 Buttons
// TODO :后续可以加上其他按钮
export default function ActionButtons({ onEdit = noop, onDelete = noop }) {
    return (
        <Space>
            <Button type="primary" onClick={onEdit}>
                编辑
            </Button>
            <Button onClick={onDelete}>删除</Button>
        </Space>
    );
}
