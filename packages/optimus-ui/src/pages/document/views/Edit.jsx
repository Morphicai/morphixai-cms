import { useRef, useEffect } from "react";
import { Row, Col, Button, message, Space } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { SaveOutlined, RollbackOutlined } from "@ant-design/icons";
import createDocumentParams from "../helps/createDocumentParams";
import * as documentApi from "../../../apis/document";
import * as modal from "../components/FormModal";

const Footer = ({ onOk = () => {}, onCancel = () => {}, children = "保存" }) => (
    <Row justify="end" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)' }}>
        <Col>
            <Space>
                <Button onClick={onCancel} icon={<RollbackOutlined />}>
                    返回列表
                </Button>
                <Button onClick={onOk} type="primary" icon={<SaveOutlined />}>
                    {children}
                </Button>
            </Space>
        </Col>
    </Row>
);

export default function DocumentEdit() {
    const docRef = useRef();
    const titleRef = useRef();
    const location = useLocation();
    const navigate = useNavigate();

    const updateDocById = async (value) => {
        const res = await documentApi.updateDocumentById(
            createDocumentParams(value),
        );
        if (res.success) {
            message.success("更新成功");
        } else {
            message.error("更新失败！" + res.msg);
        }
        return res;
    };

    useEffect(() => {
        const handleCancel = () => {
            navigate('/document');
        };

        const id = location.pathname.split("/").pop();
        id &&
            documentApi.getResById({ id }).then((res) => {
                // 更新标题为文案的描述
                if (titleRef.current && res.data?.description) {
                    titleRef.current.textContent = res.data.description;
                }

                modal.edit({
                    noModal: true,
                    data: res.data || {},
                    getContainer: () => docRef.current,
                    submit: updateDocById,
                    renderFooter: ({ onOk }) => <Footer onOk={onOk} onCancel={handleCancel} />,
                });
            });
    }, [location.pathname, navigate]);

    return (
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', minHeight: '100%' }}>
            <div style={{ marginBottom: '16px' }}>
                <h2 
                    ref={titleRef}
                    style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)' }}
                >
                    加载中...
                </h2>
            </div>
            <div ref={docRef} />
        </div>
    );
}
