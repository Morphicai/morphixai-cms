import { useImperativeHandle, forwardRef } from "react";
import { Form } from "antd";
import EditableTagGroup from "../EditableTagGroup";

export default forwardRef(({ initialValues = [] }, ref) => {
    const [form] = Form.useForm();
    useImperativeHandle(ref, () => ({ form }));
    return (
        <Form
            form={form}
            name="basic"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 20 }}
            style={{ padding: "20px 0" }}
            autoComplete="off"
        >
            <Form.Item label="收件人" name="tags" initialValue={initialValues}>
                <EditableTagGroup />
            </Form.Item>
        </Form>
    );
});
