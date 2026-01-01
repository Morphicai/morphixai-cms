import { useRef, useEffect } from "react";
import { Row, Col, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../../apis/user";
import * as modal from "../components/FormModal";

const Footer = ({ onOk = () => {}, children = "修改密码" }) => (
    <Row justify="end" style={{ marginTop: 24 }}>
        <Col>
            <Button onClick={onOk} type="primary" size="large">
                {children}
            </Button>
        </Col>
    </Row>
);

export default function Setting() {
    const settingRef = useRef();
    const navigate = useNavigate();

    const onSubmit = async (formData) => {
        try {
            const res = await changePassword({ data: formData });
            if (res.success) {
                message.success("修改成功");
                navigate("/");
            } else {
                message.error(res.message || "修改失败");
            }
            return res;
        } catch (error) {
            message.error(error.message || "修改密码时发生错误");
            throw error;
        }
    };

    useEffect(() => {
        modal.edit({
            noModal: true,
            getContainer: () => settingRef.current,
            submit: onSubmit,
            renderFooter: ({ onOk }) => <Footer onOk={onOk} />,
        });
        // eslint-disable-next-line
    }, []);

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "calc(100vh - 120px)",
                padding: "24px",
            }}
        >
            <div
                ref={settingRef}
                style={{
                    width: "100%",
                    maxWidth: "600px",
                    backgroundColor: "#fff",
                    padding: "32px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                }}
            />
        </div>
    );
}
