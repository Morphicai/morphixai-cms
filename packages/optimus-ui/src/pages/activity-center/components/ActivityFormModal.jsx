import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';
import ActivityService from '../../../services/ActivityService';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

/**
 * 活动类型选项
 */
const ACTIVITY_TYPE_OPTIONS = [
  { label: '福利领取', value: 'welfare_claim' },
  { label: '充值返利', value: 'recharge_rebate' },
];

/**
 * 活动状态选项
 */
const ACTIVITY_STATUS_OPTIONS = [
  { label: '开启', value: 'enabled' },
  { label: '关闭', value: 'disabled' },
];



/**
 * 活动表单弹窗组件
 */
const ActivityFormModal = ({ visible, record, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!record;

  useEffect(() => {
    if (visible) {
      if (record) {
        // 编辑模式：填充表单数据
        form.setFieldsValue({
          activityCode: record.activityCode,
          name: record.name,
          type: record.type,
          rules: record.rules,
          status: record.status || 'disabled',
          maxClaimTimes: record.maxClaimTimes || 1,
          timeRange: record.startTime && record.endTime
            ? [dayjs(record.startTime), dayjs(record.endTime)]
            : null,
        });
      } else {
        // 新建模式：重置表单
        form.resetFields();
      }
    }
  }, [visible, record, form]);

  // 处理提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const { timeRange, ...otherValues } = values;

      // 处理时间范围
      const startTime = timeRange && timeRange[0] ? timeRange[0].toISOString() : null;
      const endTime = timeRange && timeRange[1] ? timeRange[1].toISOString() : null;

      const data = {
        ...otherValues,
        startTime,
        endTime,
      };

      let result;
      if (isEdit) {
        result = await ActivityService.update(record.id, data);
      } else {
        result = await ActivityService.create(data);
      }

      if (result.success) {
        message.success(isEdit ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        message.error(result.error || (isEdit ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('提交失败:', error);
      if (error.errorFields) {
        // 表单验证错误
        return;
      }
      message.error('操作失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑活动' : '新建活动'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="activityCode"
          label="活动代码"
          rules={[
            { required: true, message: '请输入活动代码' },
            { pattern: /^[a-zA-Z0-9_]+$/, message: '活动代码只能包含字母、数字和下划线' },
          ]}
        >
          <Input
            placeholder="请输入活动代码（唯一标识）"
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="活动名称"
          rules={[{ required: true, message: '请输入活动名称' }]}
        >
          <Input placeholder="请输入活动名称" />
        </Form.Item>

        <Form.Item
          name="type"
          label="活动类型"
          rules={[{ required: true, message: '请选择活动类型' }]}
        >
          <Select placeholder="请选择活动类型" options={ACTIVITY_TYPE_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="timeRange"
          label="活动时间"
          rules={[{ required: true, message: '请选择活动时间范围' }]}
        >
          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            style={{ width: '100%' }}
            placeholder={['开始时间', '结束时间']}
          />
        </Form.Item>

        <Form.Item
          name="status"
          label="活动状态"
          rules={[{ required: true, message: '请选择活动状态' }]}
          initialValue="disabled"
          tooltip="只有开启状态的活动才能被用户领取"
        >
          <Select placeholder="请选择活动状态" options={ACTIVITY_STATUS_OPTIONS} />
        </Form.Item>

        <Form.Item
          name="maxClaimTimes"
          label="最大领取次数（按用户维度）"
          rules={[
            { required: true, message: '请输入最大领取次数' },
            { type: 'number', min: 1, message: '最大领取次数不能小于1' },
          ]}
          initialValue={1}
          tooltip="每个用户在该活动中最多可以领取的次数"
        >
          <InputNumber
            min={1}
            precision={0}
            placeholder="请输入最大领取次数（默认1次）"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="rules"
          label="活动规则说明"
        >
          <TextArea
            rows={4}
            placeholder="请输入活动规则说明（可选）"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ActivityFormModal;

