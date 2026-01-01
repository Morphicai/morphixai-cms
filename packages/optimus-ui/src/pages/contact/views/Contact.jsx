import { Table, Row, Col, Button } from "antd";
import { columns } from "../config/tableConfig";
import useContact from "../hooks/useContact";

export default function Contact() {
    const { manageAddresses, tableProps } = useContact();
    return (
        <>
            <Row>
                <Col span={24}>
                    <Button onClick={manageAddresses} type="primary">
                        管理收件人
                    </Button>
                </Col>
            </Row>
            <Table rowKey={(r) => r.id} {...tableProps} columns={columns} />
        </>
    );
}
