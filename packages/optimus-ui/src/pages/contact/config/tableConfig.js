import { formatDate } from "../../../shared/utils/date";

export const columns = [
    {
        title: "ID",
        dataIndex: "id",
        key: "id",
    },
    {
        title: "Email",
        dataIndex: "email",
        key: "email",
    },
    {
        title: "昵称",
        dataIndex: "nickName",
        key: "nickName",
    },
    {
        title: "时间",
        key: "createDate",
        dataIndex: "createDate",
        render: (text, record) => {
            const d = new Date(text);
            return formatDate(d, "short");
        },
    },
    {
        title: "留言",
        key: "message",
        dataIndex: "message",
    },
];
