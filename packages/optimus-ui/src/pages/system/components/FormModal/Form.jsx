import { useImperativeHandle, forwardRef } from "react";
import { Input, Form } from "antd";

export default forwardRef(({ data = {}, formItemProps = {} }, ref) => {
    const [form] = Form.useForm();
    useImperativeHandle(ref, () => ({ form }));

    return (
        <Form
            form={form}
            name="basic"
            labelCol={formItemProps.labelCol || { span: 6 }}
            wrapperCol={formItemProps.wrapperCol || { span: 18 }}
            autoComplete="off"
            style={{ marginTop: 24 }}
        >
            <Form.Item 
                label="原始密码" 
                name="password"
                rules={[
                    { required: true, message: '请输入原始密码' }
                ]}
                style={{ marginBottom: 24 }}
            >
                <Input.Password placeholder="原始密码" />
            </Form.Item>
            <Form.Item 
                label="新密码" 
                name="newPassword"
                rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码至少6个字符' }
                ]}
                style={{ marginBottom: 24 }}
            >
                <Input.Password placeholder="新密码" />
            </Form.Item>
            <Form.Item 
                label="重复新密码" 
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                    { required: true, message: '请再次输入新密码' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'));
                        },
                    }),
                ]}
                style={{ marginBottom: 24 }}
            >
                <Input.Password placeholder="重复新密码" />
            </Form.Item>
        </Form>
    );
});
