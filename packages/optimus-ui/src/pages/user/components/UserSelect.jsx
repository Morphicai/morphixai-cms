import { useState, useMemo } from "react";
import { AutoComplete } from "antd";
import { debounce } from "lodash";
import { userApi } from "../config/api";

export default function UserSelect({
    isLabel,
    sceneProps,
    formType,
    name,
    ...props
}) {
    const [list, setList] = useState([]);
    const fetchList = useMemo(() => {
        return debounce(async (value) => {
            if (!value) {
                return setList([]);
            }
            const {
                data: { list = [] },
            } = await userApi.list({ pageNo: 0, [name]: value });
            const userList = list.map((item) => {
                return { label: item[name], value: item[name] };
            });
            setList(userList);
        }, 300);
        //eslint-disable-next-line
    }, []);
    return (
        <AutoComplete
            placeholder={"请输入" + props.label}
            {...props}
            name={name}
            onSearch={(value) => {
                fetchList(value);
                // setValue(value);
            }}
            options={list}
        ></AutoComplete>
    );
}
