import React from 'react';
import { Modal, Form, Input } from 'antd';

const { TextArea } = Input;

const ReviewModal = ({ visible, action, submission, onCancel, onOk }) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      await onOk(values);
      form.resetFields();
    } catch (error) {
      // 表单验证失败
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={action === 'approve' ? '审核通过' : '审核拒绝'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确定"
      cancelText="取消"
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="提交码">
          <Input value={submission?.submissionCode} disabled />
        </Form.Item>

        <Form.Item
          name="reviewRemark"
          label={action === 'approve' ? '审核备注（可选）' : '拒绝原因（必填）'}
          rules={
            action === 'reject'
              ? [{ required: true, message: '请输入拒绝原因' }]
              : []
          }
        >
          <TextArea
            rows={4}
            placeholder={
              action === 'approve'
                ? '请输入审核备注（可选）'
                : '请输入拒绝原因，用户可以根据原因修改后重新提交'
            }
            maxLength={500}
            showCount
          />
        </Form.Item>

        {action === 'approve' && (
          <div style={{ color: '#52c41a', marginTop: 8 }}>
            审核通过后，系统将自动为该合伙人发放积分奖励
          </div>
        )}

        {action === 'reject' && (
          <div style={{ color: '#ff4d4f', marginTop: 8 }}>
            审核拒绝后，用户可以根据拒绝原因修改后重新提交
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ReviewModal;
