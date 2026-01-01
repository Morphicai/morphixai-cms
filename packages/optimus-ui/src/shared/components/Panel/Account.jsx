import React from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Dropdown, Avatar } from "antd";
import { GlobalConsumer } from "../../../shared/contexts/useGlobalContext";

export default function Account({ onLogout = () => {} }) {
    const navigate = useNavigate();

    const onClick = ({ key }) => {
        if (key === "1") {
            return onLogout();
        }
        if (key === "0") {
            return navigate("/sys/profile");
        }
    };

    const menu = (
        <Menu onClick={onClick}>
            <Menu.Item key="0">修改密码</Menu.Item>
            <Menu.Divider />
            <Menu.Item key="1">退出</Menu.Item>
        </Menu>
    );

    return (
        <GlobalConsumer>
            {({ userInfo }) => (
                <Dropdown overlay={menu}>
                    {userInfo.avatar ? (
                        <Avatar src={userInfo.avatar} />
                    ) : (
                        <Avatar style={{ backgroundColor: "#87d068" }}>
                            {userInfo.fullName}
                        </Avatar>
                    )}
                </Dropdown>
            )}
        </GlobalConsumer>
    );
}
